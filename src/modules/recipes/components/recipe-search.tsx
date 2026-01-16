"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useTransition, useEffect } from "react"

export default function RecipeSearch() {
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
      
      if (value.trim()) {
        params.set("q", value.trim())
      } else {
        params.delete("q")
      }
      
      // Reset to page 1 when search changes
      params.delete("page")

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
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

  return (
    <div className="relative max-w-md mb-6">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search recipes..."
          className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent"
          aria-label="Search recipes"
        />
        
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear button or loading spinner */}
        {(inputValue || isPending) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isPending ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
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
            ) : (
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search result indicator */}
      {currentSearch && !isPending && (
        <p className="mt-2 text-sm text-gray-500">
          Showing results for &quot;{currentSearch}&quot;
        </p>
      )}
    </div>
  )
}


