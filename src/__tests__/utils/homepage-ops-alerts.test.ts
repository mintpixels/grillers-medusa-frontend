import {
  emitFallbackHomepageOpsAlert,
  emitHomepageProductRailFailureAlert,
} from "@lib/homepage-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

describe("homepage ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits an ops alert for fallback homepage renders", async () => {
    await emitFallbackHomepageOpsAlert({
      countryCode: "us",
      hasStrapiData: false,
      hasGlobalData: true,
    })

    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "fallback_homepage_rendered",
        path: "src/app/[countryCode]/(main)/page.tsx",
        meta: expect.objectContaining({
          country_code: "us",
          has_strapi_data: false,
          has_global_data: true,
        }),
      })
    )
  })

  it("emits a redacted warn alert when a homepage product rail degrades", async () => {
    await emitHomepageProductRailFailureAlert({
      rail: "bestsellers",
      countryCode: "us",
      handleCount: 3,
      error: new Error(
        "Strapi failed for shopper@example.com prod_bestseller variant_123"
      ),
    })

    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "homepage_product_rail_degraded",
        severity: "warn",
        title: "Homepage bestsellers product rail unavailable",
        path: "src/modules/home/components/shop-bestsellers/index.tsx",
        source: "storefront-server",
        fingerprint: "homepage_product_rail:bestsellers",
        meta: expect.objectContaining({
          homepage_rail: "bestsellers",
          country_code: "us",
          handle_count: 3,
          route_dependency: "strapi_products_by_handle",
          error_message:
            "Strapi failed for [redacted-email] [redacted-id] [redacted-id]",
        }),
      })
    )
    const alertCalls = JSON.stringify(
      (emitStorefrontOpsAlert as jest.Mock).mock.calls
    )
    expect(alertCalls).not.toContain("shopper@example.com")
    expect(alertCalls).not.toContain("prod_bestseller")
  })
})
