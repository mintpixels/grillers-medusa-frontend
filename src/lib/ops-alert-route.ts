import { emitStorefrontOpsAlert } from "@lib/ops-alert"

const ALLOWED_ALERTS = new Set(["transient_navigation_auto_recovery"])

type HeaderReader = {
  get(name: string): string | null
}

export function isAllowedBrowserOpsAlert(alertKind: string) {
  return ALLOWED_ALERTS.has(alertKind)
}

export async function emitBrowserOpsAlertFromBody(
  body: any,
  headers: HeaderReader
) {
  const alertKind = String(body?.alert_kind || "")
  if (!isAllowedBrowserOpsAlert(alertKind)) {
    return { ok: false, status: 400, error: "invalid_alert_kind" }
  }

  await emitStorefrontOpsAlert({
    alertKind,
    title: String(body?.title || "Storefront ops alert"),
    path: "src/app/error.tsx",
    source: "storefront",
    url: body?.url ? String(body.url) : headers.get("referer"),
    meta: {
      digest: body?.digest || null,
      message: body?.message ? String(body.message).slice(0, 500) : null,
      user_agent: headers.get("user-agent") || null,
    },
  })

  return { ok: true, status: 202 }
}
