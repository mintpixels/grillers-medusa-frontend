import { NextRequest, NextResponse } from "next/server"
import {
  emitNewsletterProxyFailureAlert,
  missingNewsletterProxyEnv,
  shouldAlertNewsletterProxyStatus,
} from "@lib/newsletter-ops-alerts"

const ALERT_PATH = "src/app/api/newsletter/request-link/route.ts"

/**
 * Server-side proxy that asks the Railway newsletter service to email a
 * preferences-link to the address provided. Always returns 202 to avoid
 * disclosing whether the address is on file.
 */
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY
  if (!url || !key) {
    await emitNewsletterProxyFailureAlert({
      flow: "request_preferences_link",
      stage: "configuration",
      path: ALERT_PATH,
      missingEnv: missingNewsletterProxyEnv(),
    })
    console.error(
      "[newsletter] request-link proxy misconfigured — NEWSLETTER_SERVICE_URL/NEWSLETTER_API_KEY missing",
    )
    // Still return 202 so the UI doesn't leak config state to clients.
    return NextResponse.json({ ok: true }, { status: 202 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/request-preferences-link`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await r.json().catch(() => ({}))
    if (shouldAlertNewsletterProxyStatus(r.status)) {
      await emitNewsletterProxyFailureAlert({
        flow: "request_preferences_link",
        stage: "upstream_response",
        path: ALERT_PATH,
        status: r.status,
        statusText: r.statusText,
      })
    }
    return NextResponse.json(data, { status: r.status })
  } catch (err) {
    console.error("[newsletter] request-link proxy error:", err)
    await emitNewsletterProxyFailureAlert({
      flow: "request_preferences_link",
      stage: "transport",
      path: ALERT_PATH,
      error: err,
    })
    // Still 202 — never leak service-availability through this surface.
    return NextResponse.json({ ok: true }, { status: 202 })
  }
}
