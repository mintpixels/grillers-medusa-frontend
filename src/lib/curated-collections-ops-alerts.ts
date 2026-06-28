import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type CuratedCollectionAlertSurface =
  | "homepage"
  | "collections_hub"
  | "pdp"
  | "api_list"
  | "api_detail"
  | "collection_page"
  | "unknown"

type CuratedCollectionFailureInput = {
  operation: "list" | "cards" | "detail"
  stage: "primary" | "legacy" | "final"
  surface?: CuratedCollectionAlertSurface | string | null
  countryCode?: string | null
  customerState?: string | null
  limit?: number | null
  slug?: string | null
  recovered: boolean
  error: unknown
}

type CuratedCollectionTimeoutInput = {
  operation: "list" | "cards" | "detail"
  surface: CuratedCollectionAlertSurface | string
  timeoutMs: number
  countryCode?: string | null
  customerState?: string | null
  limit?: number | null
  slug?: string | null
}

type CuratedCollectionTimeoutOptions<T> = CuratedCollectionTimeoutInput & {
  promise: Promise<T>
  fallback: T
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

export async function emitCuratedCollectionsStrapiFailureAlert({
  operation,
  stage,
  surface = "unknown",
  countryCode,
  customerState,
  limit,
  slug,
  recovered,
  error,
}: CuratedCollectionFailureInput) {
  const message = errorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: recovered
      ? "curated_collections_strapi_degraded"
      : "curated_collections_strapi_failed",
    severity: recovered ? "warn" : "page",
    title: recovered
      ? `Curated collections ${operation} recovered with legacy query`
      : `Curated collections ${operation} unavailable`,
    path: "src/lib/data/strapi/curated-collections.ts",
    source: "medusa-server",
    fingerprint: `curated_collections:${operation}:${stage}:${
      recovered ? "recovered" : "failed"
    }`,
    meta: {
      content_surface: "curated_collections",
      operation,
      stage,
      surface: surface || "unknown",
      recovered,
      country_code: countryCode || null,
      customer_state: customerState || null,
      limit: limit ?? null,
      slug: slug || null,
      error_message: message.slice(0, 300),
    },
  })
}

export async function emitCuratedCollectionsTimeoutAlert({
  operation,
  surface,
  timeoutMs,
  countryCode,
  customerState,
  limit,
  slug,
}: CuratedCollectionTimeoutInput) {
  await emitStorefrontOpsAlert({
    alertKind: "curated_collections_timeout",
    severity: "warn",
    title: `Curated collections ${operation} timed out on ${surface}`,
    path: "src/lib/data/strapi/curated-collections.ts",
    source: "medusa-server",
    fingerprint: `curated_collections:${operation}:${surface}:timeout`,
    meta: {
      content_surface: "curated_collections",
      operation,
      surface,
      timeout_ms: timeoutMs,
      country_code: countryCode || null,
      customer_state: customerState || null,
      limit: limit ?? null,
      slug: slug || null,
    },
  })
}

export function withCuratedCollectionsTimeoutAlert<T>({
  promise,
  fallback,
  operation,
  surface,
  timeoutMs,
  countryCode,
  customerState,
  limit,
  slug,
}: CuratedCollectionTimeoutOptions<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>

  const timer = new Promise<T>((resolve) => {
    timeout = setTimeout(() => {
      void emitCuratedCollectionsTimeoutAlert({
        operation,
        surface,
        timeoutMs,
        countryCode,
        customerState,
        limit,
        slug,
      }).catch(() => {
        // Fail open: alerting should never break customer rendering.
      })
      resolve(fallback)
    }, timeoutMs)
  })

  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout))
}
