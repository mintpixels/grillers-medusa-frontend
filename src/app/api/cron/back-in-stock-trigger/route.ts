import { NextResponse } from "next/server"
import { runBackInStockTrigger } from "@lib/data/back-in-stock-trigger"

/**
 * Cron entry point for #102 back-in-stock notification fan-out.
 *
 * Schedule: every 15 min via `vercel.json` cron config. The handler is
 * idempotent — repeated runs while a SKU is in stock and has pending
 * subscribers keep marking subscribers as notified (one per fire). A
 * 7-day cooldown inside `runBackInStockTrigger` prevents thrash storms
 * on SKUs that oscillate in/out of stock.
 *
 * Auth: gated by `CRON_SECRET` header (Vercel sets `Authorization:
 * Bearer ${CRON_SECRET}` automatically). Manual triggers must include
 * the same header.
 */

const CRON_SECRET = process.env.CRON_SECRET

async function handle(request: Request) {
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization") || ""
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
  }

  const summary = await runBackInStockTrigger()
  return NextResponse.json(summary, {
    status: summary.ok ? 200 : 500,
  })
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
