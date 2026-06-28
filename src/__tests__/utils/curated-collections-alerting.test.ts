const mockStrapiRequest = jest.fn()
const mockEmitCuratedCollectionsStrapiFailureAlert = jest.fn()
const mockEnrichStrapiProductsWithMedusaPrices = jest.fn(
  async (products: unknown[]) => products
)

jest.mock("graphql-request", () => ({
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce(
      (result, part, index) => `${result}${part}${values[index] || ""}`,
      ""
    ),
}))

jest.mock("@lib/strapi", () => ({
  __esModule: true,
  default: {
    request: mockStrapiRequest,
  },
}))

jest.mock("@lib/data/products", () => ({
  enrichStrapiProductsWithMedusaPrices:
    mockEnrichStrapiProductsWithMedusaPrices,
}))

jest.mock("@lib/curated-collections-ops-alerts", () => ({
  emitCuratedCollectionsStrapiFailureAlert:
    mockEmitCuratedCollectionsStrapiFailureAlert,
}))

function curatedCollection(overrides: Record<string, unknown> = {}) {
  return {
    documentId: "curated_1",
    Name: "Starter box",
    Slug: "starter-box",
    ShortDescription: "A starter collection.",
    CollectionType: "sku_backed",
    Occasion: "starter",
    CustomerStateFilter: "all",
    IsActive: true,
    SurfacePlacements: ["homepage", "pdp"],
    Items: [],
    SortOrder: 1,
    ...overrides,
  }
}

describe("curated collection Strapi alerting", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockEmitCuratedCollectionsStrapiFailureAlert.mockResolvedValue(undefined)
  })

  it("alerts when the primary list query fails and the legacy query recovers", async () => {
    const primaryError = new Error("Cannot query field SubstitutionPolicyCopy")
    mockStrapiRequest
      .mockRejectedValueOnce(primaryError)
      .mockResolvedValueOnce({
        curatedCollections: [curatedCollection()],
      })

    const { getCuratedCollections } = await import(
      "@lib/data/strapi/curated-collections"
    )

    const result = await getCuratedCollections({
      countryCode: "us",
      surface: "homepage",
      customerState: "all",
      limit: 4,
      enrichPrices: false,
    })

    expect(result).toHaveLength(1)
    expect(mockEmitCuratedCollectionsStrapiFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "list",
        stage: "primary",
        surface: "homepage",
        countryCode: "us",
        customerState: "all",
        limit: 4,
        recovered: true,
        error: primaryError,
      })
    )
  })

  it("alerts when collection cards degrade to an empty list", async () => {
    const error = new Error("Strapi cards query failed")
    mockStrapiRequest.mockRejectedValueOnce(error)

    const { getCuratedCollectionCards } = await import(
      "@lib/data/strapi/curated-collections"
    )

    const result = await getCuratedCollectionCards({
      surface: "homepage",
      customerState: "guest_or_no_orders",
      limit: 8,
    })

    expect(result).toEqual([])
    expect(mockEmitCuratedCollectionsStrapiFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "cards",
        stage: "primary",
        surface: "homepage",
        customerState: "guest_or_no_orders",
        limit: 8,
        recovered: false,
        error,
      })
    )
  })

  it("alerts when primary and legacy detail queries both fail", async () => {
    const primaryError = new Error("Primary detail query failed")
    const legacyError = new Error("Legacy detail query failed")
    mockStrapiRequest
      .mockRejectedValueOnce(primaryError)
      .mockRejectedValueOnce(legacyError)

    const { getCuratedCollectionBySlug } = await import(
      "@lib/data/strapi/curated-collections"
    )

    const result = await getCuratedCollectionBySlug("starter-box", "us")

    expect(result).toBeNull()
    expect(mockEmitCuratedCollectionsStrapiFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "detail",
        stage: "legacy",
        surface: "collection_page",
        countryCode: "us",
        slug: "starter-box",
        recovered: false,
        error: legacyError,
      })
    )
  })
})

export {}
