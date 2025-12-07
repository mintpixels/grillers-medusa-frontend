"use client"

import React, { useState } from "react"
import { InstantSearch, Configure, useStats } from "react-instantsearch"

import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import ProductCardHits from "@modules/algolia/components/product-card-hits"
import Pagination from "@modules/algolia/components/pagination"
import RefinementList from "@modules/algolia/components/refinement-list"
import ViewToggle, { ViewMode } from "@modules/algolia/components/view-toggle"

const CATEGORY_FILTER_ATTRIBUTES =
  "Categorization.ProductCollections.Slug" as const

interface CollectionTemplateProps {
  title: string
  slug: string
  countryCode: string
}

function ProductCount() {
  const { nbHits } = useStats()
  
  return (
    <p className="text-sm text-gray-600">
      Showing {nbHits} {nbHits === 1 ? 'product' : 'products'}
    </p>
  )
}

export default function CollectionTemplate({
  title,
  slug,
  countryCode,
}: CollectionTemplateProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const filters = CATEGORY_FILTER_ATTRIBUTES + ":" + slug

  return (
    <div className="py-12 content-container" data-testid="category-container">
      <InstantSearch searchClient={searchLiteClient} indexName={PRODUCT_INDEX}>
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-[0.25fr_1fr]">
          {/* Sidebar with styled facets */}
          <aside className="w-full space-y-6">
            <div>
              <h2 className="text-h4 font-gyst font-bold text-Charcoal mb-2">
                Dietary
              </h2>
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
          </aside>

          {/* Product grid and pagination */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-h3 font-gyst text-Charcoal capitalize">
                {title}
              </h1>
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
            <ProductCount />
            <div className="mb-8" />
            <Configure filters={filters} hitsPerPage={12} />
            <ProductCardHits viewMode={viewMode} />
            <div className="mt-8 flex justify-center">
              <Pagination />
            </div>
          </main>
        </div>
      </InstantSearch>
    </div>
  )
}
