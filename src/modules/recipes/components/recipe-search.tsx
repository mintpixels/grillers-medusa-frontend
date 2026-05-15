"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useTransition, useEffect } from "react"
import { Loader2, Search, X } from "lucide-react"
import { trackRecipeFilterApply, trackSearch } from "@lib/gtm"

type RecipeSearchProps = {
  className?: string
  placeholder?: string
  variant?: "default" | "hero"
}

export default function RecipeSearch({
  className = "",
  placeholder = "Search recipes...",
  variant = "default",
}: RecipeSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentSearch = searchParams.get("q") || ""
  const [inputValue, setInputValue] = useState(currentSearch)

  // Sync input with URL param
  useEffect(() => {
    setInputValue(currentSearch)
  }, [currentSearch])

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmedValue = value.trim()
      
      if (trimmedValue) {
        params.set("q", trimmedValue)
        trackSearch(trimmedValue)
        trackRecipeFilterApply({
          filterType: "search",
          filterValue: trimmedValue,
          source: "recipe_search",
        })
      } else {
        params.delete("q")
        if (currentSearch) {
          trackRecipeFilterApply({
            filterType: "search",
            filterValue: "",
            source: "recipe_search_clear",
          })
        }
      }
      
      // Reset to page 1 when search changes
      params.delete("page")

      startTransition(() => {
        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        })
      })
    },
    [searchParams, pathname, router, currentSearch]
  )

  // Debounce input changes
  useEffect(() => {
    if (inputValue === currentSearch) return
    
    const timer = setTimeout(() => {
      handleSearch(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, currentSearch, handleSearch])

  const clearSearch = () => {
    setInputValue("")
    handleSearch("")
  }

  const inputClassName =
    variant === "hero"
      ? "h-14 md:h-16 text-p-md md:text-p-lg border-Charcoal bg-white shadow-sm pl-12 pr-12"
      : "h-12 text-sm border-gray-300 bg-white pl-10 pr-10"

  return (
    <div className={`relative ${variant === "hero" ? "w-full" : "max-w-md"} ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full border rounded-[5px] font-maison-neue text-Charcoal placeholder:text-Charcoal/45 focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent ${inputClassName}`}
          aria-label="Search recipes"
        />
        
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-Charcoal/45" aria-hidden="true" />
        </div>

        {/* Clear button or loading spinner */}
        {(inputValue || isPending) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-Charcoal/45" aria-hidden="true" />
            ) : (
              <button
                onClick={clearSearch}
                className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center text-Charcoal/45 hover:text-Charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded-[5px]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search result indicator */}
      {currentSearch && !isPending && (
        <p className="mt-2 text-p-sm font-maison-neue text-Charcoal/60">
          Showing results for &quot;{currentSearch}&quot;
        </p>
      )}
    </div>
  )
}
