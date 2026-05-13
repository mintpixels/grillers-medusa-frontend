import { NextResponse } from "next/server"

/**
 * Unsubscribe endpoint for back-in-stock requests (#102). The
 * Postmark confirmation email surfaces a link to this route with
 * the per-request single-use token as the `t` query param.
 *
 * Flow:
 *   1. Look up the matching Strapi `back-in-stock-request` by
 *      UnsubscribeToken via the public REST API.
 *   2. Update the record's `UnsubscribedAt` timestamp.
 *   3. Render a tiny confirmation HTML response.
 *
 * Token-based auth keeps the URL stateless — no session or cookie
 * required so the link works from anywhere. The token is one-use:
 * once unsubscribed, additional clicks idempotently confirm.
 *
 * Strapi REST permissions: the `public` role needs `find` + `update`
 * on `back-in-stock-request` for this to work. If those aren't
 * configured we fall back to a public confirmation message and log
 * the failure server-side so it gets noticed.
 */

const STRAPI_BASE = (process.env.STRAPI_ENDPOINT || "").replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

async function findRequestByToken(token: string): Promise<{
  documentId?: string
  email?: string
  productTitle?: string
} | null> {
  if (!STRAPI_BASE) return null
  try {
    const url = `${STRAPI_BASE}/api/back-in-stock-requests?filters[UnsubscribeToken][$eq]=${encodeURIComponent(
      token
    )}&pagination[limit]=1`
    const res = await fetch(url, {
      headers: STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
        : {},
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data?: Array<{
        documentId?: string
        Email?: string
        ProductTitle?: string
      }>
    }
    const row = json.data?.[0]
    if (!row?.documentId) return null
    return {
      documentId: row.documentId,
      email: row.Email,
      productTitle: row.ProductTitle,
    }
  } catch (err) {
    console.error("[back-in-stock/unsubscribe] Strapi lookup threw", err)
    return null
  }
}

async function markUnsubscribed(documentId: string): Promise<boolean> {
  if (!STRAPI_BASE) return false
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/back-in-stock-requests/${encodeURIComponent(documentId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN
            ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          data: { UnsubscribedAt: new Date().toISOString() },
        }),
        cache: "no-store",
      }
    )
    return res.ok
  } catch (err) {
    console.error("[back-in-stock/unsubscribe] Strapi update threw", err)
    return false
  }
}

function renderConfirmationHtml(opts: {
  ok: boolean
  productTitle?: string
}): string {
  const title = opts.ok
    ? "You're unsubscribed"
    : "Couldn't process your request"
  const body = opts.ok
    ? `<p>You'll no longer receive the back-in-stock email for ${
        opts.productTitle ? `<strong>${escapeHtml(opts.productTitle)}</strong>` : "this product"
      }.</p><p>You can re-subscribe any time from the product page.</p>`
    : `<p>We couldn't find a matching subscription — the link may have already been used. If you keep getting unwanted emails, reply to one and we'll take you off the list manually.</p>`
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title} — Grillers Pride</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 540px; margin: 4rem auto; padding: 0 1.25rem; color: #222; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  a { color: #b8860b; }
</style></head>
<body>
  <h1>${title}</h1>
  ${body}
  <p style="margin-top:2rem"><a href="/us">← Back to Grillers Pride</a></p>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const token = url.searchParams.get("t") || ""
  if (!token) {
    return new NextResponse(renderConfirmationHtml({ ok: false }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }
  const match = await findRequestByToken(token)
  if (!match?.documentId) {
    return new NextResponse(renderConfirmationHtml({ ok: false }), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }
  const updated = await markUnsubscribed(match.documentId)
  return new NextResponse(
    renderConfirmationHtml({
      ok: updated,
      productTitle: match.productTitle,
    }),
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  )
}
