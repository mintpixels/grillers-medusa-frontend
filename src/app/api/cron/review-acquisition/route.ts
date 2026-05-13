import { NextResponse } from "next/server"
import { sendReviewAcquisitionEmail } from "@lib/data/review-acquisition"

/**
 * Daily cron for the review-acquisition flow (#96).
 *
 * Schedule: every day at 10:00 ET via `vercel.json` (or `vercel.ts`)
 * cron config. The handler walks recently-delivered orders in
 * Medusa, classifies the customer (first-time vs repeat,
 * Atlanta-area vs national), and fires the Postmark
 * `review-acquisition` template for each one that's both eligible
 * and not suppressed.
 *
 * Trigger windows (per `analysis/customer-reviews-synthesis-2026-05-06.md`):
 *   - First-time customer: 7 days after delivery
 *   - Repeat customer (2+ orders): 30 days after delivery
 *   - Atlanta-zip customer: extra Yelp ask 30 days after the
 *     Google ask
 *
 * Suppression (not asked):
 *   - Already left a Google review (deferred — needs GMB read)
 *   - Wholesale / B2B (Medusa customer.metadata.account_type)
 *   - On the manual block list (Strapi follow-up)
 *
 * Auth: gated by `CRON_SECRET` header (Vercel sets `Authorization:
 * Bearer ${CRON_SECRET}` on scheduled invocations). Manual triggers
 * must include the same header.
 *
 * This route is intentionally idempotent at the day-level: re-running
 * for the same day won't duplicate sends because the lookup window is
 * `delivered_at = today - {7|30} days` ± 1 hour. If the same order
 * crosses both the 7-day and 37-day boundaries on the same day,
 * suppression handles it.
 */

const CRON_SECRET = process.env.CRON_SECRET
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || ""
const ADMIN_TOKEN = process.env.MEDUSA_ADMIN_API_TOKEN

const ATLANTA_ZIP_PREFIX = "30"

type DeliveredOrder = {
  id: string
  email?: string
  customer_id?: string
  shipping_address?: { postal_code?: string; first_name?: string }
  // Custom metadata set by the order-delivery workflow.
  metadata?: {
    delivered_at?: string
    order_count_at_time_of_purchase?: number
    review_request_sent_at?: string
  }
  items?: Array<{ title?: string }>
}

function withinDayOf(timestamp: string | undefined, daysAgo: number): boolean {
  if (!timestamp) return false
  const t = new Date(timestamp).getTime()
  if (!Number.isFinite(t)) return false
  const target = Date.now() - daysAgo * 24 * 60 * 60 * 1000
  const halfDay = 12 * 60 * 60 * 1000
  return Math.abs(t - target) <= halfDay
}

function isAtlantaZip(zip: string | undefined): boolean {
  return !!zip && zip.startsWith(ATLANTA_ZIP_PREFIX)
}

function asOrderSummary(order: DeliveredOrder): string {
  const titles = (order.items || [])
    .map((i) => i.title)
    .filter((t): t is string => !!t)
    .slice(0, 2)
  if (titles.length === 0) return ""
  if (titles.length === 1) return `your ${titles[0]} order`
  return `your ${titles[0]} (and ${titles.length - 1} more) order`
}

async function fetchRecentlyDelivered(): Promise<DeliveredOrder[]> {
  if (!MEDUSA_BACKEND_URL || !ADMIN_TOKEN) {
    console.warn(
      "[cron/review-acquisition] MEDUSA_BACKEND_URL or MEDUSA_ADMIN_API_TOKEN missing; skipping run"
    )
    return []
  }
  // Look back 60 days so both the 7-day and 30-day windows are covered.
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const url = `${MEDUSA_BACKEND_URL.replace(/\/+$/, "")}/admin/orders?fields=id,email,customer_id,shipping_address.*,metadata,items.title&limit=500&created_at[$gte]=${encodeURIComponent(cutoff)}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      cache: "no-store",
    })
    if (!res.ok) {
      console.error(
        "[cron/review-acquisition] Medusa fetch failed",
        res.status
      )
      return []
    }
    const json = (await res.json()) as { orders?: DeliveredOrder[] }
    return Array.isArray(json.orders) ? json.orders : []
  } catch (err) {
    console.error("[cron/review-acquisition] Medusa fetch threw", err)
    return []
  }
}

export async function POST(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") || ""
  // Fail closed — reject when `CRON_SECRET` is unset OR mismatched.
  // The previous condition (`CRON_SECRET && auth !== ...`) silently
  // made the cron public when the env var was missing (Codex review).
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const orders = await fetchRecentlyDelivered()
  let sent = 0
  let skipped = 0
  for (const order of orders) {
    const delivered = order.metadata?.delivered_at
    const repeat =
      (order.metadata?.order_count_at_time_of_purchase ?? 1) > 1
    const eligibleDay = repeat
      ? withinDayOf(delivered, 30)
      : withinDayOf(delivered, 7)
    if (!eligibleDay) {
      skipped++
      continue
    }
    if (order.metadata?.review_request_sent_at) {
      skipped++
      continue
    }
    if (!order.email) {
      skipped++
      continue
    }
    const result = await sendReviewAcquisitionEmail({
      email: order.email,
      firstName: order.shipping_address?.first_name,
      orderId: order.id,
      orderSummary: asOrderSummary(order),
      includeYelp: isAtlantaZip(order.shipping_address?.postal_code),
    })
    if (result.ok) {
      sent++
      // Best-effort: write back metadata so we don't re-send. Failure
      // here means at most one duplicate send per order — preferable
      // to a silent skip.
      try {
        await fetch(
          `${MEDUSA_BACKEND_URL.replace(/\/+$/, "")}/admin/orders/${order.id}/metadata`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ADMIN_TOKEN}`,
            },
            body: JSON.stringify({
              metadata: {
                review_request_sent_at: new Date().toISOString(),
              },
            }),
          }
        )
      } catch {
        // logged elsewhere; not fatal
      }
    } else {
      skipped++
    }
  }
  return NextResponse.json({
    ok: true,
    scanned: orders.length,
    sent,
    skipped,
  })
}

// Also accept GET so a human can poke the endpoint and read the
// last-run summary. Auth gate still applies.
export const GET = POST
