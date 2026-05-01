"use client"

import React, { useRef } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"

import { ProductCard } from "@modules/collections/components/strapi-product-grid"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

type Props = {
  title: string
  products: StrapiCollectionProduct[]
  countryCode: string
}

export default function BestsellersSwiper({
  title,
  products,
  countryCode,
}: Props) {
  const swiperRef = useRef<SwiperType | null>(null)

  if (!products?.length) {
    return null
  }

  return (
    <div className="content-container">
      <div className="flex justify-between items-end mb-12">
        <h2 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
          {title}
        </h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="size-[44px] border border-Charcoal rounded-full flex justify-center items-center hover:bg-Charcoal hover:text-white transition-colors group"
            aria-label="Previous bestsellers"
          >
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt=""
              className="rotate-180 group-hover:invert transition-all"
            />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="size-[44px] border border-Charcoal rounded-full flex justify-center items-center hover:bg-Charcoal hover:text-white transition-colors group"
            aria-label="Next bestsellers"
          >
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt=""
              className="group-hover:invert transition-all"
            />
          </button>
          <LocalizedClientLink
            href="/store"
            className="hidden sm:inline-flex h-[44px] px-5 items-center text-p-sm-mono font-rexton uppercase font-bold text-Charcoal hover:text-Gold"
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
        slidesPerView={1}
        breakpoints={{
          520: { slidesPerView: 2 },
          900: { slidesPerView: 3 },
        }}
        className="swiper-visible"
      >
        {products.map((product) => (
          <SwiperSlide key={product.documentId} className="pb-4">
            <ProductCard
              product={product}
              countryCode={countryCode}
              viewMode="grid"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
