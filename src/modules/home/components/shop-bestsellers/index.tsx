"use client"
import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import Image from "next/image"

export default function BestsellersSection({
  data,
}: {
  data: {
    BestsellersTitle: string
    Products: [
      {
        id: number
        Title: string
        Slug: string
        Price: number
        Image: {
          url: string
        }
        Description: string
      }
    ]
  }
}) {
  return (
    <section className="py-10 md:py-20 bg-Scroll overflow-hidden">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-h2-mobile md:text-h2 text-Charcoal">
            {data?.BestsellersTitle}
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

        <div className="">
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
            {data?.Products?.map((product) => (
              <SwiperSlide
                key={product.id}
                className="px-2 pb-4 outline-none md:min-w-[381px]"
                aria-labelledby={`product-${product.id}-title`}
              >
                <article>
                  <a href={product?.Slug ?? "#"} className="">
                    <figure className="relative w-full aspect-square bg-gray-50">
                      <Image
                        src={product?.Image?.url}
                        alt={product.Title}
                        fill
                        className="object-cover"
                      />
                    </figure>

                    <div className="py-8">
                      <h4
                        id={`product-${product.id}-title`}
                        className="text-h4 font-bold text-Charcoal pb-6 border-b border-Charcoal"
                      >
                        {product.Title}
                      </h4>
                      <p className="text-Charcoal py-7 border-b border-Charcoal">
                        <span className="text-h3">${product.Price}</span>{" "}
                        <span className="text-p-sm-mono uppercase ml-2">
                          per lb
                        </span>
                      </p>
                      <p className="text-p-sm text-black py-6">
                        {product.Description}
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
