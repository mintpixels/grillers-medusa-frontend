import {
  emitCuratedCollectionsRenderFailureAlert,
  emitCuratedCollectionsStrapiFailureAlert,
  withCuratedCollectionsTimeoutAlert,
} from "@lib/curated-collections-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("curated collection ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when a legacy query recovers curated collections", async () => {
    await emitCuratedCollectionsStrapiFailureAlert({
      operation: "list",
      stage: "primary",
      surface: "pdp",
      countryCode: "us",
      customerState: "all",
      limit: 12,
      recovered: true,
      error: new Error("Cannot query field SubstitutionPolicyCopy"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_strapi_degraded",
        severity: "warn",
        title: "Curated collections list recovered with legacy query",
        fingerprint: "curated_collections:list:primary:recovered",
        meta: expect.objectContaining({
          content_surface: "curated_collections",
          operation: "list",
          stage: "primary",
          surface: "pdp",
          recovered: true,
          country_code: "us",
          customer_state: "all",
          limit: 12,
          error_message: "Cannot query field SubstitutionPolicyCopy",
        }),
      })
    )
  })

  it("redacts sensitive values from curated collection source failures", async () => {
    await emitCuratedCollectionsStrapiFailureAlert({
      operation: "list",
      stage: "legacy",
      surface: "pdp",
      countryCode: "us",
      customerState: "all",
      limit: 12,
      recovered: false,
      error: new Error("failed for shopper@example.com prod_bundle"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_strapi_failed",
        meta: expect.objectContaining({
          error_message: "failed for [redacted-email] [redacted-id]",
        }),
      })
    )
    const alertCalls = JSON.stringify(emitStorefrontOpsAlertMock.mock.calls)
    expect(alertCalls).not.toContain("shopper@example.com")
    expect(alertCalls).not.toContain("prod_bundle")
  })

  it("emits a redacted warn alert when curated collections fail during render", async () => {
    await emitCuratedCollectionsRenderFailureAlert({
      surface: "pdp",
      countryCode: "us",
      productHandle: "ground-beef",
      recommendationVariant: "single_best_match",
      error: new Error("render failed for buyer@example.com variant_bundle"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_render_failed",
        severity: "warn",
        title: "Curated collections render failed on pdp",
        path: "src/modules/products/components/pairs-well-with/index.tsx",
        source: "storefront-server",
        fingerprint: "curated_collections:render:pdp:failed",
        meta: expect.objectContaining({
          content_surface: "curated_collections",
          operation: "render",
          surface: "pdp",
          country_code: "us",
          product_handle: "ground-beef",
          recommendation_variant: "single_best_match",
          error_message: "render failed for [redacted-email] [redacted-id]",
        }),
      })
    )
    const alertCalls = JSON.stringify(emitStorefrontOpsAlertMock.mock.calls)
    expect(alertCalls).not.toContain("buyer@example.com")
    expect(alertCalls).not.toContain("variant_bundle")
  })

  it("emits a timeout alert when a curated merchandising surface falls back", async () => {
    const result = await withCuratedCollectionsTimeoutAlert({
      promise: new Promise<string[]>(() => {}),
      fallback: [],
      operation: "cards",
      surface: "homepage",
      countryCode: "us",
      customerState: "guest_or_no_orders",
      limit: 8,
      timeoutMs: 0,
    })

    expect(result).toEqual([])
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_timeout",
        severity: "warn",
        title: "Curated collections cards timed out on homepage",
        fingerprint: "curated_collections:cards:homepage:timeout",
        meta: expect.objectContaining({
          content_surface: "curated_collections",
          operation: "cards",
          surface: "homepage",
          timeout_ms: 0,
          country_code: "us",
          customer_state: "guest_or_no_orders",
          limit: 8,
        }),
      })
    )
  })
})
