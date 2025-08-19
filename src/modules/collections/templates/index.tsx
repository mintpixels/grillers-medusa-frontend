"use client"

import React from "react"
import { InstantSearch, Configure } from "react-instantsearch"

import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import ProductCardHits from "@modules/algolia/components/product-card-hits"
import Pagination from "@modules/algolia/components/pagination"
import RefinementList from "@modules/algolia/components/refinement-list"

const CATEGORY_FILTER_ATTRIBUTES =
  "Categorization.ProductCollections.Slug" as const

interface CollectionTemplateProps {
  title: string
  slug: string
  countryCode: string
}

export default function CollectionTemplate({
  title,
  slug,
  countryCode,
}: CollectionTemplateProps) {
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
            <h1 className="text-h3 font-gyst text-Charcoal capitalize mb-8">
              {title}
            </h1>
            <Configure filters={filters} hitsPerPage={12} />
            <ProductCardHits />
            <div className="mt-8 flex justify-center">
              <Pagination />
            </div>
          </main>
        </div>
      </InstantSearch>
    </div>
  )
}
