const mockRetrieveAuthenticatedCustomerForStaffAccess = jest.fn()
const mockRevalidateTag = jest.fn()
const mockUnstableCache = jest.fn((fn) => fn)

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess:
    mockRetrieveAuthenticatedCustomerForStaffAccess,
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: mockRevalidateTag,
  unstable_cache: mockUnstableCache,
}))

jest.mock("@lib/server-soft-failure", () => ({
  reportServerSoftFailure: jest.fn(),
}))

function reviewCaption(payload: Record<string, unknown>) {
  return `GP_IMAGE_REVIEW_V1:${JSON.stringify(payload)}`
}

function strapiPage(data: unknown[], pageCount = 1) {
  return {
    ok: true,
    json: async () => ({
      data,
      meta: { pagination: { pageCount } },
    }),
  }
}

describe("getProductMerchandisingTags", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      STRAPI_ENDPOINT: "https://strapi.example.com",
      STRAPI_API_TOKEN: "strapi-token",
    }
    mockRetrieveAuthenticatedCustomerForStaffAccess.mockResolvedValue({
      email: "reviewer@example.com",
      metadata: { gp_staff_role: "merchandising_reviewer" },
    })
  })

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it("builds L3 summaries from paginated Strapi overview products", async () => {
    const productsByPage: Record<number, unknown[]> = {
      1: [
        {
          documentId: "product-1",
          FeaturedImage: {
            documentId: "image-1",
            url: "/uploads/image-1.jpg",
            caption: reviewCaption({
              review: { status: "approved" },
              auditHistory: [],
            }),
          },
          GalleryImages: [
            {
              documentId: "image-2",
              url: "/uploads/image-2.jpg",
              caption: reviewCaption({
                review: { status: "rejected", reason: "other" },
                auditHistory: [],
              }),
            },
          ],
          Categorization: {
            ProductTags: [
              { Name: "L2: Beef" },
              {
                Name: "L3: Brisket",
                Description: "Brisket cuts",
                SEODescription: "Brisket SEO",
              },
            ],
          },
        },
      ],
      2: [
        {
          documentId: "product-2",
          FeaturedImage: {
            documentId: "image-3",
            url: "/uploads/image-3.jpg",
            caption: reviewCaption({
              review: { status: "unreviewed" },
              claim: {
                staffEmail: "peter@example.com",
                claimedAt: "2026-06-27T10:00:00.000Z",
                expiresAt: "2999-06-27T18:00:00.000Z",
              },
              auditHistory: [],
            }),
          },
          GalleryImages: [],
          Categorization: {
            ProductTags: [{ Name: "L2: Beef" }, { Name: "L3: Brisket" }],
          },
        },
      ],
      3: [
        {
          documentId: "product-3",
          GalleryImages: [],
          Categorization: {
            ProductTags: [{ Name: "L2: Deli" }, { Name: "L3: Salami" }],
          },
        },
      ],
    }

    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      const parsed = new URL(url)
      const page = Number(parsed.searchParams.get("pagination[page]"))

      expect(init?.headers).toEqual({
        Authorization: "Bearer strapi-token",
      })

      return strapiPage(productsByPage[page] || [], 3) as unknown as Response
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const { getProductMerchandisingTags } = await import(
      "@lib/data/staff/product-merchandising"
    )

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["staff-merchandising-tag-summary-v2"],
      expect.objectContaining({
        revalidate: 300,
        tags: ["staff-merchandising-tag-summary"],
      })
    )

    const tags = await getProductMerchandisingTags()
    const brisket = tags.find((tag) => tag.name === "L3: Brisket")
    const salami = tags.find((tag) => tag.name === "L3: Salami")

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(
      fetchMock.mock.calls.map(([url]) =>
        new URL(String(url)).searchParams.get("pagination[page]")
      )
    ).toEqual(["1", "2", "3"])
    expect(brisket).toEqual(
      expect.objectContaining({
        documentId: "L3%3A%20Brisket",
        displayName: "Brisket",
        description: "Brisket cuts",
        seoDescription: "Brisket SEO",
        productCount: 2,
        imageCount: 3,
        reviewedImageCount: 2,
        approvedImageCount: 1,
        rejectedImageCount: 1,
        claimedImageCount: 1,
        noImageProductCount: 0,
        l2Parents: ["Beef"],
      })
    )
    expect(salami).toEqual(
      expect.objectContaining({
        documentId: "L3%3A%20Salami",
        productCount: 1,
        imageCount: 0,
        noImageProductCount: 1,
        l2Parents: ["Deli"],
      })
    )
  })

  it("retries transient Strapi page failures while building L3 summaries", async () => {
    let pageTwoAttempts = 0
    const productsByPage: Record<number, unknown[]> = {
      1: [
        {
          documentId: "product-1",
          FeaturedImage: {
            documentId: "image-1",
            url: "/uploads/image-1.jpg",
          },
          GalleryImages: [],
          Categorization: {
            ProductTags: [{ Name: "L2: Beef" }, { Name: "L3: Brisket" }],
          },
        },
      ],
      2: [
        {
          documentId: "product-2",
          FeaturedImage: {
            documentId: "image-2",
            url: "/uploads/image-2.jpg",
          },
          GalleryImages: [],
          Categorization: {
            ProductTags: [{ Name: "L2: Beef" }, { Name: "L3: Brisket" }],
          },
        },
      ],
    }

    const fetchMock = jest.fn(async (url: string) => {
      const parsed = new URL(url)
      const page = Number(parsed.searchParams.get("pagination[page]"))

      if (page === 2 && pageTwoAttempts === 0) {
        pageTwoAttempts += 1
        return {
          ok: false,
          status: 502,
          text: async () =>
            JSON.stringify({ error: { message: "Temporary Strapi gateway" } }),
        } as unknown as Response
      }

      if (page === 2) pageTwoAttempts += 1
      return strapiPage(productsByPage[page] || [], 2) as unknown as Response
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const { getProductMerchandisingTags } = await import(
      "@lib/data/staff/product-merchandising"
    )

    const tags = await getProductMerchandisingTags()
    const brisket = tags.find((tag) => tag.name === "L3: Brisket")

    expect(pageTwoAttempts).toBe(2)
    expect(brisket).toEqual(
      expect.objectContaining({
        productCount: 2,
        imageCount: 2,
        reviewedImageCount: 0,
      })
    )
  })

  it("invalidates the shared tag summary cache after a successful image review write", async () => {
    const latestCaption = reviewCaption({
      review: { status: "unreviewed" },
      auditHistory: [],
    })
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/api/upload/files?")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 123,
              documentId: "image-123",
              url: "/uploads/image-123.jpg",
              caption: latestCaption,
            },
          ],
        } as unknown as Response
      }

      if (String(url).endsWith("/api/upload?id=123")) {
        expect(init?.method).toBe("POST")
        return {
          ok: true,
          json: async () => ({}),
        } as unknown as Response
      }

      throw new Error(`Unexpected fetch ${url}`)
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const { reviewMerchandisingImage } = await import(
      "@lib/data/staff/product-merchandising"
    )

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "image-123",
      countryCode: "us",
      status: "approved",
      currentCaption: latestCaption,
    })

    expect(result.ok).toBe(true)
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "staff-merchandising-tag-summary"
    )
  })
})
