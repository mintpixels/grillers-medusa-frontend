import { getCuratedCollections } from "@lib/data/strapi/curated-collections"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import PairsWellWith from "@modules/products/components/pairs-well-with"

jest.mock("@lib/data/strapi/curated-collections", () => ({
  getCuratedCollections: jest.fn(),
  getCollectionProducts: jest.fn(() => []),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

jest.mock("@modules/products/components/pairs-well-with/add-bundle-button", () => ({
  __esModule: true,
  default: () => null,
}))

const mockGetCuratedCollections =
  getCuratedCollections as jest.MockedFunction<typeof getCuratedCollections>
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("PDP curated collections alerting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("alerts and suppresses only the PDP rail when curated collection rendering fails", async () => {
    mockGetCuratedCollections.mockRejectedValueOnce(
      new Error("render failed for shopper@example.com prod_bundle")
    )

    const result = await PairsWellWith({
      countryCode: "us",
      recommendationVariant: "single_best_match",
      product: {
        id: "prod_current",
        handle: "ground-beef",
        title: "Ground Beef",
        description: "Ground beef",
      } as any,
    })

    expect(result).toBeNull()
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_render_failed",
        severity: "warn",
        title: "Curated collections render failed on pdp",
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
    const alertCalls = JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)
    expect(alertCalls).not.toContain("shopper@example.com")
    expect(alertCalls).not.toContain("prod_bundle")
  })
})
