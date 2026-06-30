jest.mock("server-only", () => ({}))

import { getProductsByHandlesStrict } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { withStorefrontApiFallback } from "@lib/storefront-api-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { getCartUpsellProducts } from "@modules/cart/components/cart-upsells/server"

jest.mock("@lib/strapi", () => ({
  __esModule: true,
  default: { request: jest.fn() },
}))

jest.mock("@lib/data/strapi/collections", () => ({
  getProductsByHandlesStrict: jest.fn(),
}))

jest.mock("@lib/data/products", () => ({
  enrichStrapiProductsWithMedusaPrices: jest.fn(async (products) => products),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockGetProductsByHandlesStrict =
  getProductsByHandlesStrict as jest.MockedFunction<
    typeof getProductsByHandlesStrict
  >
const mockEnrichStrapiProductsWithMedusaPrices =
  enrichStrapiProductsWithMedusaPrices as jest.MockedFunction<
    typeof enrichStrapiProductsWithMedusaPrices
  >
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("cart upsell alerting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("maps strict Strapi handle results into cart upsells", async () => {
    const strapiProduct = {
      Title: "Chicken Wings",
      FeaturedImage: { url: "https://cdn.example.com/wings.jpg" },
      MedusaProduct: {
        ProductId: "prod_wings",
        Handle: "chicken-wings",
        Variants: [
          {
            VariantId: "variant_wings",
            Price: { CalculatedPriceNumber: 1299 },
            manage_inventory: false,
          },
        ],
      },
    } as any
    mockGetProductsByHandlesStrict.mockResolvedValueOnce([strapiProduct])

    const result = await getCartUpsellProducts("us")

    expect(mockEnrichStrapiProductsWithMedusaPrices).toHaveBeenCalledWith(
      [strapiProduct],
      "us"
    )
    expect(result).toEqual([
      expect.objectContaining({
        id: "prod_wings",
        title: "Chicken Wings",
        handle: "chicken-wings",
        image: "https://cdn.example.com/wings.jpg",
        variantId: "variant_wings",
        price: 1299,
      }),
    ])
  })

  it("lets the side-cart fallback wrapper alert on cart upsell lookup failures", async () => {
    mockGetProductsByHandlesStrict.mockRejectedValueOnce(
      new Error("Strapi handles failed for shopper@example.com prod_wings")
    )

    const result = await withStorefrontApiFallback({
      promise: getCartUpsellProducts("us"),
      fallback: [],
      route: "side_cart",
      stage: "upsells",
      path: "src/app/api/storefront/side-cart/route.ts",
      timeoutMs: 900,
    })

    expect(result).toEqual([])
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "storefront_api_data_degraded",
        severity: "warn",
        title: "Side cart upsells unavailable; using fallback",
        fingerprint: "storefront_api:side_cart:upsells:request_failed",
        meta: expect.objectContaining({
          api_route: "side_cart",
          stage: "upsells",
          reason: "request_failed",
          timeout_ms: 900,
          error_message:
            "Strapi handles failed for [redacted-email] [redacted-id]",
        }),
      })
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "shopper@example.com"
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "prod_wings"
    )
  })
})
