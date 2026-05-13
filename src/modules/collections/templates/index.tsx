"use client"

import React, { useState, useMemo, useEffect } from "react"

import { ProductCollectionData, type StrapiCollectionProduct } from "@lib/data/strapi/collections"
import ViewToggle, { ViewMode } from "@modules/algolia/components/view-toggle"
import CollectionHero from "@modules/collections/components/collection-hero"
import StrapiProductGrid from "@modules/collections/components/strapi-product-grid"
import CollectionFilters, {
  type ActiveFilters,
  getActiveFilterCount,
  getEmptyFilters,
  hasActiveFilters,
  filterProducts,
  productsHaveFilters,
} from "@modules/collections/components/collection-filters"
import CollectionPagination from "@modules/collections/components/collection-pagination"

const PRODUCTS_PER_PAGE = 48

// Parse the first number from a string like "1-2", "24-28 oz.", "~17oz."
function parseLeadingNumber(val?: string): number {
  if (!val) return 0
  const match = val.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

interface CollectionTemplateProps {
  title: string
  slug: string
  countryCode: string
  collection?: ProductCollectionData
  products: StrapiCollectionProduct[]
}

export default function CollectionTemplate({
  title,
  slug,
  countryCode,
  collection,
  products,
}: CollectionTemplateProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid"
    const saved = window.sessionStorage.getItem("collection-view-mode")
    return saved === "grid" || saved === "list" ? saved : "grid"
  })
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("collection-view-mode", viewMode)
    }
  }, [viewMode])

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(getEmptyFilters())
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>("price-asc")
  // Mobile filter drawer — collapsed by default so products are the first
  // thing visible. Desktop renders the same filters in a sidebar, no drawer.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Lock body scroll while the mobile drawer is open and listen for Escape.
  useEffect(() => {
    if (!mobileFiltersOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFiltersOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [mobileFiltersOpen])

  // Filter products
  const filteredProducts = useMemo(
    () => filterProducts(products, activeFilters),
    [products, activeFilters]
  )

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    switch (sortBy) {
      case "price-asc":
        return sorted.sort(
          (a, b) =>
            (a.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? 0) -
            (b.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? 0)
        )
      case "price-desc":
        return sorted.sort(
          (a, b) =>
            (b.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? 0) -
            (a.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? 0)
        )
      case "name-asc":
        return sorted.sort((a, b) => a.Title.localeCompare(b.Title))
      case "name-desc":
        return sorted.sort((a, b) => b.Title.localeCompare(a.Title))
      case "servings-asc":
        return sorted.sort((a, b) => parseLeadingNumber(a.Metadata?.Serves) - parseLeadingNumber(b.Metadata?.Serves))
      case "servings-desc":
        return sorted.sort((a, b) => parseLeadingNumber(b.Metadata?.Serves) - parseLeadingNumber(a.Metadata?.Serves))
      case "weight-asc":
        return sorted.sort((a, b) => parseLeadingNumber(a.Metadata?.AvgPackWeight) - parseLeadingNumber(b.Metadata?.AvgPackWeight))
      case "weight-desc":
        return sorted.sort((a, b) => parseLeadingNumber(b.Metadata?.AvgPackWeight) - parseLeadingNumber(a.Metadata?.AvgPackWeight))
      default:
        return sorted
    }
  }, [filteredProducts, sortBy])

  // Paginate
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE
    return sortedProducts.slice(start, start + PRODUCTS_PER_PAGE)
  }, [sortedProducts, currentPage])

  // Reset to page 1 when filters change
  const handleFilterChange = (filters: ActiveFilters) => {
    setActiveFilters(filters)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const showFilters = productsHaveFilters(products)

  return (
    <>
      {/* Collection Hero with description and banner */}
      {collection && (
        <CollectionHero collection={collection} countryCode={countryCode} />
      )}

      <div className="pt-6 mt-6 pb-16 content-container border-t border-gray-200" data-testid="category-container">
        <div className={`gap-8 grid grid-cols-1 ${showFilters ? "lg:grid-cols-[0.25fr_1fr]" : ""}`}>
          {/* Desktop filter sidebar — hidden on mobile (drawer below). */}
          {showFilters && (
            <div className="hidden lg:block">
              <CollectionFilters
                products={products}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                currentSlug={slug}
              />
            </div>
          )}

          {/* Product grid and pagination */}
          <main className="flex-1 min-w-0">
            {/* Only show title if no hero */}
            {!collection?.HeroImage && !collection?.Description && (
              <h1 className="text-h3 font-gyst text-Charcoal capitalize mb-4">
                {title}
              </h1>
            )}

            {/* Product count, active filters, sort, and view toggle */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-sm text-gray-600 whitespace-nowrap mr-2">
                  Showing {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "product" : "products"}
                  {hasActiveFilters(activeFilters) && ` of ${products.length}`}
                </p>
                {hasActiveFilters(activeFilters) &&
                  [
                    ...Object.entries(activeFilters.metadata).flatMap(([groupId, fields]) =>
                      fields.map((field) => ({ groupId, field, value: field }))
                    ),
                    ...activeFilters.tags.map((value) => ({ groupId: "tags" as const, field: value, value })),
                  ].map(({ groupId, field, value }) => {
                      const label = value
                        .replace(/^L[23]:\s*/, "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .replace(/^MSG$/, "No MSG")

                      return (
                        <button
                          key={`${groupId}:${value}`}
                          onClick={() => {
                            if (groupId === "tags") {
                              handleFilterChange({
                                ...activeFilters,
                                tags: activeFilters.tags.filter((v) => v !== value),
                              })
                            } else {
                              const nextMetadata = { ...activeFilters.metadata }
                              const updated = (nextMetadata[groupId] || []).filter((v) => v !== field)
                              if (updated.length === 0) delete nextMetadata[groupId]
                              else nextMetadata[groupId] = updated
                              handleFilterChange({ ...activeFilters, metadata: nextMetadata })
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-Charcoal/10 text-Charcoal text-xs font-maison-neue rounded-full hover:bg-Charcoal/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
                          aria-label={`Remove filter: ${label}`}
                        >
                          <span>{label}</span>
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )
                    }
                  )
                }
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile-only Filters trigger. Desktop has the sidebar
                    so this button stays hidden ≥ lg. */}
                {showFilters && (
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-2 h-[44px] px-4 border border-gray-300 rounded-lg bg-white text-Charcoal text-sm font-maison-neue hover:border-Charcoal focus:outline-none focus:ring-1 focus:ring-Gold"
                    aria-label={`Open filters${getActiveFilterCount(activeFilters) > 0 ? `, ${getActiveFilterCount(activeFilters)} active` : ""}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
                    </svg>
                    <span>Filters</span>
                    {getActiveFilterCount(activeFilters) > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-Charcoal text-white text-xs font-maison-neue-mono">
                        {getActiveFilterCount(activeFilters)}
                      </span>
                    )}
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="text-sm border border-gray-300 rounded-lg h-[44px] px-3 pr-8 bg-white text-Charcoal font-maison-neue focus:outline-none focus:ring-1 focus:ring-Gold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23333%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center]"
                  aria-label="Sort products"
                >
                  <option value="default">Sort by</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="servings-asc">Servings: Low to High</option>
                  <option value="servings-desc">Servings: High to Low</option>
                  <option value="weight-asc">Weight: Low to High</option>
                  <option value="weight-desc">Weight: High to Low</option>
                </select>
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>

            {/* Product grid */}
            <StrapiProductGrid
              products={paginatedProducts}
              countryCode={countryCode}
              viewMode={viewMode}
              wide={!showFilters}
            />

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <CollectionPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile filter drawer. Hidden ≥ lg (desktop uses the sidebar
          above). Backdrop closes the drawer; Esc handler in the parent
          effect also closes it. */}
      {showFilters && (
        <div
          className={`lg:hidden fixed inset-0 z-40 ${
            mobileFiltersOpen ? "" : "pointer-events-none"
          }`}
          aria-hidden={!mobileFiltersOpen}
        >
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              mobileFiltersOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-md bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
              mobileFiltersOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-h4 font-gyst font-bold text-Charcoal">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-10 h-10 -mr-2 flex items-center justify-center text-Charcoal hover:bg-Charcoal/5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
                aria-label="Close filters"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <CollectionFilters
                products={products}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                currentSlug={slug}
                hideHeader
              />
            </div>
            <div className="px-5 py-4 border-t border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-12 bg-Charcoal text-white font-maison-neue font-bold text-sm uppercase tracking-wide rounded-md hover:bg-Charcoal/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
              >
                Show {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
