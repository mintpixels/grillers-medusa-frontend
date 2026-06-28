import { NextRequest, NextResponse } from "next/server"
import {
  emitNewsletterProxyFailureAlert,
  missingNewsletterProxyEnv,
  shouldAlertNewsletterProxyStatus,
} from "@lib/newsletter-ops-alerts"

const ALERT_PATH = "src/app/api/newsletter/unsubscribe/[token]/route.ts"

/**
 * Server-side proxy for one-click unsubscribe. Forwards client IP/UA so the
 * audit log records the real actor.
 */
export const runtime = "nodejs"

type Ctx = { params: Promise<{ token: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY
  if (!url || !key) {
    await emitNewsletterProxyFailureAlert({
      flow: "unsubscribe",
      stage: "configuration",
      path: ALERT_PATH,
      missingEnv: missingNewsletterProxyEnv(),
    })
    return NextResponse.json({ error: "newsletter_unavailable" }, { status: 503 })
  }
  const { token } = await ctx.params
  const xff = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const ua = req.headers.get("user-agent") || ""
  const referer = req.headers.get("referer") || ""

  try {
    const r = await fetch(
      `${url.replace(/\/$/, "")}/api/unsubscribe/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "x-api-key": key,
          ...(xff ? { "x-forwarded-for": xff } : {}),
          ...(ua ? { "user-agent": ua } : {}),
          ...(referer ? { referer } : {}),
        },
        cache: "no-store",
      },
    )
    const data = await r.json().catch(() => ({}))
    if (shouldAlertNewsletterProxyStatus(r.status)) {
      await emitNewsletterProxyFailureAlert({
        flow: "unsubscribe",
        stage: "upstream_response",
        path: ALERT_PATH,
        status: r.status,
        statusText: r.statusText,
      })
    }
    return NextResponse.json(data, { status: r.status })
  } catch (err) {
    console.error("[newsletter] unsubscribe proxy error:", err)
    await emitNewsletterProxyFailureAlert({
      flow: "unsubscribe",
      stage: "transport",
      path: ALERT_PATH,
      error: err,
    })
    return NextResponse.json({ error: "newsletter_unreachable" }, { status: 502 })
  }
}
