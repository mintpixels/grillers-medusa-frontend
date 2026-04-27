"use client"

import { InstantSearch, Configure, useStats } from "react-instantsearch"
import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import ProductCardHits from "@modules/algolia/components/product-card-hits"

interface SearchResultsProps {
  initialQuery: string
}

function ResultCount() {
  const { nbHits, query } = useStats()
  if (!query) return null
  return (
    <p className="text-p-md text-Charcoal/70 mb-6">
      {nbHits} {nbHits === 1 ? "result" : "results"} for{" "}
      <span className="font-bold text-Charcoal">&ldquo;{query}&rdquo;</span>
    </p>
  )
}

export default function SearchResults({ initialQuery }: SearchResultsProps) {
  return (
    <div className="content-container py-10">
      <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal mb-2">
        Search
      </h1>

      <InstantSearch
        searchClient={searchLiteClient}
        indexName={PRODUCT_INDEX}
        initialUiState={{
          [PRODUCT_INDEX]: { query: initialQuery },
        }}
      >
        <Configure hitsPerPage={48} />
        <ResultCount />
        <ProductCardHits viewMode="grid" listId="search" listName="Search Results" />
      </InstantSearch>
    </div>
  )
}
