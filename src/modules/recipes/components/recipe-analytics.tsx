"use client"

import { useEffect } from "react"
import { trackRecipeHubView, trackRecipeView } from "@lib/gtm"

type RecipeHubAnalyticsProps = {
  totalRecipes?: number
  activeSearch?: string
  activeCategory?: string
  activeDifficulty?: string
  activeBucket?: string
}

export function RecipeHubAnalytics({
  totalRecipes,
  activeSearch,
  activeCategory,
  activeDifficulty,
  activeBucket,
}: RecipeHubAnalyticsProps) {
  useEffect(() => {
    trackRecipeHubView({
      totalRecipes,
      activeSearch,
      activeCategory,
      activeDifficulty,
      activeBucket,
    })
  }, [
    totalRecipes,
    activeSearch,
    activeCategory,
    activeDifficulty,
    activeBucket,
  ])

  return null
}

type RecipeDetailAnalyticsProps = {
  recipeSlug: string
  recipeTitle: string
  categories?: string[]
}

export function RecipeDetailAnalytics({
  recipeSlug,
  recipeTitle,
  categories,
}: RecipeDetailAnalyticsProps) {
  useEffect(() => {
    trackRecipeView({
      recipeSlug,
      recipeTitle,
      categories,
    })
  }, [recipeSlug, recipeTitle, categories])

  return null
}
