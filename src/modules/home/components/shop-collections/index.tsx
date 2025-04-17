"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"

const collections = [
  {
    id: "beef",
    name: "Beef",
    href: "/collections/beef",
    imageUrl: "https://placehold.co/530x552/png?text=Beef",
  },
  {
    id: "poultry",
    name: "Poultry",
    href: "/collections/poultry",
    imageUrl: "https://placehold.co/530x552/png?text=Poultry",
  },
  {
    id: "bakery",
    name: "Bakery",
    href: "/collections/bakery",
    imageUrl: "https://placehold.co/530x552/png?text=Bakery",
  },
  {
    id: "grocery",
    name: "Grocery",
    href: "/collections/grocery",
    imageUrl: "https://placehold.co/530x552/png?text=Grocery",
  },
]

export default function ShopCollectionsSection() {
  return (
    <section className="pt-14 md:pt-32 pb-8 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-h2-mobile md:text-h2 text-Charcoal">
            Shop Collections
          </h3>
          <a
            href="/collections"
            className="h-[44px] w-[44px] border border-black rounded-full flex items-center justify-center"
          >
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt="See all collections"
            />
          </a>
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
        >
          {collections.map((col) => (
            <SwiperSlide key={col.id} className="pb-4">
              <article className="block overflow-hidden">
                <a href={col.href}>
                  <figure className="relative w-full aspect-square bg-gray-50">
                    <Image
                      src={col.imageUrl}
                      alt={col.name}
                      fill
                      className="object-cover"
                    />
                  </figure>

                  <div className="py-8">
                    <h4
                      id={`collection-${col.id}-title`}
                      className="text-h4 font-bold text-Charcoal pb-6 border-b border-Charcoal"
                    >
                      {col.name}
                    </h4>
                    <div className="pt-4 inline-flex items-center gap-2">
                      <span className="text-p-sm-mono uppercase font-bold">
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
                </a>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
