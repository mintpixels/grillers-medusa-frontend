const mockGetProductsByMedusaIds = jest.fn()
const mockEmitCartProductDetailsFailureAlert = jest.fn()

jest.mock("@lib/data/strapi/collections", () => ({
  getProductsByMedusaIds: mockGetProductsByMedusaIds,
}))

jest.mock("@lib/strapi", () => ({
  __esModule: true,
  default: {},
}))

jest.mock("@lib/cart-enrichment-ops-alerts", () => ({
  emitCartProductDetailsFailureAlert: mockEmitCartProductDetailsFailureAlert,
}))

describe("cart product details alerting", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockEmitCartProductDetailsFailureAlert.mockResolvedValue(undefined)
  })

  it("alerts when Strapi cart product enrichment fails open", async () => {
    const error = new Error("Strapi product lookup failed")
    mockGetProductsByMedusaIds.mockRejectedValue(error)

    const { buildCartProductDetailsMap } = await import(
      "@lib/util/cart-product-details"
    )

    const result = await buildCartProductDetailsMap(["prod_1", "prod_2"])

    expect(result).toEqual({})
    expect(mockGetProductsByMedusaIds).toHaveBeenCalledWith(
      ["prod_1", "prod_2"],
      expect.any(Object)
    )
    expect(mockEmitCartProductDetailsFailureAlert).toHaveBeenCalledWith({
      stage: "strapi_lookup",
      productIds: ["prod_1", "prod_2"],
      error,
    })
  })

  it("returns customer-safe cart details when Strapi lookup succeeds", async () => {
    mockGetProductsByMedusaIds.mockResolvedValue([
      {
        documentId: "doc_1",
        Title: "Customer title",
        FeaturedImage: { url: "https://example.com/image.jpg" },
        Metadata: { AvgPackWeight: "2 lb" },
        MedusaProduct: { ProductId: "prod_1" },
      },
    ])

    const { buildCartProductDetailsMap } = await import(
      "@lib/util/cart-product-details"
    )

    await expect(buildCartProductDetailsMap(["prod_1"])).resolves.toEqual({
      prod_1: {
        title: "Customer title",
        image: "https://example.com/image.jpg",
        metadata: { AvgPackWeight: "2 lb" },
      },
    })
    expect(mockEmitCartProductDetailsFailureAlert).not.toHaveBeenCalled()
  })
})

export {}
