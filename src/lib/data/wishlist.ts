"use server"

import { sdk } from "@lib/config"
import { reportCustomerSavedItemsFailure } from "@lib/account-ops-alerts"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { cookies } from "next/headers"

export type WishlistItem = {
  productId: string
  productHandle: string
  title: string
  thumbnail?: string
  addedAt: string
}

export type WishlistMetadata = {
  wishlist?: WishlistItem[]
}

const GUEST_WISHLIST_COOKIE = "grillers_wishlist"

type WishlistAction = "read" | "add" | "remove" | "toggle"
type WishlistFailureStage =
  | "customer_metadata_read"
  | "customer_metadata_update"
  | "cache_revalidate"

function hasAuthHeaders(
  headers: Awaited<ReturnType<typeof getAuthHeaders>>
): headers is { authorization: string } {
  return "authorization" in headers && Boolean(headers.authorization)
}

async function fetchAuthenticatedWishlist(
  headers: { authorization: string }
): Promise<WishlistItem[]> {
  const { customer } = await sdk.client.fetch<{
    customer: { metadata?: WishlistMetadata }
  }>("/store/customers/me", {
    method: "GET",
    headers,
  })

  return customer?.metadata?.wishlist || []
}

async function saveAuthenticatedWishlist(
  headers: { authorization: string },
  wishlist: WishlistItem[],
  context: {
    action: WishlistAction
    hasItemKey?: boolean
  }
) {
  await sdk.store.customer.update(
    {
      metadata: {
        wishlist,
      },
    },
    {},
    headers
  )

  try {
    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)
  } catch (error) {
    reportCustomerSavedItemsFailure({
      collection: "wishlist",
      action: context.action,
      stage: "cache_revalidate",
      error,
      hasItemKey: context.hasItemKey,
      itemCount: wishlist.length,
    })
  }
}

/**
 * Get wishlist items from localStorage cookie for guests
 */
async function getGuestWishlist(): Promise<WishlistItem[]> {
  const cookieStore = await cookies()
  const wishlistCookie = cookieStore.get(GUEST_WISHLIST_COOKIE)
  
  if (!wishlistCookie?.value) {
    return []
  }
  
  try {
    return JSON.parse(wishlistCookie.value)
  } catch {
    return []
  }
}

/**
 * Save wishlist to cookie for guests
 */
async function setGuestWishlist(items: WishlistItem[]): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(GUEST_WISHLIST_COOKIE, JSON.stringify(items), {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  })
}

/**
 * Get the current customer's wishlist
 */
export async function getWishlist(): Promise<WishlistItem[]> {
  const headers = await getAuthHeaders()

  // For guests, use cookie storage
  if (!hasAuthHeaders(headers)) {
    return getGuestWishlist()
  }

  try {
    return await fetchAuthenticatedWishlist(headers)
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    reportCustomerSavedItemsFailure({
      collection: "wishlist",
      action: "read",
      stage: "customer_metadata_read",
      error,
    })
    return []
  }
}

/**
 * Add a product to the wishlist
 */
export async function addToWishlist(
  productId: string,
  productHandle: string,
  title: string,
  thumbnail?: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()

  const newItem: WishlistItem = {
    productId,
    productHandle,
    title,
    thumbnail,
    addedAt: new Date().toISOString(),
  }

  // For guests, use cookie storage
  if (!hasAuthHeaders(headers)) {
    try {
      const currentWishlist = await getGuestWishlist()

      // Check if already in wishlist
      if (currentWishlist.some((item) => item.productId === productId)) {
        return { success: true }
      }

      await setGuestWishlist([...currentWishlist, newItem])
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to add to wishlist",
      }
    }
  }

  let stage: WishlistFailureStage = "customer_metadata_read"
  try {
    const currentWishlist = await fetchAuthenticatedWishlist(headers)

    // Check if already in wishlist
    if (currentWishlist.some((item) => item.productId === productId)) {
      return { success: true }
    }

    const updatedWishlist = [...currentWishlist, newItem]

    stage = "customer_metadata_update"
    await saveAuthenticatedWishlist(headers, updatedWishlist, {
      action: "add",
      hasItemKey: Boolean(productId),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error adding to wishlist:", error)
    reportCustomerSavedItemsFailure({
      collection: "wishlist",
      action: "add",
      stage,
      error,
      hasItemKey: Boolean(productId),
    })
    return {
      success: false,
      error: error.message || "Failed to add to wishlist",
    }
  }
}

/**
 * Remove a product from the wishlist
 */
export async function removeFromWishlist(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()

  // For guests, use cookie storage
  if (!hasAuthHeaders(headers)) {
    try {
      const currentWishlist = await getGuestWishlist()
      const updatedWishlist = currentWishlist.filter(
        (item) => item.productId !== productId
      )
      await setGuestWishlist(updatedWishlist)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to remove from wishlist",
      }
    }
  }

  let stage: WishlistFailureStage = "customer_metadata_read"
  try {
    const currentWishlist = await fetchAuthenticatedWishlist(headers)
    const updatedWishlist = currentWishlist.filter(
      (item) => item.productId !== productId
    )

    stage = "customer_metadata_update"
    await saveAuthenticatedWishlist(headers, updatedWishlist, {
      action: "remove",
      hasItemKey: Boolean(productId),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error removing from wishlist:", error)
    reportCustomerSavedItemsFailure({
      collection: "wishlist",
      action: "remove",
      stage,
      error,
      hasItemKey: Boolean(productId),
    })
    return {
      success: false,
      error: error.message || "Failed to remove from wishlist",
    }
  }
}

/**
 * Toggle a product's wishlist status
 */
export async function toggleWishlist(
  productId: string,
  productHandle: string,
  title: string,
  thumbnail?: string
): Promise<{ success: boolean; isWishlisted: boolean; error?: string }> {
  let stage: WishlistFailureStage = "customer_metadata_read"
  try {
    const headers = await getAuthHeaders()

    if (!hasAuthHeaders(headers)) {
      const currentWishlist = await getGuestWishlist()
      const isCurrentlyWishlisted = currentWishlist.some(
        (item) => item.productId === productId
      )

      if (isCurrentlyWishlisted) {
        await setGuestWishlist(
          currentWishlist.filter((item) => item.productId !== productId)
        )
        return { success: true, isWishlisted: false }
      }

      await setGuestWishlist([
        ...currentWishlist,
        {
          productId,
          productHandle,
          title,
          thumbnail,
          addedAt: new Date().toISOString(),
        },
      ])
      return { success: true, isWishlisted: true }
    }

    const currentWishlist = await fetchAuthenticatedWishlist(headers)
    const isCurrentlyWishlisted = currentWishlist.some(
      (item) => item.productId === productId
    )

    if (isCurrentlyWishlisted) {
      stage = "customer_metadata_update"
      await saveAuthenticatedWishlist(
        headers,
        currentWishlist.filter((item) => item.productId !== productId),
        {
          action: "toggle",
          hasItemKey: Boolean(productId),
        }
      )
      return { success: true, isWishlisted: false }
    } else {
      stage = "customer_metadata_update"
      await saveAuthenticatedWishlist(
        headers,
        [
          ...currentWishlist,
          {
            productId,
            productHandle,
            title,
            thumbnail,
            addedAt: new Date().toISOString(),
          },
        ],
        {
          action: "toggle",
          hasItemKey: Boolean(productId),
        }
      )
      return { success: true, isWishlisted: true }
    }
  } catch (error: any) {
    console.error("Error toggling wishlist:", error)
    reportCustomerSavedItemsFailure({
      collection: "wishlist",
      action: "toggle",
      stage,
      error,
      hasItemKey: Boolean(productId),
    })
    return {
      success: false,
      isWishlisted: false,
      error: error.message || "Failed to toggle wishlist",
    }
  }
}

/**
 * Check if a specific product is in the wishlist
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  const wishlist = await getWishlist()
  return wishlist.some((item) => item.productId === productId)
}

/**
 * Get wishlist count
 */
export async function getWishlistCount(): Promise<number> {
  const wishlist = await getWishlist()
  return wishlist.length
}
