jest.mock("graphql-request", () => ({
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce(
      (acc, part, index) => `${acc}${part}${values[index] ?? ""}`,
      ""
    ),
}))

import {
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
})
