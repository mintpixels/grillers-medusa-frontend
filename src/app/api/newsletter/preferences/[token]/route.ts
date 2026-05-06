import { NextRequest, NextResponse } from "next/server"

/**
 * Server-side proxy for preferences GET/PATCH against the Railway-hosted
 * newsletter service.
 */
export const runtime = "nodejs"

type Ctx = { params: Promise<{ token: string }> }

function svc() {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ""), key }
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const cfg = svc()
  if (!cfg) {
    return NextResponse.json({ error: "newsletter_unavailable" }, { status: 503 })
  }
  const { token } = await ctx.params
  try {
    const r = await fetch(`${cfg.url}/api/preferences/${encodeURIComponent(token)}`, {
      headers: { "x-api-key": cfg.key },
      cache: "no-store",
    })
    const data = await r.json().catch(() => ({}))
    return NextResponse.json(data, { status: r.status })
  } catch (err) {
    console.error("[newsletter] preferences GET proxy error:", err)
    return NextResponse.json({ error: "newsletter_unreachable" }, { status: 502 })
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const cfg = svc()
  if (!cfg) {
    return NextResponse.json({ error: "newsletter_unavailable" }, { status: 503 })
  }
  const { token } = await ctx.params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const xff = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const ua = req.headers.get("user-agent") || ""

  try {
    const r = await fetch(`${cfg.url}/api/preferences/${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.key,
        ...(xff ? { "x-forwarded-for": xff } : {}),
        ...(ua ? { "user-agent": ua } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await r.json().catch(() => ({}))
    return NextResponse.json(data, { status: r.status })
  } catch (err) {
    console.error("[newsletter] preferences PATCH proxy error:", err)
    return NextResponse.json({ error: "newsletter_unreachable" }, { status: 502 })
  }
}
