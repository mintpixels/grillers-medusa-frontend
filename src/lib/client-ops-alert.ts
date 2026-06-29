"use client"

export type ClientOpsAlertKind =
  | "client_add_to_cart_failed"
  | "client_analytics_delivery_failed"
  | "client_cart_mutation_failed"
  | "client_profile_action_failed"

type ClientOpsAlertInput = {
  alertKind: ClientOpsAlertKind
  title: string
  surface: string
  action: string
  error?: unknown
  reason?: string
  statusCode?: number | null
  target?: string | null
  eventName?: string | null
  productId?: string | null
  variantId?: string | null
  productHandle?: string | null
}

function token(value: string | null | undefined, fallback = "unknown") {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)

  return cleaned || fallback
}

export function classifyClientError(error: unknown) {
  if (!error) return "unknown_error"

  if (typeof error === "object") {
    const maybeError = error as {
      name?: unknown
      status?: unknown
      statusCode?: unknown
      code?: unknown
      message?: unknown
    }
    const status = Number(maybeError.status ?? maybeError.statusCode)
    if (Number.isInteger(status) && status > 0) {
      return `http_${status}`
    }

    if (typeof maybeError.code === "string" && maybeError.code) {
      return token(maybeError.code)
    }

    if (maybeError.name === "AbortError") return "aborted"
    if (maybeError.name === "TypeError") return "network_or_type_error"

    if (typeof maybeError.message === "string") {
      const message = maybeError.message.toLowerCase()
      if (message.includes("fetch")) return "network_error"
      if (message.includes("timeout")) return "timeout"
    }
  }

  return "client_exception"
}

export function reportClientOpsAlert(input: ClientOpsAlertInput) {
  if (typeof window === "undefined") return
  const surface = token(input.surface)
  const action = token(input.action)

  const payload = {
    alert_kind: input.alertKind,
    severity: "warn",
    title: input.title,
    path: `browser:${surface}:${action}`,
    extra: {
      surface,
      action,
      reason: token(input.reason || classifyClientError(input.error)),
      status_code:
        typeof input.statusCode === "number" &&
        Number.isFinite(input.statusCode)
          ? Math.trunc(input.statusCode)
          : null,
      target: input.target ? token(input.target) : null,
      event_name: input.eventName ? token(input.eventName) : null,
      product_id: input.productId || null,
      variant_id: input.variantId || null,
      product_handle: input.productHandle || null,
    },
    url: window.location.href,
  }

  try {
    fetch("/api/ops-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Alerting must not make the customer action noisier.
  }
}
