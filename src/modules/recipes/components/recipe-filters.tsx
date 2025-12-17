"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useTransition } from "react"

export type FilterOptions = {
  categories: Array<{ Name: string; Slug: string }>
  cookingMethods: string[]
  difficulties: string[]
  dietaryTags: string[]
}

type RecipeFiltersProps = {
  filterOptions: FilterOptions
}

export default function RecipeFilters({ filterOptions }: RecipeFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  // Get current filter values from URL
  const currentCategory = searchParams.get("category") || ""
  const currentMethod = searchParams.get("method") || ""
  const currentDifficulty = searchParams.get("difficulty") || ""
  const currentDietary = searchParams.get("dietary") || ""

  const hasActiveFilters = currentCategory || currentMethod || currentDifficulty || currentDietary

  // Update URL with new filter values
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      
      // Reset to page 1 when filters change
      params.delete("page")

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [pathname, router])

  return (
    <div className="mb-8">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center gap-2 text-Charcoal font-medium mb-4"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters {hasActiveFilters && <span className="text-Gold">({[currentCategory, currentMethod, currentDifficulty, currentDietary].filter(Boolean).length})</span>}
      </button>

      {/* Filter panel */}
      <div className={`${isOpen ? "block" : "hidden"} md:block`}>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Category filter */}
          {filterOptions.categories.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-Charcoal">Category</label>
              <select
                value={currentCategory}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-Gold"
                disabled={isPending}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat.Slug} value={cat.Slug}>
                    {cat.Name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cooking Method filter */}
          {filterOptions.cookingMethods.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-Charcoal">Cooking Method</label>
              <select
                value={currentMethod}
                onChange={(e) => updateFilter("method", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-Gold"
                disabled={isPending}
              >
                <option value="">All Methods</option>
                {filterOptions.cookingMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Difficulty filter */}
          {filterOptions.difficulties.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-Charcoal">Difficulty</label>
              <select
                value={currentDifficulty}
                onChange={(e) => updateFilter("difficulty", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px] focus:outline-none focus:ring-2 focus:ring-Gold"
                disabled={isPending}
              >
                <option value="">All Levels</option>
                {filterOptions.difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dietary Tags filter */}
          {filterOptions.dietaryTags.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-Charcoal">Dietary</label>
              <select
                value={currentDietary}
                onChange={(e) => updateFilter("dietary", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-Gold"
                disabled={isPending}
              >
                <option value="">All Dietary</option>
                {filterOptions.dietaryTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-Gold hover:text-Gold/80 underline"
              disabled={isPending}
            >
              Clear all
            </button>
          )}

          {/* Loading indicator */}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Filtering...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to extract unique filter options from recipes
export function extractFilterOptions(recipes: any[]): FilterOptions {
  const categories = new Map<string, { Name: string; Slug: string }>()
  const cookingMethods = new Set<string>()
  const difficulties = new Set<string>()
  const dietaryTags = new Set<string>()

  recipes.forEach((recipe) => {
    if (recipe.Category?.Slug) {
      categories.set(recipe.Category.Slug, {
        Name: recipe.Category.Name,
        Slug: recipe.Category.Slug,
      })
    }
    if (recipe.CookingMethod) {
      cookingMethods.add(recipe.CookingMethod)
    }
    if (recipe.Difficulty) {
      difficulties.add(recipe.Difficulty)
    }
    if (recipe.DietaryTags && Array.isArray(recipe.DietaryTags)) {
      recipe.DietaryTags.forEach((tag: string) => dietaryTags.add(tag))
    }
  })

  return {
    categories: Array.from(categories.values()).sort((a, b) => a.Name.localeCompare(b.Name)),
    cookingMethods: Array.from(cookingMethods).sort(),
    difficulties: ["Easy", "Medium", "Advanced"].filter((d) => difficulties.has(d)),
    dietaryTags: Array.from(dietaryTags).sort(),
  }
}

// Helper function to build Strapi filter object from URL params
export function buildStrapiFilters(params: {
  category?: string
  method?: string
  difficulty?: string
  dietary?: string
  search?: string
}): Record<string, any> | undefined {
  const filters: Record<string, any> = {}

  if (params.category) {
    filters.Category = { Slug: { eq: params.category } }
  }
  if (params.method) {
    filters.CookingMethod = { eq: params.method }
  }
  if (params.difficulty) {
    filters.Difficulty = { eq: params.difficulty }
  }
  if (params.dietary) {
    filters.DietaryTags = { contains: params.dietary }
  }
  if (params.search) {
    filters.or = [
      { Title: { containsi: params.search } },
      { ShortDescription: { containsi: params.search } },
    ]
  }

  return Object.keys(filters).length > 0 ? filters : undefined
}

