"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function ShopCollectionsSection({
  data,
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
}) {
  return (
    <section className="pt-14 md:pt-32 pb-8 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-h2-mobile font-gyst md:text-h2 text-Charcoal">
            {data?.CollectionsTitle}
          </h3>
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
          slidesPerView={1}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 3 },
          }}
          className="swiper-visible"
        >
          {data?.Collections?.map((col) => (
            <SwiperSlide key={col.id} className="pb-4">
              <article className="block overflow-hidden">
                <LocalizedClientLink href={col.Slug}>
                  <figure className="relative w-full aspect-square bg-gray-50">
                    {col?.Image?.url && (
                      <Image
                        src={col.Image.url}
                        alt={col.Title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </figure>

                  <div className="py-8">
                    <h4
                      id={`collection-${col.id}-title`}
                      className="text-h4 font-gyst font-bold text-Charcoal pb-6 border-b border-Charcoal"
                    >
                      {col?.Title}
                    </h4>
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
