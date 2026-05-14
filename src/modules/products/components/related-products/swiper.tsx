"use client"

import React, { useRef } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"

import { ProductCard } from "@modules/collections/components/strapi-product-grid"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

type RelatedProductsSwiperProps = {
  products: StrapiCollectionProduct[]
  countryCode: string
}

export default function RelatedProductsSwiper({
  products,
  countryCode,
}: RelatedProductsSwiperProps) {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-p-sm-mono font-maison-neue-mono uppercase text-gray-600 mb-3 tracking-wider">
            Related products
          </h2>
          <p className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
            You might also like
          </p>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="size-[44px] border border-Charcoal rounded-full flex justify-center items-center hover:bg-Charcoal hover:text-white transition-colors group"
            aria-label="Previous products"
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
            onClick={() => swiperRef.current?.slideNext()}
            className="size-[44px] border border-Charcoal rounded-full flex justify-center items-center hover:bg-Charcoal hover:text-white transition-colors group"
            aria-label="Next products"
          >
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt=""
              className="group-hover:invert transition-all"
            />
          </button>
        </div>
      </div>

      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
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
