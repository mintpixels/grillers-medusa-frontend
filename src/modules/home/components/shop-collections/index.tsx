"use client"

import { useRef } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { CuratedCollection } from "@lib/data/strapi/curated-collections"

type ShopCollectionCardData = {
  id: string | number
  title: string
  slug: string
  imageUrl: string
  alt: string
  description: string
  eyebrow?: string | null
}

function ShopCollectionCard({ card }: { card: ShopCollectionCardData }) {
  const articleRef = useRef<HTMLElement | null>(null)

  return (
    <article ref={articleRef} className="group flex h-full min-w-0 flex-col">
      <LocalizedClientLink href={card.slug} className="block">
        <figure className="relative aspect-square w-full overflow-hidden bg-gray-50">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt={card.alt}
              fill
              sizes="(min-width: 1024px) 31vw, (min-width: 520px) 46vw, 88vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )}
        </figure>
      </LocalizedClientLink>

      <div className="flex flex-1 flex-col py-8">
        <LocalizedClientLink href={card.slug} className="block flex-1">
          {card.eyebrow && (
            <p className="mb-2 min-h-[14px] font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
              {card.eyebrow}
            </p>
          )}
          <h4
            id={`collection-${card.id}-title`}
            className="min-h-[84px] border-b border-Charcoal pb-6 font-gyst text-h4 font-bold leading-tight text-Charcoal transition-colors group-hover:text-VibrantRed"
          >
            {card.title}
          </h4>
          {card.description && (
            <p className="mt-4 min-h-[88px] font-maison-neue text-sm leading-relaxed text-Charcoal/65 line-clamp-4 text-pretty">
              {card.description}
            </p>
          )}
        </LocalizedClientLink>

        <LocalizedClientLink
          href={card.slug}
          className="mt-auto inline-flex min-h-[44px] items-center gap-2 pt-5 font-rexton text-p-sm-mono font-bold uppercase text-Charcoal hover:text-VibrantRed"
        >
          Explore collection
          <Image
            src="/images/icons/arrow-right.svg"
            width={20}
            height={12}
            alt=""
            aria-hidden="true"
          />
        </LocalizedClientLink>
      </div>
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
  const swiperRef = useRef<SwiperType | null>(null)
  const title = data?.CollectionsTitle || "Curated collections"
  const cards: ShopCollectionCardData[] =
    collections.length > 0
      ? collections.map((collection) => {
          return {
            id: collection.documentId,
            title: collection.Name,
            slug: `/collections/${collection.Slug}`,
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
          imageUrl: collection.Image?.url || "",
          alt: collection.Title,
          description: "",
          eyebrow: "",
        }))

  if (!cards.length) return null

  return (
    <section className="pt-14 md:pt-32 pb-8 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 className="min-w-0 font-gyst text-h2-mobile text-Charcoal md:text-h2">
            {title}
          </h2>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="flex size-[44px] items-center justify-center rounded-full border border-Charcoal transition-colors hover:bg-Charcoal hover:text-white group"
              aria-label="Previous collections"
            >
              <Image
                src="/images/icons/arrow-right.svg"
                width={20}
                height={12}
                alt=""
                aria-hidden="true"
                className="rotate-180 transition-all group-hover:invert"
              />
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="flex size-[44px] items-center justify-center rounded-full border border-Charcoal transition-colors hover:bg-Charcoal hover:text-white group"
              aria-label="Next collections"
            >
              <Image
                src="/images/icons/arrow-right.svg"
                width={20}
                height={12}
                alt=""
                aria-hidden="true"
                className="transition-all group-hover:invert"
              />
            </button>
            <LocalizedClientLink
              href="/collections"
              className="hidden h-[44px] items-center px-5 font-rexton text-p-sm-mono font-bold uppercase text-Charcoal hover:text-Gold sm:inline-flex"
            >
              See all
            </LocalizedClientLink>
          </div>
        </div>

        <Swiper
          onSwiper={(s) => {
            swiperRef.current = s
          }}
          spaceBetween={28}
          slidesPerView={1.15}
          breakpoints={{
            520: { slidesPerView: 2.15 },
            900: { slidesPerView: 3.15 },
          }}
          className="swiper-visible"
        >
          {cards.map((col) => (
            <SwiperSlide key={col.id} className="!h-auto pb-4">
              <ShopCollectionCard card={col} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
