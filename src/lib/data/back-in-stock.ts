"use server"

import { randomBytes } from "crypto"
import { sendTemplatedEmail } from "@lib/postmark"

const STRAPI_BASE = (
  process.env.STRAPI_ENDPOINT || ""
).replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

/**
 * Notify-me-when-back-in-stock — server action for the PDP capture
 * form (#102).
 *
 * Flow:
 *
 *   1. Lightweight email validation (regex on shape — Postmark and
 *      Strapi do the heavy lifting). Reject obvious garbage early so
 *      we never write a record we can't actually email.
 *   2. Create a `back-in-stock-request` record in Strapi via the
 *      public REST API. Strapi's Users-Permissions plugin must allow
 *      the public role to POST `api::back-in-stock-request` for this
 *      to work. Strapi-side storage means the restock trigger
 *      (whichever service owns it) can query a single source of truth
 *      when inventory crosses zero.
 *   3. Send the confirmation email via Postmark template
 *      `back-in-stock-confirm`. The unsubscribe link uses the
 *      single-use token from the Strapi record.
 *
 * Errors are swallowed at the boundary — the customer sees the same
 * "we'll let you know" success state regardless of whether the email
 * vendor or Strapi briefly failed. The full error chain is logged
 * server-side via `console.error` for Vercel function logs.
 *
 * Idempotency: repeated submissions from the same email + product
 * create multiple Strapi records on purpose. The restock trigger
 * collapses duplicates before sending so the customer never gets
 * spammed. Doing it at the boundary would require a database read
 * inside this hot path for marginal benefit.
 */

export type RequestBackInStockResult = {
  ok: boolean
  error?: string
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

function generateUnsubscribeToken(): string {
  return randomBytes(24).toString("base64url")
}

async function persistToStrapi(payload: {
  Email: string
  MedusaProductId: string
  MedusaVariantId?: string
  ProductHandle: string
  ProductTitle: string
  Sku?: string
  QuickBooksListId?: string
  RequestedFulfillmentDate?: string
  WaitlistReason?: "out_of_stock" | "allocated_out" | "future_unavailable"
  UnsubscribeToken: string
  Source: "pdp" | "side_cart" | "search"
}): Promise<{ ok: boolean; id?: number; documentId?: string }> {
  if (!STRAPI_BASE) {
    console.error("[back-in-stock] STRAPI_ENDPOINT not set; skipping persist")
    return { ok: false }
  }
  try {
    const res = await fetch(`${STRAPI_BASE}/api/back-in-stock-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ data: payload }),
      cache: "no-store",
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(
        `[back-in-stock] Strapi persist failed ${res.status}: ${text.slice(0, 200)}`
      )
      return { ok: false }
    }
    const json = (await res.json()) as {
      data?: { id?: number; documentId?: string }
    }
    return {
      ok: true,
      id: json.data?.id,
      documentId: json.data?.documentId,
    }
  } catch (err) {
    console.error("[back-in-stock] Strapi persist threw", err)
    return { ok: false }
  }
}

async function hasActiveSubscription(
  email: string,
  medusaProductId: string,
  medusaVariantId?: string
): Promise<boolean> {
  if (!STRAPI_BASE) return false
  try {
    const url =
      `${STRAPI_BASE}/api/back-in-stock-requests` +
      `?filters[Email][$eqi]=${encodeURIComponent(email)}` +
      `&filters[MedusaProductId][$eq]=${encodeURIComponent(medusaProductId)}` +
      (medusaVariantId
        ? `&filters[MedusaVariantId][$eq]=${encodeURIComponent(
            medusaVariantId
          )}`
        : "") +
      `&filters[NotifiedAt][$null]=true` +
      `&filters[UnsubscribedAt][$null]=true` +
      `&pagination[limit]=1`
    const res = await fetch(url, {
      headers: STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
        : {},
      cache: "no-store",
    })
    if (!res.ok) return false
    const json = (await res.json()) as { data?: unknown[] }
    return Array.isArray(json.data) && json.data.length > 0
  } catch {
    return false
  }
}

export async function requestBackInStockNotification(input: {
  email: string
  medusaProductId: string
  medusaVariantId?: string
  productHandle: string
  productTitle: string
  sku?: string
  quickBooksListId?: string
  requestedFulfillmentDate?: string
  waitlistReason?: "out_of_stock" | "allocated_out" | "future_unavailable"
  source?: "pdp" | "side_cart" | "search"
  /** Honeypot — must be empty for legit submissions. */
  honeypot?: string
}): Promise<RequestBackInStockResult> {
  const email = (input.email || "").trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }
  if (!input.medusaProductId || !input.productHandle) {
    // The PDP component always passes these; if they're missing
    // something is wrong on our side, not the customer's. Don't
    // surface internal detail.
    return { ok: false, error: "Something went wrong. Please try again." }
  }

  // Honeypot field — the form ships an invisible "company" input that
  // legitimate humans never touch. Bots that scrape form schemas and
  // fill every field will populate it; we silently 200 those.
  if (input.honeypot && input.honeypot.length > 0) {
    return { ok: true }
  }

  // De-dupe before sending. If this email has an active (un-unsubscribed)
  // subscription on this product, return ok without queuing another
  // confirmation email — the customer's already on the list.
  if (
    await hasActiveSubscription(
      email,
      input.medusaProductId,
      input.medusaVariantId
    )
  ) {
    return { ok: true }
  }

  const token = generateUnsubscribeToken()
  const persisted = await persistToStrapi({
    Email: email,
    MedusaProductId: input.medusaProductId,
    ...(input.medusaVariantId ? { MedusaVariantId: input.medusaVariantId } : {}),
    ProductHandle: input.productHandle,
    ProductTitle: input.productTitle || "your product",
    ...(input.sku ? { Sku: input.sku } : {}),
    ...(input.quickBooksListId
      ? { QuickBooksListId: input.quickBooksListId }
      : {}),
    ...(input.requestedFulfillmentDate
      ? { RequestedFulfillmentDate: input.requestedFulfillmentDate }
      : {}),
    WaitlistReason: input.waitlistReason || "out_of_stock",
    UnsubscribeToken: token,
    Source: input.source ?? "pdp",
  })

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.grillerspride.com"
  ).replace(/\/+$/, "")
  const productUrl = `${baseUrl}/us/products/${input.productHandle}`
  const unsubscribeUrl = `${baseUrl}/api/back-in-stock/unsubscribe?t=${encodeURIComponent(token)}`

  // Fire the confirmation email regardless of whether Strapi persist
  // succeeded — the customer's intent should still feel acknowledged
  // even if we have to manually rebuild the record from logs later.
  const send = await sendTemplatedEmail({
    to: email,
    templateAlias: "back-in-stock-confirm",
    templateModel: {
      product_title: input.productTitle,
      product_handle: input.productHandle,
      product_url: productUrl,
      unsubscribe_url: unsubscribeUrl,
    },
    tag: "back-in-stock-confirm",
    metadata: {
      medusa_product_id: input.medusaProductId,
      medusa_variant_id: input.medusaVariantId || "",
      sku: input.sku || "",
      strapi_id: persisted.documentId ?? "",
      source: input.source ?? "pdp",
    },
  })
  if (!send.ok) {
    console.error("[back-in-stock] Postmark send failed", send.message)
  }

  return { ok: true }
}
