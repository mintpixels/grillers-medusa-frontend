import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type CartProductDetailsFailureInput = {
  stage: "strapi_lookup" | "timeout"
  productIds?: string[]
  timeoutMs?: number | null
  error?: unknown
}

type CartProductDetailsTimeoutOptions<T> = {
  promise: Promise<T>
  fallback: T
  productIds?: string[]
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

export async function emitCartProductDetailsFailureAlert({
  stage,
  productIds = [],
  timeoutMs = null,
  error,
}: CartProductDetailsFailureInput) {
  const message = error === undefined ? null : errorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: "cart_product_details_degraded",
    severity: "warn",
    title:
      stage === "timeout"
        ? "Cart product details timed out"
        : "Cart product details unavailable",
    path: "src/lib/util/cart-product-details.ts",
    source: "medusa-server",
    fingerprint: `cart_product_details:${stage}`,
    meta: {
      content_surface: "cart_product_details",
      stage,
      product_count: productIds.length,
      product_id_sample: productIds.slice(0, 10),
      timeout_ms: timeoutMs,
      error_message: message ? message.slice(0, 300) : null,
    },
  })
}

export function withCartProductDetailsTimeoutAlert<T>({
  promise,
  fallback,
  productIds = [],
  timeoutMs,
}: CartProductDetailsTimeoutOptions<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>

  const timer = new Promise<T>((resolve) => {
    timeout = setTimeout(() => {
      void emitCartProductDetailsFailureAlert({
        stage: "timeout",
        productIds,
        timeoutMs,
      }).catch(() => {
        // Fail open: alerting should never block cart rendering.
      })
      resolve(fallback)
    }, timeoutMs)
  })

  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout))
}
