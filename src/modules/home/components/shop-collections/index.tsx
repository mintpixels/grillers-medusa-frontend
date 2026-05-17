"use client"

import { useEffect, useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddBundleButton from "@modules/products/components/pairs-well-with/add-bundle-button"
import CuratedCollectionItems, {
  getResolvedCollectionItems,
} from "@modules/collections/components/curated-collection-items"
import type { CuratedCollection } from "@lib/data/strapi/curated-collections"
import {
  collectionEstimatedSubtotals,
  getCollectionSubstitutionGuardrails,
  lineCartMetadata,
} from "@lib/util/collection-substitutions"

type ShopCollectionCardData = {
  id: string | number
  title: string
  slug: string
  collection: CuratedCollection | null
  imageUrl: string
  alt: string
  description: string
  eyebrow?: string | null
}

function addItemsForCollection(collection: CuratedCollection) {
  return getResolvedCollectionItems(collection)
    .map((item) => {
      const variant = item.Product.MedusaProduct?.Variants?.[0]
      return {
        variantId: variant?.VariantId || "",
        title: item.Product.Title,
        quantity: item.Quantity || 1,
        metadata: lineCartMetadata(item),
      }
    })
    .filter((item) => item.variantId)
}

function ShopCollectionCard({
  card,
  countryCode,
}: {
  card: ShopCollectionCardData
  countryCode: string
}) {
  const articleRef = useRef<HTMLElement | null>(null)
  const [detail, setDetail] = useState<CuratedCollection | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(card.collection))
  const [error, setError] = useState<string | null>(null)

  const loadDetail = async () => {
    if (!card.collection || detail || error) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/curated-collections/${encodeURIComponent(card.collection.Slug)}?countryCode=${countryCode}`
      )
      if (!response.ok) {
        throw new Error(`Failed to load ${card.collection.Slug}`)
      }
      const data = (await response.json()) as {
        collection: CuratedCollection | null
      }
      if (!data.collection) {
        throw new Error(`Missing collection ${card.collection.Slug}`)
      }
      setDetail(data.collection)
    } catch (err) {
      console.error(err)
      setError("Items are taking too long to load.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!card.collection || detail || error) return
    const node = articleRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          loadDetail()
        }
      },
      { rootMargin: "600px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.collection, detail, error])

  const products = detail ? getResolvedCollectionItems(detail) : []
  const { total } = collectionEstimatedSubtotals(products)
  const guardrails = detail ? getCollectionSubstitutionGuardrails(products) : null
  const disabledReason = guardrails?.needsBusinessReview
    ? "Needs substitution review before purchase."
    : guardrails?.requiresAcknowledgement
    ? "Review substitution details first."
    : undefined

  return (
    <article ref={articleRef} className="flex h-full min-w-0 flex-col">
      <LocalizedClientLink href={card.slug}>
        <figure className="relative w-full aspect-square bg-gray-50">
          {card.imageUrl && (
            <Image src={card.imageUrl} alt={card.alt} fill className="object-cover" />
          )}
        </figure>
      </LocalizedClientLink>

      <div className="flex flex-1 flex-col py-8">
        <LocalizedClientLink href={card.slug} className="block">
          {card.eyebrow && (
            <p className="mb-2 min-h-[14px] font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
              {card.eyebrow}
            </p>
          )}
          <h4
            id={`collection-${card.id}-title`}
            className="min-h-[72px] border-b border-Charcoal pb-6 font-gyst text-h4 font-bold leading-tight text-Charcoal"
          >
            {card.title}
          </h4>
          {card.description && (
            <p className="mt-4 min-h-[66px] font-maison-neue text-sm leading-relaxed text-Charcoal/65 text-pretty">
              {card.description}
            </p>
          )}
        </LocalizedClientLink>

        {card.collection ? (
          <div className="mt-5 flex flex-1 flex-col border-t border-Charcoal/15 pt-4">
            {isLoading && !detail && (
              <div className="min-h-[344px] space-y-2" aria-live="polite">
                <div className="h-4 w-32 animate-pulse rounded bg-Charcoal/10" />
                <div className="h-12 animate-pulse rounded bg-Charcoal/10" />
                <div className="h-12 animate-pulse rounded bg-Charcoal/10" />
                <div className="h-12 animate-pulse rounded bg-Charcoal/10" />
              </div>
            )}

            {error && !detail && (
              <div>
                <p className="font-maison-neue text-sm leading-relaxed text-VibrantRed">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={loadDetail}
                  className="mt-3 inline-flex min-h-[40px] items-center rounded-[5px] border border-Charcoal px-4 font-rexton text-[11px] font-bold uppercase tracking-wide text-Charcoal"
                >
                  Try again
                </button>
              </div>
            )}

            {detail && products.length > 0 && (
              <>
                <div className="mb-3 grid min-h-[42px] grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div>
                    <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/55">
                      Collection subtotal
                    </p>
                    <p className="mt-1 font-maison-neue text-sm font-semibold text-Charcoal">
                      ${total.toFixed(2)} estimated
                    </p>
                  </div>
                  <LocalizedClientLink
                    href={card.slug}
                    className="mt-[19px] inline-flex min-h-[16px] items-center gap-2 font-rexton text-[11px] font-bold uppercase leading-none tracking-wide text-Charcoal hover:text-VibrantRed"
                  >
                    View items
                    <Image
                      src="/images/icons/arrow-right.svg"
                      width={16}
                      height={10}
                      alt=""
                      aria-hidden="true"
                    />
                  </LocalizedClientLink>
                </div>

                <CuratedCollectionItems
                  collection={detail}
                  countryCode={countryCode}
                  className="mt-4 min-h-[292px]"
                  compactRows
                />

                <AddBundleButton
                  items={addItemsForCollection(detail)}
                  countryCode={countryCode}
                  bundleId={detail.documentId}
                  bundleTitle={detail.Name}
                  bundleSlug={detail.Slug}
                  disabledReason={disabledReason}
                  className="mt-4 space-y-2"
                  fullWidth
                />
              </>
            )}
          </div>
        ) : (
          <LocalizedClientLink href={card.slug} className="pt-4 inline-flex items-center gap-2">
            <span className="text-p-sm-mono font-rexton uppercase font-bold">
              Explore
            </span>
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt=""
              aria-hidden="true"
            />
          </LocalizedClientLink>
        )}
      </div>
    </article>
  )
}

export default function ShopCollectionsSection({
  data,
  countryCode,
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
      ? collections.map((collection) => {
          return {
            id: collection.documentId,
            title: collection.Name,
            slug: `/collections/${collection.Slug}`,
            collection,
            imageUrl: collection.HeroImage?.url || "",
            alt: collection.HeroImageAlt || collection.Name,
            description: collection.ShortDescription,
            eyebrow: collection.Eyebrow,
          }
        })
      : (data?.Collections || []).map((collection) => ({
          id: collection.id,
          title: collection.Title,
          slug: collection.Slug,
          collection: null,
          imageUrl: collection.Image?.url || "",
          alt: collection.Title,
          description: "",
          eyebrow: "",
        }))

  if (!cards.length) return null

  return (
    <section className="pt-14 md:pt-32 pb-8 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-h2-mobile font-gyst md:text-h2 text-Charcoal">
            {title}
          </h2>
          <LocalizedClientLink
            href="/collections"
            className="h-[44px] w-[44px] border border-black rounded-full flex items-center justify-center"
          >
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt="See all collections"
            />
          </LocalizedClientLink>
        </div>

        {/* Slider */}
        <Swiper
          spaceBetween={24}
          // Match Shop Bestsellers: the next card peeks on mobile so the
          // row advertises horizontal swiping.
          slidesPerView={1.15}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 3 },
          }}
          className="swiper-visible"
        >
          {cards.map((col) => (
            <SwiperSlide key={col.id} className="!h-auto pb-4">
              <ShopCollectionCard card={col} countryCode={countryCode} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
