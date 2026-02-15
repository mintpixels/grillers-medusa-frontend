"use client"

import { useMemo } from "react"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

export type ActiveFilters = {
  preparation: string[]
  dietary: string[]
  tags: string[]
}

type FilterOption = {
  label: string
  value: string
  count: number
}

interface CollectionFiltersProps {
  products: StrapiCollectionProduct[]
  activeFilters: ActiveFilters
  onFilterChange: (filters: ActiveFilters) => void
}

export function getEmptyFilters(): ActiveFilters {
  return { preparation: [], dietary: [], tags: [] }
}

export function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    filters.preparation.length > 0 ||
    filters.dietary.length > 0 ||
    filters.tags.length > 0
  )
}

export function getActiveFilterCount(filters: ActiveFilters): number {
  return (
    filters.preparation.length +
    filters.dietary.length +
    filters.tags.length
  )
}

// Check if products have any filterable data
export function productsHaveFilters(products: StrapiCollectionProduct[]): boolean {
  const hasPreparation = products.some(
    (p) => p.Metadata?.Uncooked === true || p.Metadata?.Cooked === true
  )
  const hasDietary = products.some(
    (p) => p.Metadata?.GlutenFree === true || p.Metadata?.MSG === true
  )

  const tagSet = new Set<string>()
  products.forEach((p) => {
    p.Categorization?.ProductTags?.forEach((t) => {
      if (t.Name.startsWith("L2:") || t.Name.startsWith("L3:")) {
        tagSet.add(t.Name)
      }
    })
  })
  const hasTags = tagSet.size > 1

  return hasPreparation || hasDietary || hasTags
}

export function filterProducts(
  products: StrapiCollectionProduct[],
  filters: ActiveFilters
): StrapiCollectionProduct[] {
  return products.filter((product) => {
    // Preparation filters (OR within group)
    if (filters.preparation.length > 0) {
      const matchesPrep = filters.preparation.some((prep) => {
        if (prep === "Uncooked") return product.Metadata?.Uncooked === true
        if (prep === "Cooked") return product.Metadata?.Cooked === true
        return false
      })
      if (!matchesPrep) return false
    }

    // Dietary filters (AND within group)
    if (filters.dietary.length > 0) {
      const matchesDietary = filters.dietary.every((diet) => {
        if (diet === "GlutenFree") return product.Metadata?.GlutenFree === true
        if (diet === "NoMSG") return product.Metadata?.MSG === true
        return false
      })
      if (!matchesDietary) return false
    }

    // Tag filters (OR within group)
    if (filters.tags.length > 0) {
      const productTagNames =
        product.Categorization?.ProductTags?.map((t) => t.Name) || []
      const matchesTags = filters.tags.some((tag) =>
        productTagNames.includes(tag)
      )
      if (!matchesTags) return false
    }

    return true
  })
}

function FilterSection({
  title,
  options,
  activeValues,
  onToggle,
}: {
  title: string
  options: FilterOption[]
  activeValues: string[]
  onToggle: (value: string) => void
}) {
  if (options.length === 0) return null

  return (
    <div className="border-t border-Charcoal/10 pt-4">
      <h3 className="text-p-sm-mono font-maison-neue-mono font-bold uppercase text-Charcoal mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isActive = activeValues.includes(option.value)
          return (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer group pr-3"
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggle(option.value)}
                className="w-4 h-4 rounded border-gray-300 text-Charcoal focus:ring-Gold accent-Charcoal"
              />
              <span className="text-p-sm font-maison-neue text-Charcoal group-hover:text-VibrantRed transition-colors">
                {option.label}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                ({option.count})
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function CollectionFilters({
  products,
  activeFilters,
  onFilterChange,
}: CollectionFiltersProps) {
  // Build filter options from the product data
  const preparationOptions = useMemo<FilterOption[]>(() => {
    const opts: FilterOption[] = []
    const uncookedCount = products.filter(
      (p) => p.Metadata?.Uncooked === true
    ).length
    const cookedCount = products.filter(
      (p) => p.Metadata?.Cooked === true
    ).length

    if (uncookedCount > 0)
      opts.push({ label: "Uncooked", value: "Uncooked", count: uncookedCount })
    if (cookedCount > 0)
      opts.push({ label: "Ready to Eat", value: "Cooked", count: cookedCount })

    return opts
  }, [products])

  const dietaryOptions = useMemo<FilterOption[]>(() => {
    const opts: FilterOption[] = []
    const gfCount = products.filter(
      (p) => p.Metadata?.GlutenFree === true
    ).length
    const noMsgCount = products.filter(
      (p) => p.Metadata?.MSG === true
    ).length

    if (gfCount > 0)
      opts.push({ label: "Gluten Free", value: "GlutenFree", count: gfCount })
    if (noMsgCount > 0)
      opts.push({ label: "No MSG", value: "NoMSG", count: noMsgCount })

    return opts
  }, [products])

  // Build hierarchical tag filter options: L2 parents with L3 children
  type TagGroup = {
    l2: FilterOption
    l3Children: FilterOption[]
  }

  const tagGroups = useMemo<TagGroup[]>(() => {
    const l2Counts = new Map<string, number>()
    const l3Counts = new Map<string, number>()
    // Map L3 tag -> Set of L2 tags that appear on the same products
    const l3ToL2 = new Map<string, Set<string>>()

    products.forEach((product) => {
      const tags = product.Categorization?.ProductTags || []
      const productL2s = tags.filter((t) => t.Name.startsWith("L2:")).map((t) => t.Name)
      const productL3s = tags.filter((t) => t.Name.startsWith("L3:")).map((t) => t.Name)

      productL2s.forEach((l2) => {
        l2Counts.set(l2, (l2Counts.get(l2) || 0) + 1)
      })

      productL3s.forEach((l3) => {
        l3Counts.set(l3, (l3Counts.get(l3) || 0) + 1)
        // Associate this L3 with all L2s on the same product
        if (!l3ToL2.has(l3)) l3ToL2.set(l3, new Set())
        productL2s.forEach((l2) => l3ToL2.get(l3)!.add(l2))
      })
    })

    // Build groups: each L2 with its L3 children
    const groups: TagGroup[] = []

    Array.from(l2Counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([l2Name, l2Count]) => {
        const l2Label = l2Name.replace(/^L2:\s*/, "")

        // Find L3 tags that belong under this L2
        const children: FilterOption[] = []
        l3ToL2.forEach((parentL2s, l3Name) => {
          if (parentL2s.has(l2Name)) {
            const l3Label = l3Name.replace(/^L3:\s*/, "")
            children.push({
              label: l3Label,
              value: l3Name,
              count: l3Counts.get(l3Name) || 0,
            })
          }
        })

        children.sort((a, b) => b.count - a.count)

        groups.push({
          l2: { label: l2Label, value: l2Name, count: l2Count },
          l3Children: children,
        })
      })

    // Only show if there's more than one total option
    const totalOptions = groups.reduce((sum, g) => sum + 1 + g.l3Children.length, 0)
    if (totalOptions <= 1) return []

    return groups
  }, [products])

  const totalFilterCount = getActiveFilterCount(activeFilters)

  const toggleFilter = (
    group: keyof ActiveFilters,
    value: string
  ) => {
    const current = activeFilters[group]
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]

    onFilterChange({ ...activeFilters, [group]: updated })
  }

  const clearAll = () => {
    onFilterChange(getEmptyFilters())
  }

  const hasFilters = preparationOptions.length > 0 || dietaryOptions.length > 0 || tagGroups.length > 0

  if (!hasFilters) return null

  return (
    <aside className="w-full lg:sticky lg:top-[72px] lg:self-start lg:max-h-[calc(100vh-88px)] lg:flex lg:flex-col" aria-label="Product filters">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-h4 font-gyst font-bold text-Charcoal">Filters</h2>
        {totalFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-p-sm font-maison-neue text-VibrantRed hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
            aria-label="Clear all filters"
          >
            Clear All ({totalFilterCount})
          </button>
        )}
      </div>

      <div className="lg:overflow-y-auto lg:pb-6 space-y-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
      {/* Hierarchical Category filters: L2 parents with L3 children */}
      {tagGroups.length > 0 && (
        <div className="border-t border-Charcoal/10 pt-4">
          <h3 className="text-p-sm-mono font-maison-neue-mono font-bold uppercase text-Charcoal mb-3">
            Category
          </h3>
          <div className="flex flex-col gap-3">
            {tagGroups.map((group) => (
              <div key={group.l2.value}>
                {/* L2 parent */}
                <label className="flex items-center gap-2 cursor-pointer group pr-3">
                  <input
                    type="checkbox"
                    checked={activeFilters.tags.includes(group.l2.value)}
                    onChange={() => toggleFilter("tags", group.l2.value)}
                    className="w-4 h-4 rounded border-gray-300 text-Charcoal focus:ring-Gold accent-Charcoal"
                  />
                  <span className="text-p-sm font-maison-neue font-semibold text-Charcoal group-hover:text-VibrantRed transition-colors">
                    {group.l2.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    ({group.l2.count})
                  </span>
                </label>
                {/* L3 children */}
                {group.l3Children.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 ml-6">
                    {group.l3Children.map((child) => (
                      <label
                        key={child.value}
                        className="flex items-center gap-2 cursor-pointer group pr-3"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.tags.includes(child.value)}
                          onChange={() => toggleFilter("tags", child.value)}
                          className="w-4 h-4 rounded border-gray-300 text-Charcoal focus:ring-Gold accent-Charcoal"
                        />
                        <span className="text-p-sm font-maison-neue text-Charcoal group-hover:text-VibrantRed transition-colors">
                          {child.label}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          ({child.count})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterSection
        title="Dietary"
        options={dietaryOptions}
        activeValues={activeFilters.dietary}
        onToggle={(value) => toggleFilter("dietary", value)}
      />

      <FilterSection
        title="Preparation"
        options={preparationOptions}
        activeValues={activeFilters.preparation}
        onToggle={(value) => toggleFilter("preparation", value)}
      />

      </div>
    </aside>
  )
}
