jest.mock("server-only", () => ({}))

const cookieJar = new Map<string, { value: string }>()
const setCookie = jest.fn((name: string, value: string) => {
  cookieJar.set(name, { value })
})

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: (name: string) => cookieJar.get(name),
    set: setCookie,
  })),
}))

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag } from "@lib/data/cookies"
import { addFavoriteRecipe } from "@lib/data/favorites"
import { addToWishlist, getWishlist } from "@lib/data/wishlist"
import { revalidateTag } from "next/cache"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
    store: {
      customer: {
        update: jest.fn(),
      },
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(),
  getCacheTag: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

const mockGetAuthHeaders = getAuthHeaders as jest.MockedFunction<
  typeof getAuthHeaders
>
const mockGetCacheTag = getCacheTag as jest.MockedFunction<typeof getCacheTag>
const mockSdkFetch = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const mockCustomerUpdate =
  sdk.store.customer.update as jest.MockedFunction<
    typeof sdk.store.customer.update
  >
const mockRevalidateTag = revalidateTag as jest.MockedFunction<
  typeof revalidateTag
>

describe("wishlist and favorite auth handling", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    cookieJar.clear()
    mockGetCacheTag.mockResolvedValue("customers-cache")
    mockCustomerUpdate.mockResolvedValue({ customer: { id: "cus_123" } } as any)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("uses guest wishlist cookies when auth headers are empty", async () => {
    mockGetAuthHeaders.mockResolvedValue({})

    await expect(
      addToWishlist("prod_123", "test-product", "Test Product", "thumb.jpg")
    ).resolves.toEqual({ success: true })

    expect(mockSdkFetch).not.toHaveBeenCalled()
    expect(mockCustomerUpdate).not.toHaveBeenCalled()
    expect(setCookie).toHaveBeenCalledWith(
      "grillers_wishlist",
      expect.stringContaining("prod_123"),
      expect.objectContaining({
        path: "/",
        sameSite: "lax",
      })
    )

    await expect(getWishlist()).resolves.toEqual([
      expect.objectContaining({
        productId: "prod_123",
        productHandle: "test-product",
        title: "Test Product",
      }),
    ])
  })

  it("does not write signed-in wishlist metadata when the current wishlist cannot be read", async () => {
    mockGetAuthHeaders.mockResolvedValue({ authorization: "Bearer customer" })
    mockSdkFetch.mockRejectedValueOnce(new Error("customer metadata unavailable"))

    await expect(
      addToWishlist("prod_123", "test-product", "Test Product")
    ).resolves.toEqual({
      success: false,
      error: "customer metadata unavailable",
    })

    expect(mockCustomerUpdate).not.toHaveBeenCalled()
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it("treats empty auth headers as unauthenticated for recipe favorites", async () => {
    mockGetAuthHeaders.mockResolvedValue({})

    await expect(addFavoriteRecipe("recipe", "Recipe")).resolves.toEqual({
      success: false,
      error: "Not authenticated",
    })

    expect(mockSdkFetch).not.toHaveBeenCalled()
    expect(mockCustomerUpdate).not.toHaveBeenCalled()
  })

  it("does not write recipe favorites when the current favorite list cannot be read", async () => {
    mockGetAuthHeaders.mockResolvedValue({ authorization: "Bearer customer" })
    mockSdkFetch.mockRejectedValueOnce(new Error("favorite read unavailable"))

    await expect(addFavoriteRecipe("recipe", "Recipe")).resolves.toEqual({
      success: false,
      error: "favorite read unavailable",
    })

    expect(mockCustomerUpdate).not.toHaveBeenCalled()
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })
})
