"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Example “recipes” data
const recipes = [
  {
    id: 1,
    title: "Recipe Title",
    description:
      "Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x552/png",
  },
  {
    id: 2,
    title: "Recipe Title",
    description:
      "Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x552/png",
  },
  {
    id: 3,
    title: "Recipe Title",
    description:
      "Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x552/png",
  },
  {
    id: 4,
    title: "Recipe Title",
    description:
      "Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x552/png",
  },
  {
    id: 5,
    title: "Recipe Title",
    description:
      "Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x552/png",
  },
  {
    id: 6,
    title: "Recipe Title",
    description:
      "Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x552/png",
  },
]

export default function HowItFitsSection() {
  return (
    <section className="py-16 md:py-32 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        {/* Header */}
        <div className="flex justify-between items-center mb-20">
          <div className="hidden md:block size-[44px]" />
          <div className="md:text-center w-[calc(100%-60px)] md:w-auto">
            <h3 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal mb-4 md:mb-8">
              How It Fits On Your Table
            </h3>
            <p className="text-p-md font-maison-neue text-Charcoal max-w-[571px] k">
              Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.
              Aliquam erat volutpat. Aliquam sed nisl at sem molestie
              condimentum.
            </p>
          </div>

          <LocalizedClientLink
            href="#"
            className="h-[44px] w-[44px] border border-Charcoal rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt="See more"
            />
          </LocalizedClientLink>
        </div>

        {/* Slider */}
        <div className="-mx-2">
          <Swiper
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              480: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            className="swiper-visible"
          >
            {recipes.map((recipe) => (
              <SwiperSlide
                key={recipe.id}
                className="pb-4 outline-none"
                aria-labelledby={`recipe-${recipe.id}-title`}
              >
                <article className="">
                  <figure className="relative w-full aspect-square bg-gray-50 h-[552px]">
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                    />
                  </figure>

                  <div className="pt-8">
                    <h4
                      id={`recipe-${recipe.id}-title`}
                      className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal mb-4"
                    >
                      {recipe.title}
                    </h4>
                    <p className="text-p-sm font-maison-neue text-Charcoal pb-4 border-b border-Charcoal">
                      {recipe.description}
                    </p>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}
