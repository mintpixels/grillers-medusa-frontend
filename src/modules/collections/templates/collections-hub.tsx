"use client"

import { useEffect, useMemo, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CollectionHubCard from "@modules/collections/components/collection-hub-card"
import type { CuratedCollection } from "@lib/data/strapi/curated-collections"

type CollectionsHubProps = {
  collections?: CuratedCollection[]
  countryCode: string
}

const occasionLabels: Record<string, string> = {
  starter: "First orders",
  shabbos: "Shabbos",
  weeknight: "Weeknight",
  holiday: "Holidays",
  grilling: "Grill",
  premium: "Premium",
  heritage: "Heritage",
  prepared: "Prepared",
  stock_up: "Stock up",
  cart_upsell: "Cart builders",
  other: "More paths",
}

function formatOccasion(value?: string | null) {
  if (!value) return "More paths"
  return (
    occasionLabels[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

function sectionId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function collectionGroups(collections: CuratedCollection[]) {
  const groups = new Map<string, CuratedCollection[]>()

  for (const collection of collections) {
    const label = formatOccasion(collection.Occasion)
    groups.set(label, [...(groups.get(label) || []), collection])
  }

  return Array.from(groups.entries())
}

export default function CollectionsHub({
  collections: initialCollections = [],
  countryCode,
}: CollectionsHubProps) {
  const [collections, setCollections] =
    useState<CuratedCollection[]>(initialCollections)
  const [isLoading, setIsLoading] = useState(initialCollections.length === 0)
  const [error, setError] = useState<string | null>(null)
  const groups = useMemo(() => collectionGroups(collections), [collections])

  useEffect(() => {
    if (initialCollections.length > 0) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    fetch("/api/curated-collections?limit=60")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load collections")
        return response.json() as Promise<{ collections: CuratedCollection[] }>
      })
      .then((data) => {
        if (!isMounted) return
        setCollections(data.collections || [])
      })
      .catch((err) => {
        console.error(err)
        if (isMounted) {
          setError("Collections are taking too long to load.")
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [initialCollections.length])

  return (
    <main className="bg-Scroll">
      <section className="content-container py-8 md:py-12">
        <div className="max-w-4xl">
          <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
            Shop collections
          </p>
          <h1 className="mt-3 font-gyst text-h1-mobile font-bold leading-none text-Charcoal md:text-h1">
            Build a cart around the way you actually cook.
          </h1>
          <p className="mt-4 max-w-2xl font-maison-neue text-p-lg leading-relaxed text-Charcoal/70">
            Curated kosher meat paths for first orders, family freezer stock,
            Shabbos tables, local delivery, and cold-chain shipping. Every
            collection shows the item-level price math before you add it.
          </p>
        </div>

        {groups.length > 0 && (
          <nav
            aria-label="Collection paths"
            className="mt-6 flex gap-2 overflow-x-auto pb-2"
          >
            <a
              href="#all-collections"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-Charcoal px-4 font-maison-neue text-sm font-semibold text-white"
            >
              All
            </a>
            {groups.map(([label]) => (
              <a
                key={label}
                href={`#${sectionId(label)}`}
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-Charcoal/15 bg-white px-4 font-maison-neue text-sm font-semibold text-Charcoal hover:border-Charcoal"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </section>

      <section
        id="all-collections"
        className="content-container border-t border-Charcoal/10 py-8 md:py-10"
      >
        <div className="mb-7 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-Gold">
              Browse paths
            </p>
            <h2 className="mt-2 font-maison-neue text-p-lg font-semibold leading-tight text-Charcoal">
              {isLoading
                ? "Loading collections..."
                : `${collections.length} collections available.`}
            </h2>
          </div>
          <p className="font-maison-neue text-sm leading-relaxed text-Charcoal/60 md:max-w-sm md:text-right">
            Choose one as a complete cart, or open it to adjust item by item.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="grid min-h-[280px] animate-pulse rounded-[5px] border border-Charcoal/10 bg-white lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]"
              >
                <div className="bg-Charcoal/10" />
                <div className="space-y-4 p-5 md:p-6">
                  <div className="h-3 w-24 rounded bg-Charcoal/10" />
                  <div className="h-10 w-2/3 rounded bg-Charcoal/10" />
                  <div className="h-16 rounded bg-Charcoal/10" />
                  <div className="h-11 w-40 rounded bg-Charcoal/10" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-12">
            {groups.map(([label, groupedCollections]) => (
              <div key={label} id={sectionId(label)} className="scroll-mt-24">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
                      {label}
                    </p>
                    <h3 className="mt-2 font-gyst text-h3-mobile font-bold leading-tight text-Charcoal md:text-h3">
                      {label} collections
                    </h3>
                  </div>
                  <a
                    href="#all-collections"
                    className="hidden font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal underline underline-offset-4 hover:text-VibrantRed sm:inline-flex"
                  >
                    Back to all
                  </a>
                </div>
                <div className="space-y-6">
                  {groupedCollections.map((collection) => (
                    <CollectionHubCard
                      key={collection.documentId || collection.Slug}
                      collection={collection}
                      countryCode={countryCode}
                      label={label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[5px] border border-Charcoal/10 bg-white p-6">
            <h2 className="font-gyst text-h3-mobile font-bold text-Charcoal md:text-h3">
              {error ? "Collections are taking too long." : "Collections are being restocked."}
            </h2>
            <p className="mt-3 max-w-xl font-maison-neue text-sm leading-relaxed text-Charcoal/65">
              {error ||
                "The curated collection feed is temporarily unavailable. You can still shop the butcher counter while this page refreshes."}
            </p>
            <LocalizedClientLink
              href="/store"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-[5px] border border-Charcoal px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal hover:bg-Charcoal hover:text-white"
            >
              Shop all products
            </LocalizedClientLink>
          </div>
        )}
      </section>
    </main>
  )
}
