"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"

import type { ProductCardCarouselProps } from "."

export default function ProductCardSwiperCarousel({
  images,
  alt,
  sizes,
  initialAction,
  priority = false,
}: ProductCardCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(Boolean(initialAction))
  const [didApplyInitialAction, setDidApplyInitialAction] = useState(false)
  const total = images.length

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.realIndex)
  }, [])

  useEffect(() => {
    if (!initialAction || didApplyInitialAction || !swiperRef.current) return

    const frame = window.requestAnimationFrame(() => {
      if (initialAction === "prev") {
        swiperRef.current?.slidePrev()
      } else {
        swiperRef.current?.slideNext()
      }
      setDidApplyInitialAction(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [didApplyInitialAction, initialAction])

  const stop = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handlePrev = (event: React.MouseEvent) => {
    stop(event)
    setHasInteracted(true)
    swiperRef.current?.slidePrev()
  }

  const handleNext = (event: React.MouseEvent) => {
    stop(event)
    setHasInteracted(true)
    swiperRef.current?.slideNext()
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
                  alt={`${alt}, image ${index + 1} of ${total}`}
                  fill
                  className="object-cover"
                  sizes={sizes}
                  {...(priority && index === 0
                    ? { priority: true }
                    : { loading: index === 0 ? "eager" : "lazy" })}
                />
              )}
            </SwiperSlide>
          )
        })}
      </Swiper>

      <div
        className="absolute bottom-2 right-2 z-[2] flex space-x-1.5"
        role="group"
        aria-label="Gallery navigation"
      >
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-1"
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-1"
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
        className="absolute bottom-2 left-2 z-[2] rounded-full bg-black/60 px-2 py-0.5 font-maison-neue text-[11px] text-white"
        aria-hidden="true"
      >
        {currentIndex + 1} / {total}
      </div>
    </>
  )
}
