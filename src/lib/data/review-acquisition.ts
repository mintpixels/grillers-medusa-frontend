"use server"

import { createHmac } from "crypto"
import { sendTemplatedEmail } from "@lib/postmark"

/**
 * Review-acquisition post-purchase email flow (#96).
 *
 * This module owns the customer-facing send. The daily cron decides
 * eligibility and writes the idempotency flags; this sender only
 * renders the correct Postmark template model.
 */

export type ReviewAskKind =
  | "google_first_time"
  | "google_repeat"
  | "yelp_atlanta_followup"

export type ReviewAcquisitionInput = {
  email: string
  firstName?: string
  orderId: string
  orderSummary?: string
  kind: ReviewAskKind
  reorderUrl?: string
}

const TEMPLATE_ALIASES: Record<ReviewAskKind, string> = {
  google_first_time: "review-google-first-time",
  google_repeat: "review-google-repeat",
  yelp_atlanta_followup: "review-yelp-atlanta-followup",
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.grillerspride.com"
  ).replace(/\/+$/, "")
}

function getGoogleReviewDestination(): string {
  const explicit = process.env.GOOGLE_REVIEW_URL
  if (explicit) return explicit
  const placeId = process.env.GOOGLE_PLACE_ID
  if (!placeId) return ""
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
}

function getYelpReviewDestination(): string {
  const explicit = process.env.YELP_REVIEW_URL
  if (explicit) return explicit
  const slug = process.env.YELP_BIZ_SLUG || "grillers-pride-kosher-market-atlanta"
  return `https://www.yelp.com/writeareview/biz/${encodeURIComponent(slug)}`
}

/**
 * Sign the email so the unsubscribe link can authenticate without
 * exposing the address as a plain query param in logs.
 */
function makeUnsubscribeUrl(baseUrl: string, email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || ""
  if (!secret) return `${baseUrl}/us/email-preferences`
  const sig = createHmac("sha256", secret)
    .update(`reviews:${email.toLowerCase()}`)
    .digest("base64url")
  const buf = Buffer.from(email.toLowerCase(), "utf8").toString("base64url")
  return `${baseUrl}/api/unsubscribe?type=reviews&u=${buf}&s=${sig}`
}

function makeTrackedReviewUrl(opts: {
  baseUrl: string
  destination: string
  platform: "google" | "yelp"
  orderId: string
}): string {
  const secret =
    process.env.REVIEW_CLICK_SECRET ||
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    ""
  if (!secret) return opts.destination

  const encodedDestination = Buffer.from(opts.destination, "utf8").toString(
    "base64url"
  )
  const sig = createHmac("sha256", secret)
    .update(`${opts.platform}:${opts.orderId}:${encodedDestination}`)
    .digest("base64url")

  const params = new URLSearchParams({
    platform: opts.platform,
    order: opts.orderId,
    d: encodedDestination,
    s: sig,
  })
  return `${opts.baseUrl}/api/review-click?${params.toString()}`
}

export async function sendReviewAcquisitionEmail(
  input: ReviewAcquisitionInput
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  if (!input.email || !input.orderId) {
    return { ok: false, error: "Missing required fields." }
  }

  const baseUrl = getBaseUrl()
  const googleDestination = getGoogleReviewDestination()
  const yelpDestination = getYelpReviewDestination()
  const isYelp = input.kind === "yelp_atlanta_followup"
  const destination = isYelp ? yelpDestination : googleDestination

  if (!destination) {
    return {
      ok: false,
      error: isYelp
        ? "Yelp review URL missing."
        : "GOOGLE_PLACE_ID or GOOGLE_REVIEW_URL missing.",
    }
  }

  const googleReviewUrl = googleDestination
    ? makeTrackedReviewUrl({
        baseUrl,
        destination: googleDestination,
        platform: "google",
        orderId: input.orderId,
      })
    : ""
  const yelpReviewUrl = yelpDestination
    ? makeTrackedReviewUrl({
        baseUrl,
        destination: yelpDestination,
        platform: "yelp",
        orderId: input.orderId,
      })
    : ""

  const result = await sendTemplatedEmail({
    to: input.email,
    templateAlias: TEMPLATE_ALIASES[input.kind],
    templateModel: {
      first_name: input.firstName || "there",
      google_review_url: googleReviewUrl,
      yelp_review_url: yelpReviewUrl,
      order_summary: input.orderSummary || "your order",
      reorder_url: input.reorderUrl || `${baseUrl}/us/account/reorder`,
      unsubscribe_url: makeUnsubscribeUrl(baseUrl, input.email),
    },
    tag: "review-acquisition",
    metadata: {
      order_id: input.orderId,
      review_ask_kind: input.kind,
    },
  })

  if (!result.ok) {
    console.error("[review-acquisition] Postmark send failed", result.message)
    return { ok: false, error: result.message }
  }
  return { ok: true, messageId: result.messageId }
}
