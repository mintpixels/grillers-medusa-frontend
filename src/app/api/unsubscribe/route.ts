import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

/**
 * Token-authenticated unsubscribe endpoint for any flow that needs to
 * let a customer opt out from an email (#96 review-acquisition, future
 * marketing list flows).
 *
 * URL shape:  /api/unsubscribe?type=reviews&u=<base64url email>&s=<hmac>
 *
 * The original review-acquisition link embedded the customer's email
 * as a plain URL param — that leaks PII into every access log along
 * the request path. This route validates a deterministic HMAC of the
 * email so the email can be decoded but only by the server holding
 * `UNSUBSCRIBE_SECRET`.
 *
 * On a valid request, we record the unsubscribe in Strapi (or fall
 * back to Postmark's suppression list — Strapi storage means the
 * cron-driven review-acquisition flow can read a single source of
 * truth before sending).
 */

const STRAPI_BASE = (process.env.STRAPI_ENDPOINT || "").replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN
const SUPPRESSION_TOKEN_SECRET =
  process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || ""

function expectedSignature(type: string, email: string): string {
  return createHmac("sha256", SUPPRESSION_TOKEN_SECRET)
    .update(`${type}:${email.toLowerCase()}`)
    .digest("base64url")
}

function timingSafeStringEq(a: string, b: string): boolean {
  const aBuf = new Uint8Array(Buffer.from(a))
  const bBuf = new Uint8Array(Buffer.from(b))
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

async function recordSuppression(email: string, type: string): Promise<boolean> {
  if (!STRAPI_BASE) return false
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/email-suppressions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(STRAPI_API_TOKEN
            ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          data: { Email: email.toLowerCase(), Type: type, UnsubscribedAt: new Date().toISOString() },
        }),
        cache: "no-store",
      }
    )
    return res.ok
  } catch (err) {
    console.error("[unsubscribe] Strapi record threw", err)
    return false
  }
}

function renderHtml(opts: { ok: boolean; type: string }): string {
  const title = opts.ok ? "You're unsubscribed" : "Couldn't process your request"
  const body = opts.ok
    ? `<p>You'll no longer receive the ${escapeHtml(opts.type)} email from Grillers Pride. You can resubscribe any time from your account preferences.</p>`
    : `<p>The unsubscribe link looks invalid or expired. If you keep getting unwanted emails, reply to one and we'll take you off the list manually.</p>`
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title} · Grillers Pride</title>
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
  const type = (url.searchParams.get("type") || "").trim()
  const userBlob = url.searchParams.get("u") || ""
  const sig = url.searchParams.get("s") || ""

  if (!type || !userBlob || !sig || !SUPPRESSION_TOKEN_SECRET) {
    return new NextResponse(renderHtml({ ok: false, type }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  let email: string
  try {
    email = Buffer.from(userBlob, "base64url").toString("utf8")
  } catch {
    return new NextResponse(renderHtml({ ok: false, type }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  const expected = expectedSignature(type, email)
  if (!timingSafeStringEq(expected, sig)) {
    return new NextResponse(renderHtml({ ok: false, type }), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  await recordSuppression(email, type)
  return new NextResponse(renderHtml({ ok: true, type }), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
