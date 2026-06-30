import { emitStorefrontOpsAlert } from "@lib/ops-alert"

function errorStatus(error: unknown): number | null {
  const value =
    (error as any)?.status ??
    (error as any)?.statusCode ??
    (error as any)?.response?.status
  const status = Number(value)
  return Number.isInteger(status) && status > 0 ? status : null
}

function redactedErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(
          (error as any)?.data?.message ||
            (error as any)?.message ||
            (error as any)?.statusText ||
            error ||
            "region lookup failed"
        )

  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:reg|region|cus|customer|cart|order)_[A-Za-z0-9_]+/g, "[redacted-id]")
    .slice(0, 500)
}

export function reportRegionLookupFailure(input: {
  stage: "country_region_lookup"
  countryCode?: string | null
  error: unknown
}): void {
  const status = errorStatus(input.error)

  void emitStorefrontOpsAlert({
    alertKind: "region_lookup_failed",
    severity: "warn",
    title: "Storefront region lookup failed",
    path: "src/lib/data/regions.ts:getRegion",
    source: "storefront-server",
    fingerprint: `region_lookup_failed:${input.stage}:${status || "transport"}`,
    meta: {
      region_surface: "storefront_region_lookup",
      failure_stage: input.stage,
      route_dependency: "/store/regions",
      response_status: status,
      country_code: input.countryCode || null,
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: product/cart/account rendering should not depend on alert delivery.
  })
}
