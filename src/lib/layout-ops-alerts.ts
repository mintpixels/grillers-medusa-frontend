import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type LayoutSurface = "header_nav" | "regions" | "footer"
type LayoutStage = "strapi_header_nav" | "medusa_regions" | "strapi_footer"
type LayoutFailureReason = "request_failed" | "timeout"

type LayoutFailureAlertInput = {
  surface: LayoutSurface
  stage: LayoutStage
  reason: LayoutFailureReason
  path: string
  timeoutMs?: number | null
  error?: unknown
}

type LayoutFallbackOptions<T> = {
  promise: Promise<T>
  fallback: T
  surface: LayoutSurface
  stage: LayoutStage
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

function surfaceLabel(surface: LayoutSurface) {
  switch (surface) {
    case "header_nav":
      return "Header navigation"
    case "regions":
      return "Region navigation"
    case "footer":
      return "Footer"
  }
}

export async function emitLayoutDataFailureAlert({
  surface,
  stage,
  reason,
  path,
  timeoutMs = null,
  error,
}: LayoutFailureAlertInput) {
  const label = surfaceLabel(surface)
  const message = error === undefined ? null : errorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: "layout_data_degraded",
    severity: "warn",
    title:
      reason === "timeout"
        ? `${label} timed out; using fallback`
        : `${label} unavailable; using fallback`,
    path,
    source: "medusa-server",
    fingerprint: `layout_data:${surface}:${stage}:${reason}`,
    meta: {
      content_surface: "layout",
      layout_surface: surface,
      stage,
      reason,
      timeout_ms: timeoutMs,
      error_message: message ? message.slice(0, 300) : null,
    },
  })
}

export function withLayoutDataFallback<T>({
  promise,
  fallback,
  surface,
  stage,
  path,
  timeoutMs,
}: LayoutFallbackOptions<T>): Promise<T> {
  let didTimeout = false
  let timeout: ReturnType<typeof setTimeout>

  const observed = promise.catch(async (error) => {
    if (!didTimeout) {
      await emitLayoutDataFailureAlert({
        surface,
        stage,
        reason: "request_failed",
        path,
        timeoutMs,
        error,
      }).catch(() => {
        // Fail open: layout fallbacks should not block page rendering.
      })
    }

    return fallback
  })

  const timer = new Promise<T>((resolve) => {
    timeout = setTimeout(() => {
      didTimeout = true
      void emitLayoutDataFailureAlert({
        surface,
        stage,
        reason: "timeout",
        path,
        timeoutMs,
      }).catch(() => {
        // Fail open: layout fallbacks should not block page rendering.
      })
      resolve(fallback)
    }, timeoutMs)
  })

  return Promise.race([observed, timer]).finally(() => clearTimeout(timeout))
}
