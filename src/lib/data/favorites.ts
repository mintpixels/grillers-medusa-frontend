"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"

export type FavoriteRecipe = {
  slug: string
  title: string
  addedAt: string
}

export type FavoritesMetadata = {
  favoriteRecipes?: FavoriteRecipe[]
}

/**
 * Get the current customer's favorite recipes
 */
export async function getFavoriteRecipes(): Promise<FavoriteRecipe[]> {
  const headers = await getAuthHeaders()
  
  if (!headers) {
    return []
  }

  try {
    const { customer } = await sdk.client.fetch<{ customer: { metadata?: FavoritesMetadata } }>(
      "/store/customers/me",
      {
        method: "GET",
        headers,
      }
    )

    return customer?.metadata?.favoriteRecipes || []
  } catch (error) {
    console.error("Error fetching favorite recipes:", error)
    return []
  }
}

/**
 * Add a recipe to the customer's favorites
 */
export async function addFavoriteRecipe(
  slug: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  
  if (!headers) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // First, get current favorites
    const currentFavorites = await getFavoriteRecipes()
    
    // Check if already favorited
    if (currentFavorites.some((fav) => fav.slug === slug)) {
      return { success: true } // Already favorited
    }

    // Add new favorite
    const newFavorite: FavoriteRecipe = {
      slug,
      title,
      addedAt: new Date().toISOString(),
    }

    const updatedFavorites = [...currentFavorites, newFavorite]

    // Update customer metadata
    await sdk.store.customer.update(
      {
        metadata: {
          favoriteRecipes: updatedFavorites,
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
    console.error("Error adding favorite recipe:", error)
    return { success: false, error: error.message || "Failed to add favorite" }
  }
}

/**
 * Remove a recipe from the customer's favorites
 */
export async function removeFavoriteRecipe(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  
  if (!headers) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Get current favorites
    const currentFavorites = await getFavoriteRecipes()
    
    // Filter out the recipe to remove
    const updatedFavorites = currentFavorites.filter((fav) => fav.slug !== slug)

    // Update customer metadata
    await sdk.store.customer.update(
      {
        metadata: {
          favoriteRecipes: updatedFavorites,
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
    console.error("Error removing favorite recipe:", error)
    return { success: false, error: error.message || "Failed to remove favorite" }
  }
}

/**
 * Toggle a recipe's favorite status
 */
export async function toggleFavoriteRecipe(
  slug: string,
  title: string
): Promise<{ success: boolean; isFavorited: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  
  if (!headers) {
    return { success: false, isFavorited: false, error: "Not authenticated" }
  }

  try {
    const currentFavorites = await getFavoriteRecipes()
    const isCurrentlyFavorited = currentFavorites.some((fav) => fav.slug === slug)

    if (isCurrentlyFavorited) {
      await removeFavoriteRecipe(slug)
      return { success: true, isFavorited: false }
    } else {
      await addFavoriteRecipe(slug, title)
      return { success: true, isFavorited: true }
    }
  } catch (error: any) {
    console.error("Error toggling favorite:", error)
    return { 
      success: false, 
      isFavorited: false, 
      error: error.message || "Failed to toggle favorite" 
    }
  }
}

/**
 * Check if a specific recipe is favorited
 */
export async function isRecipeFavorited(slug: string): Promise<boolean> {
  const favorites = await getFavoriteRecipes()
  return favorites.some((fav) => fav.slug === slug)
}


