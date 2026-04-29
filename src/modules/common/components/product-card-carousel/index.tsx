"use client"

import React, { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"

type ProductCardCarouselProps = {
  images: string[]
  alt: string
  sizes?: string
}

// Renders the visual contents of a product-card image area:
// - 0 images: placeholder
// - 1 image: single fill image
// - 2+ images: swiper with arrow buttons + counter
//
// The component does NOT wrap content in a link — the parent <figure>
// is expected to live inside an outer <LocalizedClientLink>. Arrow
// buttons stop propagation so they don't trigger the outer link.
export default function ProductCardCarousel({
  images,
  alt,
  sizes,
}: ProductCardCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const total = images.length

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.realIndex)
  }, [])

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePrev = (e: React.MouseEvent) => {
    stop(e)
    setHasInteracted(true)
    swiperRef.current?.slidePrev()
  }

  const handleNext = (e: React.MouseEvent) => {
    stop(e)
    setHasInteracted(true)
    swiperRef.current?.slideNext()
  }

  if (total === 0) {
    return (
      <Image
        src="https://placehold.co/400x400"
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
      />
    )
  }

  if (total === 1) {
    return (
      <Image
        src={images[0]}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
      />
    )
  }

  return (
    <>
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        className="absolute inset-0 h-full w-full"
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={handleSlideChange}
        onTouchStart={() => setHasInteracted(true)}
        loop
        a11y={{
          enabled: true,
          prevSlideMessage: "Previous image",
          nextSlideMessage: "Next image",
        }}
      >
        {images.map((url, index) => {
          const shouldRender = index === 0 || hasInteracted
          return (
            <SwiperSlide
              key={`${url}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}`}
              className="relative"
            >
              {shouldRender && (
                <Image
                  src={url}
                  alt={`${alt} — image ${index + 1} of ${total}`}
                  fill
                  className="object-cover"
                  sizes={sizes}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
            </SwiperSlide>
          )
        })}
      </Swiper>

      <div
        className="absolute bottom-2 right-2 flex space-x-1.5 z-[2]"
        role="group"
        aria-label="Gallery navigation"
      >
        <button
          type="button"
          onClick={handlePrev}
          className="h-7 w-7 bg-white/85 rounded-full flex items-center justify-center hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-1"
          aria-label="Previous image"
        >
          <Image
            src="/images/icons/arrow-left.svg"
            width={8}
            height={14}
            alt=""
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="h-7 w-7 bg-white/85 rounded-full flex items-center justify-center hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-1"
          aria-label="Next image"
        >
          <Image
            src="/images/icons/arrow-right.svg"
            width={8}
            height={14}
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[11px] font-maison-neue z-[2]"
        aria-hidden="true"
      >
        {currentIndex + 1} / {total}
      </div>
    </>
  )
}
