"use client"

import { useState, useMemo } from "react"
import { PurchaseHistoryItem } from "@lib/data/orders"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import { ProductCard } from "@modules/collections/components/strapi-product-grid"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SortOption = "recent" | "frequent" | "az" | "price"
type DateFilter = "all" | "30" | "60" | "90"

export default function ReorderBrowser({
  history,
  strapiMap,
  countryCode,
}: {
  history: PurchaseHistoryItem[]
  strapiMap: Record<string, StrapiCollectionProduct>
  countryCode: string
}) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("recent")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")

  const filtered = useMemo(() => {
    const seen = new Set<string>()
    let items: Array<PurchaseHistoryItem & { strapiProduct?: StrapiCollectionProduct }> = []

    for (const h of history) {
      if (seen.has(h.productId)) continue
      seen.add(h.productId)
      items.push({ ...h, strapiProduct: strapiMap[h.productId] })
    }

    if (dateFilter !== "all") {
      const days = parseInt(dateFilter)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      items = items.filter((i) => new Date(i.lastOrderedAt) >= cutoff)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => {
        const title = i.strapiProduct?.Title || i.productTitle
        return title.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
      })
    }

    switch (sort) {
      case "recent":
        items.sort((a, b) => new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime())
        break
      case "frequent":
        items.sort((a, b) => b.timesOrdered - a.timesOrdered)
        break
      case "az":
        items.sort((a, b) => {
          const aTitle = a.strapiProduct?.Title || a.productTitle
          const bTitle = b.strapiProduct?.Title || b.productTitle
          return aTitle.localeCompare(bTitle)
        })
        break
      case "price":
        items.sort((a, b) => {
          const aPrice = a.strapiProduct?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? a.unitPrice / 100
          const bPrice = b.strapiProduct?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? b.unitPrice / 100
          return aPrice - bPrice
        })
        break
    }

    return items
  }, [history, search, sort, dateFilter, strapiMap])

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-Charcoal/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652" />
        </svg>
        <p className="text-lg font-gyst font-bold text-Charcoal mb-2">No purchase history yet</p>
        <p className="text-sm font-maison-neue text-Charcoal/50 mb-6">
          Once you place an order, your products will appear here for easy reordering.
        </p>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center gap-2 px-6 py-3 bg-Gold text-Charcoal font-rexton font-bold text-sm uppercase rounded-[5px] hover:bg-Gold/90 transition-colors"
        >
          Browse Products
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Search + Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col small:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-Charcoal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search your past purchases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="px-3 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-Gold"
          >
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-Gold"
          >
            <option value="recent">Most Recent</option>
            <option value="frequent">Most Frequent</option>
            <option value="az">A - Z</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>

        <p className="mt-3 text-xs font-maison-neue text-Charcoal/40">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Product Grid - uses same ProductCard as collection pages */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filtered.map((item) => {
            if (item.strapiProduct) {
              return (
                <ProductCard
                  key={item.productId}
                  product={item.strapiProduct}
                  countryCode={countryCode}
                />
              )
            }

            return null
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-maison-neue text-Charcoal/50">
            No products match your search. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  )
}
