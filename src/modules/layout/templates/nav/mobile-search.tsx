"use client"

import { Fragment, useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogPanel,
  Transition,
  Combobox,
  ComboboxInput,
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
  MedusaProduct?: {
    Handle: string
  }
  [key: string]: any
}

function MobileSearchInput({
  onClose,
}: {
  onClose: () => void
}) {
  const { query, refine, clear } = useSearchBox()
  const inputRef = useRef<HTMLInputElement>(null)
  const lastTrackedQuery = useRef<string>("")

  // Track search event with debounce
  useEffect(() => {
    if (query.length >= 3 && query !== lastTrackedQuery.current) {
      const timer = setTimeout(() => {
        trackSearch(query)
        lastTrackedQuery.current = query
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [query])

  // Auto-focus input when opened
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="relative">
      <ComboboxInput
        ref={inputRef}
        className="w-full h-12 border-b border-Charcoal/20 px-4 pr-20 focus:outline-none text-p-md text-Charcoal placeholder:text-Pewter bg-transparent"
        placeholder="Search products…"
        value={query}
        onChange={(e) => refine(e.target.value)}
        displayValue={(hit: Product) => hit?.Title || ""}
        aria-label="Search products"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {query && (
          <button
            onClick={clear}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
            aria-label="Clear search"
          >
            <Image
              src="/images/icons/x-mark.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
            />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 text-p-sm font-maison-neue text-Charcoal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function MobileSearchResults({ onSelect }: { onSelect: (product: Product) => void }) {
  const { items } = useHits<Product>()
  const { query } = useSearchBox()

  if (query.length < 2) {
    return (
      <div className="px-4 py-8 text-center text-p-md text-Pewter">
        Start typing to search products...
      </div>
    )
  }

  return (
    <>
      {/* ARIA live region for search results */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {items.length === 0
          ? "No results found"
          : `${items.length} result${items.length !== 1 ? "s" : ""} found`}
      </div>

      <ComboboxOptions
        static
        className="max-h-[60vh] overflow-auto"
        aria-label="Search results"
      >
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-p-md text-Pewter">
            No products found for &quot;{query}&quot;
          </div>
        ) : (
          items.map((item) => (
            <ComboboxOption key={item.objectID} value={item} as={Fragment}>
              {({ focus }) => (
                <button
                  onClick={() => onSelect(item)}
                  className={`w-full px-4 py-3 text-left text-p-md font-maison-neue ${
                    focus ? "bg-gray-100 text-Charcoal" : "text-Pewter"
                  }`}
                >
                  {item.Title}
                </button>
              )}
            </ComboboxOption>
          ))
        )}
      </ComboboxOptions>
    </>
  )
}

export default function MobileSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleOpen = useCallback(() => setIsOpen(true), [])
  const handleClose = useCallback(() => setIsOpen(false), [])

  const handleSelect = useCallback(
    (product: Product) => {
      if (product?.MedusaProduct?.Handle) {
        router.push(`/products/${product.MedusaProduct.Handle}`)
        handleClose()
      }
    },
    [router, handleClose]
  )

  return (
    <>
      {/* Mobile search trigger button */}
      <button
        onClick={handleOpen}
        className="md:hidden p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
        aria-label="Open search"
      >
        <Image
          src="/images/icons/magnifier.svg"
          alt=""
          width={24}
          height={24}
          aria-hidden="true"
        />
      </button>

      {/* Mobile search dialog */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={handleClose} className="relative z-50">
          <Transition
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition>

          <Transition
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 -translate-y-full"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-full"
          >
            <DialogPanel className="fixed inset-x-0 top-0 bg-white shadow-lg">
              <InstantSearch
                searchClient={searchLiteClient}
                indexName={PRODUCT_INDEX}
                stalledSearchDelay={200}
              >
                <Configure hitsPerPage={10} />

                <Combobox onChange={handleSelect}>
                  <MobileSearchInput onClose={handleClose} />
                  <MobileSearchResults onSelect={handleSelect} />
                </Combobox>
              </InstantSearch>
            </DialogPanel>
          </Transition>
        </Dialog>
      </Transition>
    </>
  )
}
