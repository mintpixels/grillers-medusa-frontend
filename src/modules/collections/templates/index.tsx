"use client"

import React, { useState, useMemo } from "react"

import { ProductCollectionData, type StrapiCollectionProduct } from "@lib/data/strapi/collections"
import ViewToggle, { ViewMode } from "@modules/algolia/components/view-toggle"
import CollectionHero from "@modules/collections/components/collection-hero"
import StrapiProductGrid from "@modules/collections/components/strapi-product-grid"
import CollectionFilters, {
  type ActiveFilters,
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(getEmptyFilters())
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>("price-asc")

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

      <div className="py-6 content-container" data-testid="category-container">
        <div className={`gap-8 grid grid-cols-1 ${showFilters ? "lg:grid-cols-[0.25fr_1fr]" : ""}`}>
          {/* Filter sidebar */}
          {showFilters && (
            <CollectionFilters
              products={products}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          )}

          {/* Product grid and pagination */}
          <main className="flex-1">
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
                  [...activeFilters.preparation, ...activeFilters.dietary, ...activeFilters.tags].map(
                    (value) => {
                      const label = value
                        .replace(/^L[23]:\s*/, "")
                        .replace("GlutenFree", "Gluten Free")
                        .replace("NoMSG", "No MSG")

                      return (
                        <button
                          key={value}
                          onClick={() => {
                            handleFilterChange({
                              preparation: activeFilters.preparation.filter((v) => v !== value),
                              dietary: activeFilters.dietary.filter((v) => v !== value),
                              tags: activeFilters.tags.filter((v) => v !== value),
                            })
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
    </>
  )
}
