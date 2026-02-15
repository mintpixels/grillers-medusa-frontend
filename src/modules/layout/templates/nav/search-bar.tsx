"use client"

import { Fragment, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react"
import {
  InstantSearch,
  Configure,
  useSearchBox,
  useHits,
} from "react-instantsearch"
import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import { trackSearch } from "@lib/gtm"

type Product = {
  objectID: string
  Title: string
  FeaturedImage?: { url: string }
  MedusaProduct?: {
    Handle: string
    Variants?: Array<{
      Price?: { CalculatedPriceNumber: number }
    }>
  }
  Metadata?: {
    AvgPackWeight?: string
  }
  [key: string]: any
}

const ClearButton = ({ onClick }: { onClick: () => void }) => (
  <ComboboxButton
    onClick={onClick}
    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
  >
    <Image
      src="/images/icons/x-mark.svg"
      alt="Clear search"
      width={19}
      height={19}
    />
  </ComboboxButton>
)

const SearchIcon = () => (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1 pointer-events-none">
    <Image
      src="/images/icons/magnifier.svg"
      alt="Search icon"
      width={19}
      height={19}
    />
  </div>
)

function InstantComboboxInput() {
  const { query, refine, clear } = useSearchBox()
  const lastTrackedQuery = useRef<string>("")

  // Track search event with debounce (when query is at least 3 chars and different)
  useEffect(() => {
    if (query.length >= 3 && query !== lastTrackedQuery.current) {
      const timer = setTimeout(() => {
        trackSearch(query)
        lastTrackedQuery.current = query
      }, 500) // 500ms debounce
      return () => clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="relative">
      <ComboboxInput
        className="w-full h-[50px] border rounded-[5px] border-Charcoal px-5 py-3 focus:outline-none focus:border-gray-500 text-p-md text-Charcoal placeholder:text-Pewter focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2"
        placeholder="Search products…"
        value={query}
        onChange={(e) => refine(e.target.value)}
        displayValue={(hit: Product) => hit?.Title || ""}
        aria-label="Search products"
        aria-autocomplete="list"
      />
      {query ? <ClearButton onClick={clear} /> : <SearchIcon />}
    </div>
  )
}

function formatPrice(price: number | undefined): string | null {
  if (price == null) return null
  return `$${price.toFixed(2)}`
}

function InstantComboboxOptions() {
  const { items } = useHits<Product>()
  const { query } = useSearchBox()

  return (
    <>
      {/* ARIA live region for search results */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {query.length >= 2 && (
          items.length === 0
            ? "No results found"
            : `${items.length} result${items.length !== 1 ? "s" : ""} found`
        )}
      </div>

      <ComboboxOptions
        className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-96 overflow-auto"
        aria-label="Search results"
      >
        {items.length === 0 ? (
          <div className="px-4 py-3 text-p-md text-Pewter" role="option" aria-selected="false">
            No results found.
          </div>
        ) : (
          items.map((item) => {
            const price = item.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber
            const formattedPrice = formatPrice(price)
            const weight = item.Metadata?.AvgPackWeight
            const imageUrl = item.FeaturedImage?.url

            return (
              <ComboboxOption key={item.objectID} value={item} as={Fragment}>
                {({ focus }) => (
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-gray-50 last:border-b-0 ${
                      focus ? "bg-gray-50" : ""
                    }`}
                  >
                    {/* Product image */}
                    <div className="w-12 h-12 rounded bg-gray-100 shrink-0 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.Title || "Product"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Title and price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-Charcoal truncate">
                        {item.Title}
                      </p>
                      {formattedPrice && (
                        <p className="text-sm text-Charcoal/70 mt-0.5">
                          <span className="font-semibold text-Charcoal">{formattedPrice}</span>
                          {weight && (
                            <span className="text-xs text-Charcoal/50 ml-1">per lb</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </ComboboxOption>
            )
          })
        )}
      </ComboboxOptions>
    </>
  )
}

export default function SearchBar() {
  const router = useRouter()
  const onSelect = useCallback(
    (product: Product) => {
      router.push(`/products/${product.MedusaProduct.Handle}`)
    },
    [router]
  )

  return (
    <InstantSearch
      searchClient={searchLiteClient}
      indexName={PRODUCT_INDEX}
      stalledSearchDelay={200}
    >
      <Configure hitsPerPage={10} />

      <Combobox onChange={onSelect}>
        <div className="relative w-full max-w-md mx-auto">
          <InstantComboboxInput />
          <InstantComboboxOptions />
        </div>
      </Combobox>
    </InstantSearch>
  )
}
