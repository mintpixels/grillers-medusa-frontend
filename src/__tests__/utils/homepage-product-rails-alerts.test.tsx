import { getProductsByHandlesStrict } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import BestsellersSection from "@modules/home/components/shop-bestsellers"
import SpecialtyRow from "@modules/home/components/specialty-row"

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

jest.mock("@modules/home/components/shop-bestsellers/swiper", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@modules/home/components/specialty-row/swiper", () => ({
  __esModule: true,
  default: () => null,
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

describe("homepage product rail alerting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEnrichStrapiProductsWithMedusaPrices.mockImplementation(
      async (products) => products as any
    )
  })

  it("alerts and keeps rendering when the bestsellers Strapi lookup fails", async () => {
    mockGetProductsByHandlesStrict.mockRejectedValueOnce(
      new Error("Strapi handles failed for shopper@example.com prod_featured")
    )

    const result = await BestsellersSection({
      countryCode: "us",
      data: {
        BestsellersTitle: "Popular",
        Products: [{ id: 1, Slug: "featured-handle" }],
      },
    })

    expect(result).toBeTruthy()
    expect(mockEnrichStrapiProductsWithMedusaPrices).toHaveBeenCalledWith(
      [],
      "us"
    )
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "homepage_product_rail_degraded",
        severity: "warn",
        title: "Homepage bestsellers product rail unavailable",
        path: "src/modules/home/components/shop-bestsellers/index.tsx",
        fingerprint: "homepage_product_rail:bestsellers",
        meta: expect.objectContaining({
          homepage_rail: "bestsellers",
          country_code: "us",
          handle_count: 1,
          route_dependency: "strapi_products_by_handle",
          error_message:
            "Strapi handles failed for [redacted-email] [redacted-id]",
        }),
      })
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "shopper@example.com"
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "prod_featured"
    )
  })

  it("alerts and suppresses only the specialty rail when that lookup fails", async () => {
    mockGetProductsByHandlesStrict.mockRejectedValueOnce(
      new Error("Strapi handles failed for staff@example.com variant_special")
    )

    const result = await SpecialtyRow({ countryCode: "us" })

    expect(result).toBeNull()
    expect(mockEnrichStrapiProductsWithMedusaPrices).toHaveBeenCalledWith(
      [],
      "us"
    )
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "homepage_product_rail_degraded",
        severity: "warn",
        title: "Homepage specialty product rail unavailable",
        path: "src/modules/home/components/specialty-row/index.tsx",
        fingerprint: "homepage_product_rail:specialty",
        meta: expect.objectContaining({
          homepage_rail: "specialty",
          country_code: "us",
          handle_count: 6,
          route_dependency: "strapi_products_by_handle",
          error_message:
            "Strapi handles failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })
})
