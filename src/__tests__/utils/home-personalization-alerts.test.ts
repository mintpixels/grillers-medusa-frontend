jest.mock("server-only", () => ({}))

import { getProductsByMedusaLookupRefs } from "@lib/data/strapi/collections"
import { getReorderStrapiMap } from "@lib/data/home-personalization"
import { withStorefrontApiFallback } from "@lib/storefront-api-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/strapi", () => ({
  __esModule: true,
  default: { request: jest.fn() },
}))

jest.mock("@lib/data/strapi/collections", () => ({
  getProductsByMedusaLookupRefs: jest.fn(),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockGetProductsByMedusaLookupRefs =
  getProductsByMedusaLookupRefs as jest.MockedFunction<
    typeof getProductsByMedusaLookupRefs
  >
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

const purchaseHistory = [
  {
    productId: "prod_home_123",
    variantId: "variant_home_123",
    sku: "SKU-123",
  },
] as any

describe("home personalization Strapi enrichment alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("builds a lookup map from Strapi products", async () => {
    const strapiProduct = {
      documentId: "strapi-home-1",
      Title: "Home Product",
      MedusaProduct: {
        ProductId: "prod_home_123",
        Variants: [
          {
            VariantId: "variant_home_123",
            Sku: "SKU-123",
          },
        ],
      },
    } as any
    mockGetProductsByMedusaLookupRefs.mockResolvedValueOnce([strapiProduct])

    const result = await getReorderStrapiMap(purchaseHistory)

    expect(result.prod_home_123).toBe(strapiProduct)
    expect(result.variant_home_123).toBe(strapiProduct)
    expect(result["sku-123"]).toBe(strapiProduct)
  })

  it("lets the route fallback wrapper alert on Strapi enrichment failures", async () => {
    mockGetProductsByMedusaLookupRefs.mockRejectedValueOnce(
      new Error("Strapi failed for shopper@example.com prod_home_123")
    )

    const result = await withStorefrontApiFallback({
      promise: getReorderStrapiMap(purchaseHistory),
      fallback: {},
      route: "home_personalization",
      stage: "reorder_strapi_map",
      path: "src/app/api/storefront/home-personalization/route.ts",
      timeoutMs: 1800,
    })

    expect(result).toEqual({})
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "storefront_api_data_degraded",
        severity: "warn",
        title: "Home personalization reorder_strapi_map unavailable; using fallback",
        fingerprint:
          "storefront_api:home_personalization:reorder_strapi_map:request_failed",
        meta: expect.objectContaining({
          api_route: "home_personalization",
          stage: "reorder_strapi_map",
          reason: "request_failed",
          timeout_ms: 1800,
          error_message:
            "Strapi failed for [redacted-email] [redacted-id]",
        }),
      })
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "shopper@example.com"
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "prod_home_123"
    )
  })
})
