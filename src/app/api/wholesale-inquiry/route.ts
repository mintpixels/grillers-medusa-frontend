import { NextRequest, NextResponse } from "next/server"
import { emitWholesaleInquiryFailureAlert } from "@lib/customer-demand-ops-alerts"

type WholesaleInquiry = {
  name?: string
  email?: string
  phone?: string
  organization?: string
  operationType?: string
  monthlyVolume?: string
  message?: string
  sourceUrl?: string
}

const POSTMARK_API_URL = "https://api.postmarkapp.com/email"

// Light email validation. Server-side; clients also validate. Keep the
// permissive regex — Postmark itself does the authoritative validation
// and we just want to reject obvious junk before paying the API call.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const OPERATION_TYPES = new Set([
  "Caterer",
  "Restaurant",
  "Synagogue or congregation",
  "School or camp",
  "Hotel or one-off event",
  "Other",
])

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      case "'":
        return "&#39;"
      default:
        return c
    }
  })
}

function buildEmailBodies(inquiry: WholesaleInquiry) {
  const rows: Array<[string, string]> = [
    ["Name", inquiry.name || ""],
    ["Email", inquiry.email || ""],
    ["Phone", inquiry.phone || "—"],
    ["Organization", inquiry.organization || ""],
    ["Operation type", inquiry.operationType || ""],
    ["Estimated monthly volume", inquiry.monthlyVolume || "—"],
    ["Message", inquiry.message || "—"],
    ["Source URL", inquiry.sourceUrl || "—"],
  ]

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n")
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2A2828; max-width: 600px;">
  <h2 style="font-size: 18px; border-bottom: 2px solid #E5B565; padding-bottom: 8px;">New wholesale inquiry</h2>
  <table style="width: 100%; border-collapse: collapse;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding: 6px 12px 6px 0; font-weight: 600; vertical-align: top; width: 200px;">${escapeHtml(k)}</td><td style="padding: 6px 0; white-space: pre-wrap;">${escapeHtml(v)}</td></tr>`
      )
      .join("")}
  </table>
  <p style="font-size: 12px; color: #888; margin-top: 24px;">
    Submitted via the wholesale page at grillerspride.com.
  </p>
</body>
</html>`.trim()

  return { text, html }
}

export async function POST(req: NextRequest) {
  const token = process.env.POSTMARK_API_TOKEN
  const from = process.env.POSTMARK_FROM
  const to = process.env.WHOLESALE_INQUIRY_TO

  if (!token || !from || !to) {
    const missingEnv = [
      !token ? "POSTMARK_API_TOKEN" : null,
      !from ? "POSTMARK_FROM" : null,
      !to ? "WHOLESALE_INQUIRY_TO" : null,
    ].filter(Boolean) as string[]

    await emitWholesaleInquiryFailureAlert({
      stage: "configuration",
      missingEnv,
    })

    return NextResponse.json(
      {
        error:
          "Wholesale inquiry endpoint is not configured. Missing POSTMARK_API_TOKEN, POSTMARK_FROM, or WHOLESALE_INQUIRY_TO.",
      },
      { status: 503 }
    )
  }

  let body: WholesaleInquiry
  try {
    body = (await req.json()) as WholesaleInquiry
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    )
  }

  const name = (body.name || "").trim().slice(0, 200)
  const email = (body.email || "").trim().slice(0, 320)
  const phone = (body.phone || "").trim().slice(0, 64)
  const organization = (body.organization || "").trim().slice(0, 200)
  const operationType = (body.operationType || "").trim().slice(0, 64)
  const monthlyVolume = (body.monthlyVolume || "").trim().slice(0, 200)
  const message = (body.message || "").trim().slice(0, 4000)
  const sourceUrl = (body.sourceUrl || "").trim().slice(0, 500)

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    )
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 }
    )
  }
  if (!organization) {
    return NextResponse.json(
      { error: "Organization name is required." },
      { status: 400 }
    )
  }
  if (!operationType || !OPERATION_TYPES.has(operationType)) {
    return NextResponse.json(
      { error: "Please pick an operation type." },
      { status: 400 }
    )
  }

  const { text, html } = buildEmailBodies({
    name,
    email,
    phone,
    organization,
    operationType,
    monthlyVolume,
    message,
    sourceUrl,
  })

  const subject = `New wholesale inquiry — ${organization} (${operationType})`

  const payload = {
    From: from,
    To: to,
    ReplyTo: `${name} <${email}>`,
    Subject: subject,
    TextBody: text,
    HtmlBody: html,
    MessageStream: "outbound",
    Tag: "wholesale-inquiry",
    Metadata: {
      operationType,
      source: "wholesale-page",
    },
  }

  try {
    const res = await fetch(POSTMARK_API_URL, {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error(
        "[wholesale-inquiry] Postmark error:",
        res.status,
        detail.slice(0, 500)
      )
      await emitWholesaleInquiryFailureAlert({
        stage: "postmark_response",
        status: res.status,
        statusText: res.statusText,
        error: detail,
        operationType,
        sourceUrlPresent: Boolean(sourceUrl),
      })
      return NextResponse.json(
        {
          error:
            "We couldn't send your inquiry just now. Please try again in a moment or email peter@grillerspride.com directly.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[wholesale-inquiry] transport error:", err)
    await emitWholesaleInquiryFailureAlert({
      stage: "transport",
      error: err,
      operationType,
      sourceUrlPresent: Boolean(sourceUrl),
    })
    return NextResponse.json(
      {
        error:
          "We couldn't send your inquiry just now. Please try again in a moment or email peter@grillerspride.com directly.",
      },
      { status: 502 }
    )
  }
}
