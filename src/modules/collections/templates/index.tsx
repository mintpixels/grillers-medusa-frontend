"use client"

import React, { useState } from "react"
import { InstantSearch, Configure, useStats, useClearRefinements, useCurrentRefinements } from "react-instantsearch"

import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import { ProductCollectionData } from "@lib/data/strapi/collections"
import ProductCardHits from "@modules/algolia/components/product-card-hits"
import Pagination from "@modules/algolia/components/pagination"
import RefinementList from "@modules/algolia/components/refinement-list"
import ViewToggle, { ViewMode } from "@modules/algolia/components/view-toggle"
import CollectionHero from "@modules/collections/components/collection-hero"

const CATEGORY_FILTER_ATTRIBUTES =
  "Categorization.ProductCollections.Slug" as const

interface CollectionTemplateProps {
  title: string
  slug: string
  countryCode: string
  collection?: ProductCollectionData
}

function ProductCount() {
  const { nbHits } = useStats()
  
  return (
    <p className="text-sm text-gray-600">
      Showing {nbHits} {nbHits === 1 ? 'product' : 'products'}
    </p>
  )
}

function ClearFiltersButton() {
  const { refine, canRefine } = useClearRefinements()
  const { items } = useCurrentRefinements()
  
  // Only show if there are active refinements
  if (!canRefine || items.length === 0) {
    return null
  }
  
  return (
    <button
      onClick={() => refine()}
      className="text-p-sm font-maison-neue text-VibrantRed hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
      aria-label="Clear all filters"
    >
      Clear All Filters ({items.reduce((acc, item) => acc + item.refinements.length, 0)})
    </button>
  )
}

function ActiveFilters() {
  const { items, refine } = useCurrentRefinements()
  
  if (items.length === 0) {
    return null
  }
  
  return (
    <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Active filters">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <button
            key={`${item.attribute}-${refinement.value}`}
            onClick={() => refine(refinement)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-Charcoal/10 text-Charcoal text-p-sm font-maison-neue rounded-full hover:bg-Charcoal/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
            aria-label={`Remove filter: ${refinement.label}`}
          >
            <span>{refinement.label}</span>
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
        ))
      )}
    </div>
  )
}

export default function CollectionTemplate({
  title,
  slug,
  countryCode,
  collection,
}: CollectionTemplateProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const filters = CATEGORY_FILTER_ATTRIBUTES + ":" + slug

  return (
    <>
      {/* Collection Hero with description and banner */}
      {collection && (
        <CollectionHero collection={collection} countryCode={countryCode} />
      )}

      <div className="py-12 content-container" data-testid="category-container">
        <InstantSearch searchClient={searchLiteClient} indexName={PRODUCT_INDEX}>
          <div className="gap-8 grid grid-cols-1 lg:grid-cols-[0.25fr_1fr]">
            {/* Sidebar with styled facets */}
            <aside className="w-full space-y-6" aria-label="Product filters">
              <div className="flex items-center justify-between">
                <h2 className="text-h4 font-gyst font-bold text-Charcoal">
                  Filters
                </h2>
                <ClearFiltersButton />
              </div>

              {/* Dietary Filters */}
              <div className="border-t border-Charcoal/10 pt-4">
                <h3 className="text-p-sm-mono font-maison-neue-mono font-bold uppercase text-Charcoal mb-3">
                  Dietary
                </h3>
                <RefinementList
                  attribute="Metadata.GlutenFree"
                  customLabel="Gluten Free"
                />
                <RefinementList
                  attribute="Metadata.Uncooked"
                  customLabel="Uncooked"
                />
                <RefinementList
                  attribute="Metadata.Cooked"
                  customLabel="Cooked"
                />
              </div>

              {/* Certifications Filters */}
              <div className="border-t border-Charcoal/10 pt-4">
                <h3 className="text-p-sm-mono font-maison-neue-mono font-bold uppercase text-Charcoal mb-3">
                  Certifications
                </h3>
                <RefinementList
                  attribute="Categorization.Certifications"
                />
              </div>

              {/* Price Range - using Algolia's numeric range if available */}
              <div className="border-t border-Charcoal/10 pt-4">
                <h3 className="text-p-sm-mono font-maison-neue-mono font-bold uppercase text-Charcoal mb-3">
                  Pack Size
                </h3>
                <RefinementList
                  attribute="Metadata.AvgPackSize"
                />
              </div>
            </aside>

            {/* Product grid and pagination */}
            <main className="flex-1">
              <div className="flex items-center justify-between mb-4">
                {/* Only show title if no hero (hero already shows title) */}
                {!collection?.HeroImage && !collection?.Description && (
                  <h1 className="text-h3 font-gyst text-Charcoal capitalize">
                    {title}
                  </h1>
                )}
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
              
              {/* Active filters display */}
              <ActiveFilters />
              
              <ProductCount />
              <div className="mb-8" />
              <Configure filters={filters} hitsPerPage={12} />
              <ProductCardHits 
                viewMode={viewMode} 
                listId={`collection_${slug}`}
                listName={title}
              />
              <div className="mt-8 flex justify-center">
                <Pagination />
              </div>
            </main>
          </div>
        </InstantSearch>
      </div>
    </>
  )
}
