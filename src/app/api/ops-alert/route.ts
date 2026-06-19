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

  // Severity clamping + per-IP+kind rate limit live in the helper so they're
  // unit-testable. Anything other than 202 is surfaced with its status here.
  const result = await emitBrowserOpsAlertFromBody(body, req.headers)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Fail-open happy path: we don't block the client on ingestion success.
  return NextResponse.json({ ok: true }, { status: 202 })
}
