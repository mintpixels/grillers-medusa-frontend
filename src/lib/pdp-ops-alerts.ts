import { emitStorefrontOpsAlert } from "@lib/ops-alert"

export type PdpStrapiFailureStage =
  | "metadata_product"
  | "common_pdp"
  | "product_data"
  | "ingredient_disclosures"

export type PdpStrapiFailureReason =
  | "missing_config"
  | "request_failed"
  | "timeout"
  | "non_2xx"
  | "empty_result"

type PdpStrapiAlertInput = {
  stage: PdpStrapiFailureStage
  reason: PdpStrapiFailureReason
  handle?: string | null
  countryCode?: string | null
  medusaProductId?: string | null
  status?: number | null
  timeoutMs?: number | null
  error?: unknown
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export async function emitPdpStrapiLoadFailureAlert({
  stage,
  reason,
  handle,
  countryCode,
  medusaProductId,
  status,
  timeoutMs,
  error,
}: PdpStrapiAlertInput) {
  await emitStorefrontOpsAlert({
    alertKind: "pdp_strapi_data_degraded",
    severity: "warn",
    title: `PDP Strapi ${stage} unavailable; using fallback`,
    path: "src/app/[countryCode]/(main)/products/[handle]/page.tsx",
    source: "medusa-server",
    fingerprint: `pdp_strapi:${stage}:${reason}`,
    meta: {
      catalog_surface: "pdp",
      stage,
      reason,
      country_code: countryCode || null,
      handle: handle || null,
      medusa_product_id: medusaProductId || null,
      status: status ?? null,
      timeout_ms: timeoutMs ?? null,
      error_message: error ? errorMessage(error).slice(0, 500) : null,
    },
  })
}

export async function withPdpStrapiFallback<T>(
  promise: Promise<T>,
  fallback: T,
  input: Omit<PdpStrapiAlertInput, "reason"> & { timeoutMs: number }
): Promise<T> {
  let didTimeout = false
  let timeout: ReturnType<typeof setTimeout> | undefined

  const observed = promise.catch(async (error) => {
    if (!didTimeout) {
      await emitPdpStrapiLoadFailureAlert({
        ...input,
        reason: "request_failed",
        error,
      }).catch(() => {
        // Fail open: PDP fallbacks should not block rendering.
      })
    }
    return fallback
  })

  const timer = new Promise<T>((resolve) => {
    timeout = setTimeout(() => {
      didTimeout = true
      void emitPdpStrapiLoadFailureAlert({
        ...input,
        reason: "timeout",
      })
        .catch(() => {
          // Fail open: PDP fallbacks should not block rendering.
        })
      resolve(fallback)
    }, input.timeoutMs)
  })

  return Promise.race([observed, timer]).finally(() => {
    if (timeout) clearTimeout(timeout)
  })
}
