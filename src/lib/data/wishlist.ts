"use server"

import { sdk } from "@lib/config"
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
  if (!headers) {
    return getGuestWishlist()
  }

  try {
    const { customer } = await sdk.client.fetch<{ customer: { metadata?: WishlistMetadata } }>(
      "/store/customers/me",
      {
        method: "GET",
        headers,
      }
    )

    return customer?.metadata?.wishlist || []
  } catch (error) {
    console.error("Error fetching wishlist:", error)
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
  if (!headers) {
    try {
      const currentWishlist = await getGuestWishlist()
      
      // Check if already in wishlist
      if (currentWishlist.some((item) => item.productId === productId)) {
        return { success: true }
      }

      await setGuestWishlist([...currentWishlist, newItem])
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to add to wishlist" }
    }
  }

  try {
    // Get current wishlist
    const currentWishlist = await getWishlist()
    
    // Check if already in wishlist
    if (currentWishlist.some((item) => item.productId === productId)) {
      return { success: true }
    }

    const updatedWishlist = [...currentWishlist, newItem]

    // Update customer metadata
    await sdk.store.customer.update(
      {
        metadata: {
          wishlist: updatedWishlist,
        },
      },
      {},
      headers
    )

    // Revalidate customer cache
    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)

    return { success: true }
  } catch (error: any) {
    console.error("Error adding to wishlist:", error)
    return { success: false, error: error.message || "Failed to add to wishlist" }
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
  if (!headers) {
    try {
      const currentWishlist = await getGuestWishlist()
      const updatedWishlist = currentWishlist.filter((item) => item.productId !== productId)
      await setGuestWishlist(updatedWishlist)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to remove from wishlist" }
    }
  }

  try {
    const currentWishlist = await getWishlist()
    const updatedWishlist = currentWishlist.filter((item) => item.productId !== productId)

    // Update customer metadata
    await sdk.store.customer.update(
      {
        metadata: {
          wishlist: updatedWishlist,
        },
      },
      {},
      headers
    )

    // Revalidate customer cache
    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)

    return { success: true }
  } catch (error: any) {
    console.error("Error removing from wishlist:", error)
    return { success: false, error: error.message || "Failed to remove from wishlist" }
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
  try {
    const currentWishlist = await getWishlist()
    const isCurrentlyWishlisted = currentWishlist.some((item) => item.productId === productId)

    if (isCurrentlyWishlisted) {
      await removeFromWishlist(productId)
      return { success: true, isWishlisted: false }
    } else {
      await addToWishlist(productId, productHandle, title, thumbnail)
      return { success: true, isWishlisted: true }
    }
  } catch (error: any) {
    console.error("Error toggling wishlist:", error)
    return { 
      success: false, 
      isWishlisted: false, 
      error: error.message || "Failed to toggle wishlist" 
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
