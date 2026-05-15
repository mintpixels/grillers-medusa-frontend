"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { CuratedCollection } from "@lib/data/strapi/curated-collections"

export default function ShopCollectionsSection({
  data,
  collections = [],
}: {
  data: {
    CollectionsTitle: string
    Collections: [
      {
        id: number
        Title: string
        Slug: string
        Image: {
          url: string
        }
      }
    ]
  }
  collections?: CuratedCollection[]
}) {
  const title = data?.CollectionsTitle || "Curated collections"
  const cards =
    collections.length > 0
      ? collections.map((collection) => {
          const firstProduct = collection.Items?.find((item) => item.Product)
            ?.Product
          return {
            id: collection.documentId,
            title: collection.Name,
            slug: `/collections/${collection.Slug}`,
            imageUrl:
              collection.HeroImage?.url || firstProduct?.FeaturedImage?.url || "",
            alt:
              collection.HeroImageAlt ||
              firstProduct?.Title ||
              collection.Name,
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
            <SwiperSlide key={col.id} className="pb-4">
              <article className="block overflow-hidden">
                <LocalizedClientLink href={col.slug}>
                  <figure className="relative w-full aspect-square bg-gray-50">
                    {col.imageUrl && (
                      <Image
                        src={col.imageUrl}
                        alt={col.alt}
                        fill
                        className="object-cover"
                      />
                    )}
                  </figure>

                  <div className="py-8">
                    {col.eyebrow && (
                      <p className="mb-2 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
                        {col.eyebrow}
                      </p>
                    )}
                    <h4
                      id={`collection-${col.id}-title`}
                      className="text-h4 font-gyst font-bold text-Charcoal pb-6 border-b border-Charcoal"
                    >
                      {col.title}
                    </h4>
                    {col.description && (
                      <p className="mt-4 line-clamp-2 font-maison-neue text-sm leading-relaxed text-Charcoal/65">
                        {col.description}
                      </p>
                    )}
                    <div className="pt-4 inline-flex items-center gap-2">
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
                    </div>
                  </div>
                </LocalizedClientLink>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
