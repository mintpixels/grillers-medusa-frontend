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
        className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto"
        aria-label="Search results"
      >
        {items.length === 0 ? (
          <div className="px-4 py-2 text-p-md text-Pewter" role="option" aria-selected="false">
            No results found.
          </div>
        ) : (
          items.map((item) => (
            <ComboboxOption key={item.objectID} value={item} as={Fragment}>
              {({ focus }) => (
                <div
                  className={`px-4 py-2 cursor-pointer ${
                    focus ? "bg-gray-100 text-Charcoal" : "text-Pewter"
                  }`}
                >
                  {item.Title}
                </div>
              )}
            </ComboboxOption>
          ))
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
