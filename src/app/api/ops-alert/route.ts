import { NextRequest, NextResponse } from "next/server"
import {
  emitBrowserOpsAlertFromBody,
  isAllowedBrowserOpsAlert,
} from "@lib/ops-alert-route"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const alertKind = String(body?.alert_kind || "")
  if (!isAllowedBrowserOpsAlert(alertKind)) {
    return NextResponse.json({ error: "invalid_alert_kind" }, { status: 400 })
  }

  await emitBrowserOpsAlertFromBody(body, req.headers)

  return NextResponse.json({ ok: true }, { status: 202 })
}
