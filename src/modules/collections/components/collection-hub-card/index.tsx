"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp } from "lucide-react"

import type { CuratedCollection } from "@lib/data/strapi/curated-collections"
import {
  collectionEstimatedSubtotals,
  getCollectionSubstitutionGuardrails,
  lineCartMetadata,
} from "@lib/util/collection-substitutions"
import AddBundleButton from "@modules/products/components/pairs-well-with/add-bundle-button"
import CuratedCollectionItems, {
  getResolvedCollectionItems,
} from "@modules/collections/components/curated-collection-items"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CollectionHubCardProps = {
  collection: CuratedCollection
  countryCode: string
  label: string
}

function imageForCollection(collection: CuratedCollection) {
  return collection.HeroImage?.url || null
}

function addItemsForCollection(collection: CuratedCollection) {
  return getResolvedCollectionItems(collection)
    .map((collectionItem) => {
      const variant = collectionItem.Product.MedusaProduct?.Variants?.[0]
      return {
        variantId: variant?.VariantId || "",
        title: collectionItem.Product.Title,
        quantity: collectionItem.Quantity || 1,
        metadata: lineCartMetadata(collectionItem),
      }
    })
    .filter((item) => item.variantId)
}

export default function CollectionHubCard({
  collection,
  countryCode,
  label,
}: CollectionHubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [detail, setDetail] = useState<CuratedCollection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageUrl = imageForCollection(collection)
  const detailCollection = detail || collection
  const products = getResolvedCollectionItems(detailCollection)
  const canShowDetails = Boolean(detail)
  const { total, eligible, excluded } = collectionEstimatedSubtotals(products)
  const totalQuantity = products.reduce(
    (sum, item) => sum + (item.Quantity || 1),
    0
  )
  const guardrails = getCollectionSubstitutionGuardrails(products)
  const disabledReason = guardrails.needsBusinessReview
    ? "Needs substitution review before purchase."
    : guardrails.requiresAcknowledgement
    ? "Review substitution details first."
    : undefined

  const expand = async () => {
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)
    if (!nextExpanded || detail || isLoading) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/curated-collections/${encodeURIComponent(collection.Slug)}?countryCode=${countryCode}`
      )
      if (!response.ok) {
        throw new Error(`Failed to load ${collection.Slug}`)
      }
      const data = (await response.json()) as {
        collection: CuratedCollection | null
      }
      if (!data.collection) {
        throw new Error(`Missing collection ${collection.Slug}`)
      }
      setDetail(data.collection)
    } catch (err) {
      console.error(err)
      setError("Item details are taking too long. Open the collection page.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article className="grid min-w-0 overflow-hidden rounded-[5px] border border-Charcoal/10 bg-white lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
      <LocalizedClientLink
        href={`/collections/${collection.Slug}`}
        className="group relative block min-h-[260px] bg-Scroll"
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={collection.HeroImageAlt || collection.Name}
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
              {collection.Eyebrow || label}
            </p>
            <LocalizedClientLink href={`/collections/${collection.Slug}`}>
              <h2 className="mt-2 font-gyst text-h3-mobile font-bold leading-tight text-Charcoal hover:text-VibrantRed md:text-h3">
                {collection.Name}
              </h2>
            </LocalizedClientLink>
          </div>
          <div className="rounded-full bg-Scroll px-3 py-1 text-right font-maison-neue-mono text-[10px] font-bold uppercase leading-tight tracking-wide text-Charcoal/60">
            {canShowDetails
              ? `${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`
              : "View items"}
          </div>
        </div>

        <p className="mt-3 font-maison-neue text-sm leading-relaxed text-Charcoal/70">
          {collection.ShortDescription}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={expand}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-Charcoal px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal hover:bg-Charcoal hover:text-white"
          >
            {isExpanded ? "Hide items" : "Preview items"}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <LocalizedClientLink
            href={`/collections/${collection.Slug}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[5px] bg-Gold px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal hover:opacity-95"
          >
            View details
          </LocalizedClientLink>
        </div>

        {isExpanded && (
          <div className="mt-5 border-t border-Charcoal/10 pt-5">
            {isLoading && (
              <div className="space-y-2" aria-live="polite">
                <div className="h-4 w-32 animate-pulse rounded bg-Charcoal/10" />
                <div className="h-16 animate-pulse rounded bg-Charcoal/10" />
                <div className="h-16 animate-pulse rounded bg-Charcoal/10" />
              </div>
            )}

            {error && (
              <p className="font-maison-neue text-sm leading-relaxed text-VibrantRed">
                {error}
              </p>
            )}

            {canShowDetails && (
              <>
                <div className="grid gap-3 border-b border-Charcoal/10 pb-4 sm:grid-cols-3">
                  <div>
                    <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
                      Estimated subtotal
                    </p>
                    <p className="mt-1 font-gyst text-h4 leading-none text-Charcoal">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
                      Eligible progress
                    </p>
                    <p className="mt-1 font-maison-neue text-sm font-semibold leading-tight text-Charcoal">
                      ${eligible.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
                      Excluded
                    </p>
                    <p className="mt-1 font-maison-neue text-sm font-semibold leading-tight text-Charcoal">
                      {excluded > 0 ? `$${excluded.toFixed(2)}` : "$0.00"}
                    </p>
                  </div>
                </div>

                <p className="mt-5 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
                  What is inside
                </p>
                <CuratedCollectionItems
                  collection={detailCollection}
                  countryCode={countryCode}
                  className="mt-3"
                  showDescriptions
                />

                <AddBundleButton
                  items={addItemsForCollection(detailCollection)}
                  countryCode={countryCode}
                  bundleId={detailCollection.documentId}
                  bundleTitle={detailCollection.Name}
                  bundleSlug={detailCollection.Slug}
                  disabledReason={disabledReason}
                  className="mt-5 space-y-2"
                  fullWidth
                />
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
