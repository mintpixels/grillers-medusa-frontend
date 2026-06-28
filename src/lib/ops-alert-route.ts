import { emitStorefrontOpsAlert } from "@lib/ops-alert"

const ALERT_CONFIG: Record<
  string,
  {
    title: string
    path: string
    source: string
  }
> = {
  transient_navigation_auto_recovery: {
    title: "Transient navigation error auto-recovered",
    path: "src/app/error.tsx",
    source: "storefront",
  },
  client_add_to_cart_failed: {
    title: "Storefront client add-to-cart failed",
    path: "browser:add-to-cart",
    source: "storefront-browser",
  },
  client_cart_mutation_failed: {
    title: "Storefront client cart mutation failed",
    path: "browser:cart",
    source: "storefront-browser",
  },
  client_profile_action_failed: {
    title: "Storefront client profile action failed",
    path: "browser:account",
    source: "storefront-browser",
  },
}

type HeaderReader = {
  get(name: string): string | null
}

export function isAllowedBrowserOpsAlert(alertKind: string) {
  return Boolean(ALERT_CONFIG[alertKind])
}

function cleanToken(value: unknown, fallback = "unknown") {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)

  return cleaned || fallback
}

function cleanOptionalText(value: unknown) {
  const text = String(value || "").trim()
  if (!text) return null
  return text.replace(/[^\w .:/-]+/g, "_").slice(0, 120)
}

function cleanStatusCode(value: unknown) {
  const status = Number(value)
  if (!Number.isInteger(status) || status < 100 || status > 599) return null
  return status
}

function browserMeta(alertKind: string, body: any, headers: HeaderReader) {
  if (alertKind === "transient_navigation_auto_recovery") {
    return {
      digest: cleanOptionalText(body?.digest),
      message: body?.message ? String(body.message).slice(0, 500) : null,
      user_agent: headers.get("user-agent") || null,
    }
  }

  return {
    surface: cleanToken(body?.surface),
    action: cleanToken(body?.action),
    reason: cleanToken(body?.reason),
    status_code: cleanStatusCode(body?.status_code),
    product_id: cleanOptionalText(body?.product_id),
    variant_id: cleanOptionalText(body?.variant_id),
    product_handle: cleanOptionalText(body?.product_handle),
    user_agent: headers.get("user-agent") || null,
  }
}

export async function emitBrowserOpsAlertFromBody(
  body: any,
  headers: HeaderReader
) {
  const alertKind = String(body?.alert_kind || "")
  if (!isAllowedBrowserOpsAlert(alertKind)) {
    return { ok: false, status: 400, error: "invalid_alert_kind" }
  }
  const config = ALERT_CONFIG[alertKind]

  await emitStorefrontOpsAlert({
    alertKind,
    title: config.title,
    path: config.path,
    source: config.source,
    url: body?.url ? String(body.url) : headers.get("referer"),
    meta: browserMeta(alertKind, body, headers),
  })

  return { ok: true, status: 202 }
}
