"use client"

import React from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "@medusajs/ui"

import { addToCart } from "@lib/data/cart"
import { dispatchCartUpdated } from "@lib/util/cart-events"
import {
  lineCartMetadata,
  lineEstimatedTotal,
  productPriceDisplay,
} from "@lib/util/collection-substitutions"
import { sanitizeProductCopy } from "@lib/util/product-claims"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type {
  CuratedCollection,
  CuratedCollectionItem,
} from "@lib/data/strapi/curated-collections"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

type ResolvedCollectionItem = CuratedCollectionItem & {
  Product: StrapiCollectionProduct
}

type CuratedCollectionItemsProps = {
  collection: CuratedCollection
  countryCode: string
  previewCount?: number
  showDescriptions?: boolean
  showImages?: boolean
  showItemAdd?: boolean
  compactRows?: boolean
  className?: string
}

export function getResolvedCollectionItems(
  collection: CuratedCollection
): ResolvedCollectionItem[] {
  return (collection.Items || []).filter(
    (item): item is ResolvedCollectionItem =>
      Boolean(item.Product?.MedusaProduct?.Handle)
  )
}

export default function CuratedCollectionItems({
  collection,
  countryCode,
  previewCount = 3,
  showDescriptions = false,
  showImages = false,
  showItemAdd = true,
  compactRows = false,
  className = "",
}: CuratedCollectionItemsProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const items = getResolvedCollectionItems(collection)
  const visibleItems = isExpanded ? items : items.slice(0, previewCount)
  const hiddenCount = Math.max(items.length - previewCount, 0)
  const listId = `collection-${collection.documentId || collection.Slug}-items`

  if (!items.length) return null

  return (
    <div className={className}>
      <ul
        id={listId}
        className="space-y-2"
        aria-label={`${collection.Name} items`}
      >
        {visibleItems.map((item) => (
          <CollectionItemRow
            key={`${collection.documentId}-${item.Product.documentId}`}
            item={item}
            collection={collection}
            countryCode={countryCode}
            showDescriptions={showDescriptions}
            showImages={showImages}
            showItemAdd={showItemAdd}
            compactRows={compactRows}
          />
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={listId}
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-3 flex min-h-[42px] w-full items-center justify-between rounded-[5px] border border-Charcoal/15 bg-white px-3 font-maison-neue text-xs font-semibold text-Charcoal transition-colors hover:border-Charcoal"
        >
          <span>
            {isExpanded
              ? "Show fewer items"
              : `Show ${hiddenCount} more ${
                  hiddenCount === 1 ? "item" : "items"
                }`}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
}

function CollectionItemRow({
  item,
  collection,
  countryCode,
  showDescriptions,
  showImages,
  showItemAdd,
  compactRows,
}: {
  item: ResolvedCollectionItem
  collection: CuratedCollection
  countryCode: string
  showDescriptions: boolean
  showImages: boolean
  showItemAdd: boolean
  compactRows: boolean
}) {
  const imageUrl = item.Product.FeaturedImage?.url
  const price = productPriceDisplay(item.Product)
  const lineTotal = lineEstimatedTotal(item.Product, item.Quantity || 1)
  const description = showDescriptions
    ? sanitizeProductCopy(item.Product.MedusaProduct?.ShortDescription, {
        handle: item.Product.MedusaProduct?.Handle,
        title: item.Product.Title,
      })
    : null

  return (
    <li
      className={`min-w-0 border-t border-Charcoal/10 pt-2 ${
        compactRows ? "min-h-[86px]" : ""
      } ${
        showImages ? "grid grid-cols-[72px_minmax(0,1fr)] gap-3" : ""
      }`}
    >
      {showImages && (
        <LocalizedClientLink
          href={`/products/${item.Product.MedusaProduct?.Handle}`}
          className="relative aspect-square overflow-hidden rounded-[5px] bg-gray-100"
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={item.Product.Title}
              fill
              sizes="72px"
              className="object-cover"
            />
          )}
        </LocalizedClientLink>
      )}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <LocalizedClientLink
          href={`/products/${item.Product.MedusaProduct?.Handle}`}
          className="min-w-0"
        >
          <span
            className={`font-maison-neue text-xs font-semibold leading-snug text-Charcoal hover:text-VibrantRed ${
              compactRows ? "line-clamp-2 min-h-[32px]" : ""
            }`}
          >
            {item.Quantity > 1 ? `${item.Quantity}x ` : ""}
            {item.Product.Title}
          </span>
          {price ? (
            <span className="mt-1 block space-y-0.5">
              <span className="block font-maison-neue-mono text-[10px] font-bold uppercase leading-tight tracking-wide text-Charcoal/55">
                {price.primary}
                {price.primaryLabel && ` ${price.primaryLabel}`}
              </span>
              {price.secondary && (
                <span
                  className={`block font-maison-neue text-[11px] leading-snug text-Charcoal/50 ${
                    compactRows ? "line-clamp-1" : ""
                  }`}
                >
                  {price.secondary}
                </span>
              )}
              {item.Quantity > 1 && lineTotal > 0 && (
                <span className="block font-maison-neue text-[11px] leading-snug text-Charcoal/50">
                  Line est. ${lineTotal.toFixed(2)}
                </span>
              )}
            </span>
          ) : (
            <span className="mt-1 block font-maison-neue-mono text-[10px] uppercase tracking-wide text-Charcoal/45">
              See price
            </span>
          )}
          {item.Required === false && (
            <span className="mt-1 inline-flex rounded-full bg-Scroll px-2 py-0.5 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/55">
              Optional
            </span>
          )}
          {description && (
            <span className="mt-1 line-clamp-2 block font-maison-neue text-xs leading-snug text-Charcoal/45">
              {description}
            </span>
          )}
          {item.Role && showDescriptions && (
            <span className="mt-1 block font-maison-neue text-xs leading-snug text-Charcoal/55">
              {item.Role}
            </span>
          )}
        </LocalizedClientLink>
        {showItemAdd && (
          <CollectionItemAddButton
            item={item}
            collection={collection}
            countryCode={countryCode}
          />
        )}
      </div>
    </li>
  )
}

function CollectionItemAddButton({
  item,
  collection,
  countryCode,
}: {
  item: ResolvedCollectionItem
  collection: CuratedCollection
  countryCode: string
}) {
  const [isAdding, setIsAdding] = React.useState(false)
  const variant = item.Product.MedusaProduct?.Variants?.[0]
  const quantity = item.Quantity || 1

  const onAdd = async () => {
    if (!variant?.VariantId) return
    setIsAdding(true)
    try {
      await addToCart({
        variantId: variant.VariantId,
        quantity,
        countryCode,
        metadata: {
          ...lineCartMetadata(item),
          source_collection_id: collection.documentId,
          source_collection_title: collection.Name,
          source_collection_slug: collection.Slug,
        },
      })
      dispatchCartUpdated({
        action: "add",
        variantId: variant.VariantId,
        quantity,
      })
      toast.success("Added to cart", {
        description: item.Product.Title,
      })
    } catch (error) {
      console.error("Failed to add collection item:", error)
      toast.error("Couldn't add item", {
        description: "Please try again in a moment.",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={isAdding || !variant?.VariantId}
      className="inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-full border border-Charcoal px-3 font-rexton text-[10px] font-bold uppercase tracking-wide text-Charcoal transition-colors hover:bg-Charcoal hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isAdding ? "Adding" : quantity > 1 ? `Add ${quantity}x` : "Add"}
    </button>
  )
}
