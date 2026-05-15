"use client"

import { jitsuTrack } from "@lib/jitsu"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import type { ActiveFilters } from "@modules/collections/components/collection-filters"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type MetadataChip = {
  id: string
  label: string
  groupId: string
  field: string
}

const METADATA_CHIPS: MetadataChip[] = [
  {
    id: "heat-and-serve",
    label: "Heat & Serve",
    groupId: "cookState",
    field: "HeatAndServe",
  },
  {
    id: "passover",
    label: "Passover",
    groupId: "kosher",
    field: "KosherForPassover",
  },
  {
    id: "grass-fed",
    label: "Grass-Fed",
    groupId: "sourcing",
    field: "GrassFed",
  },
]

const PRICE_THRESHOLDS = [25, 50, 100]

function priceOf(product: StrapiCollectionProduct): number | null {
  const value =
    product.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function productId(product: StrapiCollectionProduct): string | null {
  return product.MedusaProduct?.ProductId || null
}

function chipClasses(active: boolean): string {
  return [
    "inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold",
    active
      ? "border-Charcoal bg-Charcoal text-white"
      : "border-Charcoal/20 bg-white text-Charcoal hover:border-Charcoal",
  ].join(" ")
}

export default function QuickFilterBar({
  products,
  activeFilters,
  onFilterChange,
  recentProductIds = [],
}: {
  products: StrapiCollectionProduct[]
  activeFilters: ActiveFilters
  onFilterChange: (filters: ActiveFilters) => void
  recentProductIds?: string[]
}) {
  const recentSet = new Set(recentProductIds)
  const metadataChips = METADATA_CHIPS.map((chip) => ({
    ...chip,
    count: products.filter(
      (product) =>
        (product.Metadata as Record<string, unknown> | undefined)?.[
          chip.field
        ] === true
    ).length,
  })).filter((chip) => chip.count > 0)

  const priceChip = PRICE_THRESHOLDS.map((threshold) => ({
    threshold,
    count: products.filter((product) => {
      const price = priceOf(product)
      return price !== null && price <= threshold
    }).length,
  })).find((chip) => chip.count > 0 && chip.count < products.length)

  const recentCount = products.filter((product) => {
    const id = productId(product)
    return id ? recentSet.has(id) : false
  }).length

  if (
    metadataChips.length === 0 &&
    !priceChip &&
    recentCount === 0 &&
    products.length === 0
  ) {
    return null
  }

  const toggleMetadata = (chip: MetadataChip) => {
    const current = activeFilters.metadata[chip.groupId] || []
    const isActive = current.includes(chip.field)
    const updated = isActive
      ? current.filter((value) => value !== chip.field)
      : [...current, chip.field]
    const nextMetadata = { ...activeFilters.metadata, [chip.groupId]: updated }
    if (updated.length === 0) delete nextMetadata[chip.groupId]
    jitsuTrack("quick_filter_applied", {
      filter_type: chip.groupId,
      filter_value: chip.field,
      action: isActive ? "removed" : "applied",
    })
    onFilterChange({ ...activeFilters, metadata: nextMetadata })
  }

  const togglePrice = (threshold: number) => {
    const isActive = activeFilters.priceMax === threshold
    jitsuTrack("quick_filter_applied", {
      filter_type: "price",
      filter_value: threshold,
      action: isActive ? "removed" : "applied",
    })
    onFilterChange({
      ...activeFilters,
      priceMax: isActive ? null : threshold,
    })
  }

  const toggleRecent = () => {
    const isActive = !!activeFilters.recentOnly
    jitsuTrack("quick_filter_applied", {
      filter_type: "recently_ordered",
      action: isActive ? "removed" : "applied",
    })
    onFilterChange({
      ...activeFilters,
      recentOnly: !isActive,
    })
  }

  return (
    <section className="mb-5 border-y border-Charcoal/10 py-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-Charcoal">
          Shop fast
        </h2>
        <LocalizedClientLink
          href="/shipping/ups"
          className="hidden font-maison-neue text-xs text-Charcoal/60 underline-offset-4 hover:text-Charcoal hover:underline sm:inline"
        >
          Ships nationwide
        </LocalizedClientLink>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {metadataChips.map((chip) => {
          const active = (activeFilters.metadata[chip.groupId] || []).includes(
            chip.field
          )
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => toggleMetadata(chip)}
              className={chipClasses(active)}
              aria-pressed={active}
            >
              {chip.label}
              <span className="ml-2 text-current/60">{chip.count}</span>
            </button>
          )
        })}
        {priceChip && (
          <button
            type="button"
            onClick={() => togglePrice(priceChip.threshold)}
            className={chipClasses(activeFilters.priceMax === priceChip.threshold)}
            aria-pressed={activeFilters.priceMax === priceChip.threshold}
          >
            Under ${priceChip.threshold}
            <span className="ml-2 text-current/60">{priceChip.count}</span>
          </button>
        )}
        {recentCount > 0 && (
          <button
            type="button"
            onClick={toggleRecent}
            className={chipClasses(!!activeFilters.recentOnly)}
            aria-pressed={!!activeFilters.recentOnly}
          >
            Ordered before
            <span className="ml-2 text-current/60">{recentCount}</span>
          </button>
        )}
        <LocalizedClientLink
          href="/shipping/ups"
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-Charcoal/20 bg-white px-4 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal transition-colors hover:border-Charcoal sm:hidden"
        >
          Ships nationwide
        </LocalizedClientLink>
      </div>
    </section>
  )
}
