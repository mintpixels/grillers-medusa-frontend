import { NextRequest, NextResponse } from "next/server"
import {
  emitNewsletterProxyFailureAlert,
  missingNewsletterProxyEnv,
  shouldAlertNewsletterProxyStatus,
} from "@lib/newsletter-ops-alerts"

const ALERT_PATH = "src/app/api/newsletter/subscribe/route.ts"

/**
 * Server-side proxy to the Railway-hosted newsletter service.
 *
 * The shared API key never leaves the server runtime. Forwards the client's
 * IP and User-Agent so the audit log captures the real subscriber rather
 * than the storefront's egress IP.
 *
 * Body: `{ email, source, source_url, consent_version, referrer? }`
 */
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY
  if (!url || !key) {
    await emitNewsletterProxyFailureAlert({
      flow: "subscribe",
      stage: "configuration",
      path: ALERT_PATH,
      missingEnv: missingNewsletterProxyEnv(),
    })
    console.error(
      "[newsletter] proxy misconfigured — NEWSLETTER_SERVICE_URL/NEWSLETTER_API_KEY missing",
    )
    return NextResponse.json(
      { error: "newsletter_unavailable" },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  // Carry the original client's IP forwarded chain through to the service.
  // Vercel/Next sets x-forwarded-for; if missing fall back to x-real-ip.
  const xff = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const ua = req.headers.get("user-agent") || ""
  const referer = req.headers.get("referer") || ""

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/subscribe`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        ...(xff ? { "x-forwarded-for": xff } : {}),
        ...(ua ? { "user-agent": ua } : {}),
        ...(referer ? { referer } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await r.json().catch(() => ({}))
    if (shouldAlertNewsletterProxyStatus(r.status)) {
      await emitNewsletterProxyFailureAlert({
        flow: "subscribe",
        stage: "upstream_response",
        path: ALERT_PATH,
        status: r.status,
        statusText: r.statusText,
      })
    }
    return NextResponse.json(data, { status: r.status })
  } catch (err) {
    console.error("[newsletter] subscribe proxy error:", err)
    await emitNewsletterProxyFailureAlert({
      flow: "subscribe",
      stage: "transport",
      path: ALERT_PATH,
      error: err,
    })
    return NextResponse.json({ error: "newsletter_unreachable" }, { status: 502 })
  }
}
