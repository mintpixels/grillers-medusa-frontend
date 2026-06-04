jest.mock("graphql-request", () => ({
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce(
      (acc, part, index) => `${acc}${part}${values[index] ?? ""}`,
      ""
    ),
}))

import {
  getAllProductsWithImages,
  getStoreProducts,
  getProductsByCollectionSlug,
  getProductsByCollectionSlugStrict,
  getProductsByTag,
  getProductsByTagStrict,
} from "@lib/data/strapi/collections"

describe("Strapi collection product loaders", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("falls back to the legacy collection query when the primary collection query fails", async () => {
    const products = [{ documentId: "prod_1", Title: "Chuck Roast" }]
    const client = {
      request: jest
        .fn()
        .mockRejectedValueOnce(new Error("field not available"))
        .mockResolvedValueOnce({ products }),
    }

    await expect(
      getProductsByCollectionSlugStrict("kosher-roasts-prime-rib", client)
    ).resolves.toEqual(products)
    expect(client.request).toHaveBeenCalledTimes(2)
  })

  it("throws in strict collection mode instead of returning an empty category on fetch failure", async () => {
    const client = {
      request: jest.fn().mockRejectedValue(new Error("Strapi unavailable")),
    }

    await expect(
      getProductsByCollectionSlugStrict("kosher-roasts-prime-rib", client)
    ).rejects.toThrow("Strapi unavailable")
    await expect(
      getProductsByCollectionSlug("kosher-roasts-prime-rib", client)
    ).resolves.toEqual([])
  })

  it("throws in strict tag mode instead of returning an empty tag page on fetch failure", async () => {
    const client = {
      request: jest.fn().mockRejectedValue(new Error("Strapi unavailable")),
    }

    await expect(getProductsByTagStrict("L2: Roasts", client)).rejects.toThrow(
      "Strapi unavailable"
    )
    await expect(getProductsByTag("L2: Roasts", client)).resolves.toEqual([])
  })

  it("loads the store catalog directly from Strapi with a lean product-card query", async () => {
    const products = [
      {
        documentId: "doc_1",
        Title: "Kosher Chuck Roast",
        FeaturedImage: { url: "https://example.com/chuck.jpg" },
        MedusaProduct: {
          ProductId: "prod_1",
          Handle: "kosher-chuck-roast",
          Description: "A long customer-facing PDP description.",
          ShortDescription: "A short customer-facing PLP description.",
          Variants: [
            {
              VariantId: "var_1",
              Sku: "1-01-01-1",
              Price: { CalculatedPriceNumber: 12.34 },
            },
          ],
        },
      },
    ]
    const client = {
      request: jest.fn().mockResolvedValue({ products }),
    }

    await expect(getStoreProducts(client)).resolves.toEqual([
      expect.objectContaining({
        Title: "Kosher Chuck Roast",
        MedusaProduct: expect.objectContaining({
          ProductId: "prod_1",
          Description: "A long customer-facing PDP description.",
          ShortDescription: "A short customer-facing PLP description.",
        }),
      }),
    ])
    expect(client.request).toHaveBeenCalledTimes(1)
    expect(client.request.mock.calls[0][0]).not.toContain(
      "IngredientDisclosures"
    )
    expect(client.request.mock.calls[0][0]).not.toContain("GalleryImages")
    expect(client.request.mock.calls[0][1]).toEqual({
      limit: 1000,
      start: 0,
    })
  })

  it("retries direct Strapi product pagination before rendering an empty catalog", async () => {
    const products = [
      {
        documentId: "doc_retry",
        Title: "Kosher Ground Beef",
        FeaturedImage: { url: "https://example.com/ground-beef.jpg" },
        MedusaProduct: {
          ProductId: "prod_retry",
          Handle: "kosher-ground-beef",
          ShortDescription: "Fresh ground beef.",
          Variants: [
            {
              VariantId: "var_retry",
              Sku: "1-00-11-1",
              Price: { CalculatedPriceNumber: 12.3 },
            },
          ],
        },
      },
    ]
    const client = {
      request: jest
        .fn()
        .mockRejectedValueOnce(new Error("transient Strapi failure"))
        .mockResolvedValueOnce({ products }),
    }

    await expect(getAllProductsWithImages(client)).resolves.toEqual([
      expect.objectContaining({
        Title: "Kosher Ground Beef",
      }),
    ])
    expect(client.request).toHaveBeenCalledTimes(2)
  })
})
