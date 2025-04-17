"use client"
import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"

// Example data array
const bestsellers = [
  {
    id: 1,
    title: "Product Title",
    price: 6.08,
    description:
      "Etiam id nisl scelerisque, consequat enim eget, imperdiet urna. Aliquam varius velit.",
    imageUrl: "https://placehold.co/365x365/png",
  },
  {
    id: 2,
    title: "Product Title 2",
    price: 6.08,
    description:
      "Etiam id nisl scelerisque, consequat enim eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x365/png",
  },
  {
    id: 3,
    title: "Product Title 3",
    price: 6.08,
    description:
      "Etiam id nisl scelerisque, consequat enim eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x365/png",
  },
  {
    id: 4,
    title: "Product Title 4",
    price: 6.08,
    description:
      "Etiam id nisl scelerisque, consequat enim eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x365/png",
  },
  {
    id: 5,
    title: "Product Title 5",
    price: 6.08,
    description:
      "Etiam id nisl scelerisque, consequat enim eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x365/png",
  },
  {
    id: 6,
    title: "Product Title 6",
    price: 6.08,
    description:
      "Etiam id nisl scelerisque, consequat enim eget, imperdiet urna.",
    imageUrl: "https://placehold.co/365x365/png",
  },
]

export default function BestsellersSection() {
  return (
    <section className="py-10 md:py-20 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-h2-mobile md:text-h2 text-Charcoal">
            Shop Bestsellers
          </h3>
          <a
            href="#"
            className="size-[44px] border border-black rounded-full flex justify-center items-center"
          >
            <Image
              src={"/images/icons/arrow-right.svg"}
              width={20}
              height={12}
              alt="Shop Bestsellers"
            />
          </a>
        </div>

        <div className="-mx-2">
          <Swiper
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              480: {
                slidesPerView: 2,
              },
              768: {
                slidesPerView: 3,
              },
              1024: {
                slidesPerView: 4,
              },
            }}
            className="swiper-visible"
          >
            {bestsellers.map((product) => (
              <SwiperSlide
                key={product.id}
                className="px-2 pb-4 outline-none md:min-w-[381px]"
                aria-labelledby={`product-${product.id}-title`}
              >
                <article>
                  <a href="#" className="">
                    <figure className="relative w-full aspect-square bg-gray-50">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </figure>

                    <div className="py-8">
                      <h4
                        id={`product-${product.id}-title`}
                        className="text-h4 font-bold text-Charcoal pb-6 border-b border-Charcoal"
                      >
                        {product.title}
                      </h4>
                      <p className="text-Charcoal py-7 border-b border-Charcoal">
                        <span className="text-h3">
                          ${product.price.toFixed(2)}
                        </span>{" "}
                        <span className="text-p-sm-mono uppercase ml-2">
                          per lb
                        </span>
                      </p>
                      <p className="text-p-sm text-black py-6">
                        {product.description}
                      </p>
                      <p className="inline-flex gap-3">
                        <span className="text-Charcoal text-h6 font-bold uppercase">
                          View Details
                        </span>
                        <Image
                          src={"/images/icons/arrow-right.svg"}
                          width={20}
                          height={12}
                          alt="view details"
                        />
                      </p>
                    </div>
                  </a>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}
