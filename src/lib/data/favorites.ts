"use server"

import { sdk } from "@lib/config"
import { reportCustomerSavedItemsFailure } from "@lib/account-ops-alerts"
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

type FavoriteRecipeAction = "read" | "add" | "remove" | "toggle"
type FavoriteRecipeFailureStage =
  | "customer_metadata_read"
  | "customer_metadata_update"
  | "cache_revalidate"

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
  favoriteRecipes: FavoriteRecipe[],
  context: {
    action: FavoriteRecipeAction
    hasItemKey?: boolean
  }
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

  try {
    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)
  } catch (error) {
    reportCustomerSavedItemsFailure({
      collection: "favorite_recipes",
      action: context.action,
      stage: "cache_revalidate",
      error,
      hasItemKey: context.hasItemKey,
      itemCount: favoriteRecipes.length,
    })
  }
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
    reportCustomerSavedItemsFailure({
      collection: "favorite_recipes",
      action: "read",
      stage: "customer_metadata_read",
      error,
    })
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

  let stage: FavoriteRecipeFailureStage = "customer_metadata_read"
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

    stage = "customer_metadata_update"
    await saveFavoriteRecipes(headers, updatedFavorites, {
      action: "add",
      hasItemKey: Boolean(slug),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error adding favorite recipe:", error)
    reportCustomerSavedItemsFailure({
      collection: "favorite_recipes",
      action: "add",
      stage,
      error,
      hasItemKey: Boolean(slug),
    })
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

  let stage: FavoriteRecipeFailureStage = "customer_metadata_read"
  try {
    const currentFavorites = await fetchFavoriteRecipes(headers)

    // Filter out the recipe to remove
    const updatedFavorites = currentFavorites.filter((fav) => fav.slug !== slug)

    stage = "customer_metadata_update"
    await saveFavoriteRecipes(headers, updatedFavorites, {
      action: "remove",
      hasItemKey: Boolean(slug),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error removing favorite recipe:", error)
    reportCustomerSavedItemsFailure({
      collection: "favorite_recipes",
      action: "remove",
      stage,
      error,
      hasItemKey: Boolean(slug),
    })
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

  let stage: FavoriteRecipeFailureStage = "customer_metadata_read"
  try {
    const currentFavorites = await fetchFavoriteRecipes(headers)
    const isCurrentlyFavorited = currentFavorites.some(
      (fav) => fav.slug === slug
    )

    if (isCurrentlyFavorited) {
      stage = "customer_metadata_update"
      await saveFavoriteRecipes(
        headers,
        currentFavorites.filter((fav) => fav.slug !== slug),
        {
          action: "toggle",
          hasItemKey: Boolean(slug),
        }
      )
      return { success: true, isFavorited: false }
    } else {
      stage = "customer_metadata_update"
      await saveFavoriteRecipes(
        headers,
        [
          ...currentFavorites,
          {
            slug,
            title,
            addedAt: new Date().toISOString(),
          },
        ],
        {
          action: "toggle",
          hasItemKey: Boolean(slug),
        }
      )
      return { success: true, isFavorited: true }
    }
  } catch (error: any) {
    console.error("Error toggling favorite:", error)
    reportCustomerSavedItemsFailure({
      collection: "favorite_recipes",
      action: "toggle",
      stage,
      error,
      hasItemKey: Boolean(slug),
    })
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
