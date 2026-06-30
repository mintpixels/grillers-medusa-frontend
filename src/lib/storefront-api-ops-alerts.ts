import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type StorefrontApiRoute = "session" | "side_cart" | "home_personalization"
type StorefrontApiReason = "request_failed" | "timeout"

type StorefrontApiAlertInput = {
  route: StorefrontApiRoute
  stage: string
  reason: StorefrontApiReason
  path: string
  timeoutMs?: number | null
  error?: unknown
}

type StorefrontApiFallbackOptions<T> = {
  promise: Promise<T>
  fallback: T
  route: StorefrontApiRoute
  stage: string
  path: string
  timeoutMs: number
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function redactAlertMessage(message: string) {
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(
      /\b(?:cart|order|cus|customer|prod|variant|line|li)_[A-Za-z0-9_]+/g,
      "[redacted-id]"
    )
}

function routeLabel(route: StorefrontApiRoute) {
  switch (route) {
    case "session":
      return "Storefront session"
    case "side_cart":
      return "Side cart"
    case "home_personalization":
      return "Home personalization"
  }
}

export async function emitStorefrontApiDataFailureAlert({
  route,
  stage,
  reason,
  path,
  timeoutMs = null,
  error,
}: StorefrontApiAlertInput) {
  const label = routeLabel(route)
  const message = error === undefined ? null : errorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: "storefront_api_data_degraded",
    severity: "warn",
    title:
      reason === "timeout"
        ? `${label} ${stage} timed out; using fallback`
        : `${label} ${stage} unavailable; using fallback`,
    path,
    source: "medusa-server",
    fingerprint: `storefront_api:${route}:${stage}:${reason}`,
    meta: {
      api_route: route,
      stage,
      reason,
      timeout_ms: timeoutMs,
      error_message: message ? redactAlertMessage(message).slice(0, 300) : null,
    },
  })
}

export function withStorefrontApiFallback<T>({
  promise,
  fallback,
  route,
  stage,
  path,
  timeoutMs,
}: StorefrontApiFallbackOptions<T>): Promise<T> {
  let didTimeout = false
  let timeout: ReturnType<typeof setTimeout>

  const observed = promise.catch(async (error) => {
    if (!didTimeout) {
      await emitStorefrontApiDataFailureAlert({
        route,
        stage,
        reason: "request_failed",
        path,
        timeoutMs,
        error,
      }).catch(() => {
        // Fail open: route fallback JSON should never wait on alerting.
      })
    }

    return fallback
  })

  const timer = new Promise<T>((resolve) => {
    timeout = setTimeout(() => {
      didTimeout = true
      void emitStorefrontApiDataFailureAlert({
        route,
        stage,
        reason: "timeout",
        path,
        timeoutMs,
      }).catch(() => {
        // Fail open: route fallback JSON should never wait on alerting.
      })
      resolve(fallback)
    }, timeoutMs)
  })

  return Promise.race([observed, timer]).finally(() => clearTimeout(timeout))
}
