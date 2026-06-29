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

function hasAuthHeaders(
  headers: Awaited<ReturnType<typeof getAuthHeaders>>
): headers is { authorization: string } {
  return "authorization" in headers && Boolean(headers.authorization)
}

async function fetchFavoriteRecipes(
  headers: { authorization: string }
): Promise<FavoriteRecipe[]> {
  const { customer } = await sdk.client.fetch<{
    customer: { metadata?: FavoritesMetadata }
  }>("/store/customers/me", {
    method: "GET",
    headers,
  })

  return customer?.metadata?.favoriteRecipes || []
}

async function saveFavoriteRecipes(
  headers: { authorization: string },
  favoriteRecipes: FavoriteRecipe[]
) {
  await sdk.store.customer.update(
    {
      metadata: {
        favoriteRecipes,
      },
    },
    {},
    headers
  )

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)
}

/**
 * Get the current customer's favorite recipes
 */
export async function getFavoriteRecipes(): Promise<FavoriteRecipe[]> {
  const headers = await getAuthHeaders()

  if (!hasAuthHeaders(headers)) {
    return []
  }

  try {
    return await fetchFavoriteRecipes(headers)
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

  if (!hasAuthHeaders(headers)) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const currentFavorites = await fetchFavoriteRecipes(headers)

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

    await saveFavoriteRecipes(headers, updatedFavorites)

    return { success: true }
  } catch (error: any) {
    console.error("Error adding favorite recipe:", error)
    return {
      success: false,
      error: error.message || "Failed to add favorite",
    }
  }
}

/**
 * Remove a recipe from the customer's favorites
 */
export async function removeFavoriteRecipe(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()

  if (!hasAuthHeaders(headers)) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const currentFavorites = await fetchFavoriteRecipes(headers)

    // Filter out the recipe to remove
    const updatedFavorites = currentFavorites.filter((fav) => fav.slug !== slug)

    await saveFavoriteRecipes(headers, updatedFavorites)

    return { success: true }
  } catch (error: any) {
    console.error("Error removing favorite recipe:", error)
    return {
      success: false,
      error: error.message || "Failed to remove favorite",
    }
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

  if (!hasAuthHeaders(headers)) {
    return { success: false, isFavorited: false, error: "Not authenticated" }
  }

  try {
    const currentFavorites = await fetchFavoriteRecipes(headers)
    const isCurrentlyFavorited = currentFavorites.some(
      (fav) => fav.slug === slug
    )

    if (isCurrentlyFavorited) {
      await saveFavoriteRecipes(
        headers,
        currentFavorites.filter((fav) => fav.slug !== slug)
      )
      return { success: true, isFavorited: false }
    } else {
      await saveFavoriteRecipes(headers, [
        ...currentFavorites,
        {
          slug,
          title,
          addedAt: new Date().toISOString(),
        },
      ])
      return { success: true, isFavorited: true }
    }
  } catch (error: any) {
    console.error("Error toggling favorite:", error)
    return {
      success: false,
      isFavorited: false,
      error: error.message || "Failed to toggle favorite",
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
