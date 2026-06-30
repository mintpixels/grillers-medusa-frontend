import { emitStorefrontOpsAlert } from "@lib/ops-alert"

function redactedErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(
          (error as any)?.data?.message ||
            (error as any)?.message ||
            (error as any)?.statusText ||
            error ||
            "product enrichment failed"
        )

  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(
      /\b(?:prod|variant|cart|order|cus|customer)_[A-Za-z0-9_]+/g,
      "[redacted-id]"
    )
    .slice(0, 500)
}

function errorStatus(error: unknown): number | null {
  const value =
    (error as any)?.status ??
    (error as any)?.statusCode ??
    (error as any)?.response?.status
  const status = Number(value)
  return Number.isInteger(status) && status > 0 ? status : null
}

export function reportProductEnrichmentFailure(input: {
  stage: "medusa_price_inventory_chunk"
  countryCode: string
  productCount: number
  chunkIndex: number
  chunkSize: number
  error: unknown
}): void {
  const status = errorStatus(input.error)

  void emitStorefrontOpsAlert({
    alertKind: "product_enrichment_degraded",
    severity: "warn",
    title: "Product live price and inventory enrichment failed",
    path: "src/lib/data/products.ts:enrichStrapiProductsWithMedusaPrices",
    source: "storefront-server",
    fingerprint: `product_enrichment:${input.stage}:${
      status || "transport"
    }`,
    meta: {
      catalog_surface: "strapi_product_cards",
      failure_stage: input.stage,
      route_dependency: "/store/products",
      response_status: status,
      country_code: input.countryCode,
      product_count: Math.max(0, input.productCount),
      chunk_index: Math.max(0, input.chunkIndex),
      chunk_size: Math.max(0, input.chunkSize),
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: product cards should render even if alert delivery fails.
  })
}
