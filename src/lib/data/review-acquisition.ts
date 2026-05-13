"use server"

import { createHmac } from "crypto"
import { sendTemplatedEmail } from "@lib/postmark"

/**
 * Review-acquisition post-purchase email flow (#96).
 *
 * GP has ~76 total reviews across Google + Yelp after 22 years —
 * ~3.5 reviews/year vs the 200-400+ a similarly-tenured local
 * business should have. The bottleneck is volume, not rating
 * (Google 4.8★ / Yelp 4.6★ already excellent). This flow asks
 * customers for a review on a scheduled trigger:
 *
 *   - First-time customers   → 7 days post-delivery
 *   - Repeat customers       → 30 days post-delivery
 *   - Atlanta-zip customers  → +30-day Yelp followup after Google
 *
 * Trigger schedule lives in `src/app/api/cron/review-acquisition/route.ts`
 * (Vercel cron, daily). That route walks recently-delivered orders,
 * looks up customer review status, and calls this action for the
 * eligible ones. Manual asks (e.g. "send to this specific customer
 * right now") also call this action directly.
 *
 * Suppression rules — handled at the cron-route layer, not here:
 *   - Customer already left a Google review (would require Google
 *     My Business read; deferred to follow-up)
 *   - Wholesale / B2B account
 *   - Customer's email is in the manual block list (Strapi follow-up)
 *
 * Postmark template alias: `review-acquisition`. Template model:
 *   - first_name             — "Avi" / "there"
 *   - google_review_url      — pre-filled with GP's place_id
 *   - yelp_review_url        — only set for Atlanta zips
 *   - order_summary          — single-line "your X order from
 *                              March 4" so the email feels personal
 *   - reorder_url            — deep link back to the storefront with
 *                              the customer's last cart items pre-loaded
 *   - unsubscribe_url        — pulls from CAN-SPAM-required link
 */

const GOOGLE_REVIEW_URL =
  process.env.GOOGLE_REVIEW_URL ||
  "https://search.google.com/local/writereview?placeid=ChIJl1PD2v8E9YgRGrillersPride"

const YELP_REVIEW_URL =
  process.env.YELP_REVIEW_URL ||
  "https://www.yelp.com/writeareview/biz/grillers-pride-atlanta"

export type ReviewAcquisitionInput = {
  email: string
  firstName?: string
  orderId: string
  orderSummary?: string
  /** Whether to include the Yelp ask (Atlanta-area customers). */
  includeYelp?: boolean
  /** Storefront URL to suggest a reorder. */
  reorderUrl?: string
}

/**
 * Sign the email so the unsubscribe link can authenticate without
 * exposing the address as a URL param (Codex review on #96 — the
 * original implementation leaked `?email=…` which any access log
 * would capture). The handler verifies HMAC and updates a Strapi
 * suppression record / Medusa customer.metadata flag accordingly.
 */
function makeUnsubscribeUrl(baseUrl: string, email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || ""
  // Use a deterministic HMAC so the same email always generates the
  // same token — repeated emails to the same person are coalesced
  // by Postmark + the unsubscribe handler.
  const sig = createHmac("sha256", secret)
    .update(`reviews:${email.toLowerCase()}`)
    .digest("base64url")
  const buf = Buffer.from(email.toLowerCase(), "utf8").toString("base64url")
  return `${baseUrl}/api/unsubscribe?type=reviews&u=${buf}&s=${sig}`
}

export async function sendReviewAcquisitionEmail(
  input: ReviewAcquisitionInput
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  if (!input.email || !input.orderId) {
    return { ok: false, error: "Missing required fields." }
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.grillerspride.com"
  ).replace(/\/+$/, "")

  const result = await sendTemplatedEmail({
    to: input.email,
    templateAlias: "review-acquisition",
    templateModel: {
      first_name: input.firstName || "there",
      google_review_url: GOOGLE_REVIEW_URL,
      yelp_review_url: input.includeYelp ? YELP_REVIEW_URL : "",
      include_yelp: !!input.includeYelp,
      order_summary: input.orderSummary || "",
      reorder_url: input.reorderUrl || `${baseUrl}/us/account/reorder`,
      unsubscribe_url: makeUnsubscribeUrl(baseUrl, input.email),
    },
    tag: "review-acquisition",
    metadata: {
      order_id: input.orderId,
    },
  })

  if (!result.ok) {
    console.error("[review-acquisition] Postmark send failed", result.message)
    return { ok: false, error: result.message }
  }
  return { ok: true, messageId: result.messageId }
}
