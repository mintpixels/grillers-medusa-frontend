"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useTransition } from "react"
import { Loader2, SlidersHorizontal, X } from "lucide-react"
import { trackRecipeFilterApply } from "@lib/gtm"
import {
  extractFilterOptions as _extract,
  buildStrapiFilters as _build,
  type FilterOptions,
} from "@modules/recipes/lib/filter-helpers"

export type { FilterOptions }
export const extractFilterOptions = _extract
export const buildStrapiFilters = _build

type RecipeFiltersProps = {
  filterOptions: FilterOptions
}

const formatDifficulty = (difficulty: string) => {
  const normalized = difficulty.toLowerCase()

  if (normalized === "hard" || normalized === "advanced") return "Project"
  if (normalized === "medium") return "Moderate"
  if (normalized === "easy") return "Easy"

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
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

      trackRecipeFilterApply({
        filterType: key,
        filterValue: value,
        source: "recipe_filters",
      })

      startTransition(() => {
        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        })
      })
    },
    [searchParams, pathname, router]
  )

  const clearAllFilters = useCallback(() => {
    trackRecipeFilterApply({
      filterType: "all",
      filterValue: "",
      source: "recipe_filters_clear",
    })

    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [pathname, router])

  return (
    <div className="w-full md:w-auto">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden min-h-[44px] inline-flex items-center gap-2 rounded-[5px] border border-Charcoal/15 bg-white px-4 text-Charcoal font-maison-neue font-semibold mb-4"
        aria-label={`${isOpen ? "Hide" : "Show"} recipe filters`}
      >
        <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
        Filters {hasActiveFilters && <span className="text-Gold">({[currentCategory, currentMethod, currentDifficulty, currentDietary].filter(Boolean).length})</span>}
      </button>

      {/* Filter panel */}
      <div className={`${isOpen ? "block" : "hidden"} md:block`}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Category filter */}
          {filterOptions.categories.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-p-sm font-maison-neue font-semibold text-Charcoal">Category</label>
              <select
                value={currentCategory}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="h-[44px] border border-Charcoal/20 rounded-[5px] bg-white px-3 text-p-sm font-maison-neue text-Charcoal min-w-[160px] focus:outline-none focus:ring-2 focus:ring-Gold"
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
              <label className="text-p-sm font-maison-neue font-semibold text-Charcoal">Cooking Method</label>
              <select
                value={currentMethod}
                onChange={(e) => updateFilter("method", e.target.value)}
                className="h-[44px] border border-Charcoal/20 rounded-[5px] bg-white px-3 text-p-sm font-maison-neue text-Charcoal min-w-[160px] focus:outline-none focus:ring-2 focus:ring-Gold"
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
              <label className="text-p-sm font-maison-neue font-semibold text-Charcoal">Effort</label>
              <select
                value={currentDifficulty}
                onChange={(e) => updateFilter("difficulty", e.target.value)}
                className="h-[44px] border border-Charcoal/20 rounded-[5px] bg-white px-3 text-p-sm font-maison-neue text-Charcoal min-w-[140px] focus:outline-none focus:ring-2 focus:ring-Gold"
                disabled={isPending}
              >
                <option value="">Any Effort</option>
                {filterOptions.difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {formatDifficulty(diff)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dietary Tags filter */}
          {filterOptions.dietaryTags.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-p-sm font-maison-neue font-semibold text-Charcoal">Dietary</label>
              <select
                value={currentDietary}
                onChange={(e) => updateFilter("dietary", e.target.value)}
                className="h-[44px] border border-Charcoal/20 rounded-[5px] bg-white px-3 text-p-sm font-maison-neue text-Charcoal min-w-[160px] focus:outline-none focus:ring-2 focus:ring-Gold"
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
              className="min-h-[44px] inline-flex items-center gap-2 rounded-[5px] border border-Charcoal/15 bg-white px-4 text-p-sm font-maison-neue font-semibold text-Charcoal hover:border-Gold"
              disabled={isPending}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear all
            </button>
          )}

          {/* Loading indicator */}
          {isPending && (
            <div className="flex min-h-[44px] items-center gap-2 text-p-sm font-maison-neue text-Charcoal/60">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Filtering...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// extractFilterOptions / buildStrapiFilters live in
// @modules/recipes/lib/filter-helpers so the server-side recipes route
// can import them without crossing the "use client" boundary.
