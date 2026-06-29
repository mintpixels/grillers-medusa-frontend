"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { CuratedCollection } from "@lib/data/strapi/curated-collections"
import {
  collectionEstimatedSubtotals,
  type ResolvedCuratedCollectionItem,
} from "@lib/util/collection-substitutions"

type ShopCollectionCardData = {
  id: string | number
  title: string
  slug: string
  imageUrl: string
  alt: string
  description: string
  eyebrow?: string | null
  estimatedSubtotal?: number | null
  itemCount?: number | null
  targetLabel?: string | null
}

function resolvedCollectionItems(
  collection: CuratedCollection
): ResolvedCuratedCollectionItem[] {
  return (collection.Items || []).filter(
    (item): item is ResolvedCuratedCollectionItem =>
      Boolean(item.Product?.MedusaProduct?.Handle)
  )
}

function collectionTargetLabel(collection: CuratedCollection) {
  if (collection.TargetMinWeightLb && collection.TargetMaxWeightLb) {
    return `${collection.TargetMinWeightLb}-${collection.TargetMaxWeightLb} lb target`
  }

  if (collection.TargetPriceCents) {
    return `$${Math.round(collection.TargetPriceCents / 100)} target`
  }

  return null
}

function cardFromCuratedCollection(
  collection: CuratedCollection
): ShopCollectionCardData {
  const items = resolvedCollectionItems(collection)
  const { total } = collectionEstimatedSubtotals(items)

  return {
    id: collection.documentId,
    title: collection.Name,
    slug: `/collections/${collection.Slug}`,
    imageUrl: collection.HeroImage?.url || "",
    alt: collection.HeroImageAlt || collection.Name,
    description: collection.ShortDescription,
    eyebrow: collection.Eyebrow,
    estimatedSubtotal: total > 0 ? total : null,
    itemCount: items.reduce((sum, item) => sum + (item.Quantity || 1), 0),
    targetLabel: collectionTargetLabel(collection),
  }
}

function FeaturedCollectionCard({ card }: { card: ShopCollectionCardData }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[5px] border border-Charcoal/10 bg-white xl:grid xl:min-h-[388px] xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
      <LocalizedClientLink href={card.slug} className="block xl:h-full">
        <figure className="relative aspect-[16/10] w-full overflow-hidden bg-gray-50 xl:h-full xl:aspect-auto">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt={card.alt}
              fill
              sizes="(min-width: 1280px) 34vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )}
        </figure>
      </LocalizedClientLink>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        {card.eyebrow && (
          <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
            {card.eyebrow}
          </p>
        )}

        <LocalizedClientLink
          href={card.slug}
          className="mt-2 inline-flex min-h-[44px] items-center"
        >
          <h3 className="max-w-[16ch] font-gyst text-h3-mobile font-bold leading-tight text-Charcoal transition-colors group-hover:text-VibrantRed md:text-h3">
            {card.title}
          </h3>
        </LocalizedClientLink>

        {card.description && (
          <p className="mt-4 max-w-xl font-maison-neue text-sm leading-relaxed text-Charcoal/65 md:text-p-md">
            {card.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {card.estimatedSubtotal && (
            <span className="rounded-full bg-Scroll px-3 py-1 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/60">
              ${card.estimatedSubtotal.toFixed(2)} estimated
            </span>
          )}
          {card.itemCount != null && card.itemCount > 0 && (
            <span className="rounded-full bg-Scroll px-3 py-1 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/60">
              {card.itemCount} items
            </span>
          )}
          {card.targetLabel && (
            <span className="rounded-full bg-Scroll px-3 py-1 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/60">
              {card.targetLabel}
            </span>
          )}
        </div>

        <LocalizedClientLink
          href={card.slug}
          className="mt-6 inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-[5px] bg-Gold px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal transition-opacity hover:opacity-95"
        >
          View collection
          <Image
            src="/images/icons/arrow-right.svg"
            width={21}
            height={12}
            alt=""
            aria-hidden="true"
          />
        </LocalizedClientLink>
      </div>
    </article>
  )
}

function SupportingCollectionCard({ card }: { card: ShopCollectionCardData }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-[5px] border border-Charcoal/10 bg-white">
      <LocalizedClientLink
        href={card.slug}
        className="grid min-h-[132px] grid-cols-[112px_minmax(0,1fr)]"
      >
        <span className="relative block min-h-full overflow-hidden bg-gray-50">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt={card.alt}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )}
        </span>
        <span className="flex min-w-0 flex-col p-4">
          {card.eyebrow && (
            <span className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-VibrantRed">
              {card.eyebrow}
            </span>
          )}
          <span className="mt-1 line-clamp-2 font-gyst text-[20px] font-bold leading-tight text-Charcoal transition-colors group-hover:text-VibrantRed">
            {card.title}
          </span>
          {card.description && (
            <span className="mt-2 line-clamp-2 font-maison-neue text-xs leading-snug text-Charcoal/60">
              {card.description}
            </span>
          )}
          <span className="mt-auto pt-3 font-rexton text-[10px] font-bold uppercase tracking-wide text-Charcoal group-hover:text-VibrantRed">
            View collection
          </span>
        </span>
      </LocalizedClientLink>
    </article>
  )
}

function StaticCollectionCard({ card }: { card: ShopCollectionCardData }) {
  return (
    <article className="group min-w-0">
      <LocalizedClientLink href={card.slug} className="block">
        <figure className="relative aspect-[4/3] overflow-hidden rounded-[5px] bg-gray-50">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt={card.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 520px) 46vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )}
        </figure>
        <span className="mt-3 block font-gyst text-h4 font-bold text-Charcoal transition-colors group-hover:text-VibrantRed">
          {card.title}
        </span>
      </LocalizedClientLink>
    </article>
  )
}

export default function ShopCollectionsSection({
  data,
  collections = [],
}: {
  countryCode: string
  data: {
    CollectionsTitle: string
    Collections: Array<{
      id: number
      Title: string
      Slug: string
      Image: {
        url: string
      }
    }>
  }
  collections?: CuratedCollection[]
}) {
  const title = data?.CollectionsTitle || "Curated collections"
  const cards: ShopCollectionCardData[] =
    collections.length > 0
      ? collections.map(cardFromCuratedCollection)
      : (data?.Collections || []).map((collection) => ({
          id: collection.id,
          title: collection.Title,
          slug: collection.Slug,
          imageUrl: collection.Image?.url || "",
          alt: collection.Title,
          description: "",
          eyebrow: "",
        }))

  if (!cards.length) return null

  const curatedFeaturedIndex = collections.findIndex((collection) => {
    const title = collection.Name.toLowerCase()
    const slug = collection.Slug.toLowerCase()
    return title.includes("welcome pack") || slug.includes("welcome-pack")
  })
  const featuredIndex =
    curatedFeaturedIndex >= 0
      ? curatedFeaturedIndex
      : collections.findIndex((collection) => collection.IsFeatured)
  const featuredCard = cards[featuredIndex >= 0 ? featuredIndex : 0]
  const supportingCards = cards
    .filter((card) => card.id !== featuredCard.id)
    .slice(0, 4)
  const hasCuratedCollections = collections.length > 0

  return (
    <section className="overflow-hidden bg-Scroll py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="min-w-0 font-gyst text-h2-mobile text-Charcoal md:text-h3">
            {title}
          </h2>

          <LocalizedClientLink
            href="/collections"
            className="hidden h-[44px] shrink-0 items-center gap-2 font-rexton text-p-sm-mono font-bold uppercase text-Charcoal hover:text-VibrantRed sm:inline-flex"
          >
            See all
            <Image
              src="/images/icons/arrow-right.svg"
              width={21}
              height={12}
              alt=""
              aria-hidden="true"
            />
          </LocalizedClientLink>
        </div>

        {hasCuratedCollections ? (
          <div
            className={
              supportingCards.length
                ? "grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:items-start"
                : "max-w-3xl"
            }
          >
            <FeaturedCollectionCard card={featuredCard} />

            {supportingCards.length > 0 && (
              <div className="grid self-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {supportingCards.map((card) => (
                  <SupportingCollectionCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.slice(0, 4).map((card) => (
              <StaticCollectionCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
