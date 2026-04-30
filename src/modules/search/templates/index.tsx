"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { InstantSearch, Configure, useHits, useSearchBox, useStats } from "react-instantsearch"
import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import StrapiProductGrid from "@modules/collections/components/strapi-product-grid"
import CollectionFilters, {
  type ActiveFilters,
  getEmptyFilters,
  hasActiveFilters,
  filterProducts,
  productsHaveFilters,
} from "@modules/collections/components/collection-filters"
import CollectionPagination from "@modules/collections/components/collection-pagination"

const RESULTS_PER_PAGE = 51

interface SearchResultsProps {
  initialQuery: string
}

// Adapt an Algolia hit to the StrapiCollectionProduct shape that
// CollectionFilters / StrapiProductGrid expect. The indexer has shipped
// both shapes over time — `MedusaProduct.Id` and `MedusaProduct.ProductId` —
// so we normalize ProductId so price hydration always finds the id.
function hitToProduct(hit: any): StrapiCollectionProduct {
  const mp = hit.MedusaProduct
  const normalizedMp = mp
    ? {
        ...mp,
        ProductId: mp.ProductId || mp.Id || "",
        Handle: mp.Handle || "",
      }
    : undefined
  return {
    documentId: hit.documentId || String(hit.objectID || ""),
    Title: hit.Title || "",
    FeaturedImage: hit.FeaturedImage,
    Metadata: hit.Metadata,
    Categorization: hit.Categorization,
    MedusaProduct: normalizedMp,
  } as StrapiCollectionProduct
}

// Force the InstantSearch query to match the URL ?q= on mount.
function QuerySync({ q }: { q: string }) {
  const { query, refine } = useSearchBox()
  useEffect(() => {
    if (q && q !== query) refine(q)
  }, [q, query, refine])
  return null
}

function ResultCount({ initialQuery }: { initialQuery: string }) {
  const { nbHits, query } = useStats()
  const display = query || initialQuery
  if (!display) return null
  return (
    <p className="text-p-md text-Charcoal/70">
      {nbHits} {nbHits === 1 ? "result" : "results"} for{" "}
      <span className="font-bold text-Charcoal">&ldquo;{display}&rdquo;</span>
    </p>
  )
}

function EmptyResults({
  query,
  countryCode,
}: {
  query: string
  countryCode: string
}) {
  return (
    <div className="py-16 text-center">
      <h2 className="text-h3-mobile md:text-h3 font-gyst text-Charcoal mb-3">
        No results for &ldquo;{query}&rdquo;
      </h2>
      <p className="text-p-md text-Charcoal/70 max-w-lg mx-auto mb-8">
        We couldn&apos;t find any products matching that search. Try a broader
        term, check spelling, or browse one of the popular categories below.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { label: "Beef", href: `/${countryCode}/store` },
          { label: "Chicken", href: `/${countryCode}/store` },
          { label: "Lamb", href: `/${countryCode}/store` },
          { label: "View all", href: `/${countryCode}/store` },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="px-4 py-2 border border-Charcoal/20 rounded-full text-p-sm font-maison-neue hover:border-Gold hover:text-Gold transition-colors"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function SearchBody({ initialQuery, countryCode }: { initialQuery: string; countryCode: string }) {
  const { items } = useHits<any>()
  const { query: liveQuery } = useSearchBox()
  const allProducts = useMemo(() => items.map(hitToProduct), [items])

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(getEmptyFilters())
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page on new query or filter change.
  const filtered = useMemo(
    () => filterProducts(allProducts, activeFilters),
    [allProducts, activeFilters]
  )

  const totalPages = Math.ceil(filtered.length / RESULTS_PER_PAGE)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE
    return filtered.slice(start, start + RESULTS_PER_PAGE)
  }, [filtered, currentPage])

  // Algolia indexes Strapi metadata but does not carry live Medusa prices,
  // so the visible page is hydrated with current Medusa pricing before the
  // grid renders. Falls back silently to Algolia data on Medusa failure.
  const [pricedProducts, setPricedProducts] = useState<StrapiCollectionProduct[]>(paginated)
  useEffect(() => {
    let cancelled = false
    setPricedProducts(paginated)
    if (paginated.length === 0) return
    enrichStrapiProductsWithMedusaPrices(paginated, countryCode)
      .then((enriched) => {
        if (!cancelled) setPricedProducts(enriched)
      })
      .catch(() => {
        // keep unpriced fallback
      })
    return () => {
      cancelled = true
    }
  }, [paginated, countryCode])

  const handleFilterChange = (filters: ActiveFilters) => {
    setActiveFilters(filters)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Reset to page 1 when the underlying result set changes (new search).
  useEffect(() => {
    setCurrentPage(1)
  }, [allProducts.length, initialQuery])

  const showFilters = productsHaveFilters(allProducts)
  const displayQuery = (liveQuery || initialQuery).trim()
  const isEmpty = displayQuery.length > 0 && allProducts.length === 0

  if (isEmpty) {
    return (
      <>
        <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
            Search
          </h1>
          <ResultCount initialQuery={initialQuery} />
        </div>
        <EmptyResults query={displayQuery} countryCode={countryCode} />
      </>
    )
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
          Search
        </h1>
        <ResultCount initialQuery={initialQuery} />
      </div>

      <div className={`gap-8 grid grid-cols-1 ${showFilters ? "lg:grid-cols-[0.25fr_1fr]" : ""}`}>
        {showFilters && (
          <CollectionFilters
            products={allProducts}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        )}

        <main className="flex-1">
          {hasActiveFilters(activeFilters) && (
            <p className="text-sm text-gray-600 mb-4">
              Showing {filtered.length} of {allProducts.length}
            </p>
          )}

          <StrapiProductGrid
            products={pricedProducts}
            countryCode={countryCode}
            viewMode="grid"
          />

          {totalPages > 1 && (
            <div className="mt-12">
              <CollectionPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default function SearchResults({ initialQuery }: SearchResultsProps) {
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode || "us"

  return (
    <div className="content-container py-10">
      <InstantSearch
        searchClient={searchLiteClient}
        indexName={PRODUCT_INDEX}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        {/* Pull every matching hit so we can filter + paginate client-side
            with the same components the collection page uses. 1000 is the
            Algolia per-request cap and is way above our current catalog. */}
        <Configure hitsPerPage={1000} />
        <QuerySync q={initialQuery} />
        <SearchBody initialQuery={initialQuery} countryCode={countryCode} />
      </InstantSearch>
    </div>
  )
}
