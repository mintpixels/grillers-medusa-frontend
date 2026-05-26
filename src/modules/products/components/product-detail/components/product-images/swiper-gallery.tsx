"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Zoom } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import "swiper/css/zoom"

import type { ProductImagesSwiperProps } from "."

const imageSizes =
  "(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) 50vw, 600px"

export default function ProductImagesSwiperGallery({
  productTitle,
  images,
  initialAction,
}: ProductImagesSwiperProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [announcement, setAnnouncement] = useState("")
  const [didApplyInitialAction, setDidApplyInitialAction] = useState(false)
  const totalImages = images.length

  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const newIndex = swiper.realIndex
      setCurrentIndex(newIndex)
      setAnnouncement(`Image ${newIndex + 1} of ${totalImages}: ${productTitle}`)
    },
    [totalImages, productTitle]
  )

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

  const handlePrev = useCallback(() => {
    swiperRef.current?.slidePrev()
  }, [])

  const handleNext = useCallback(() => {
    swiperRef.current?.slideNext()
  }, [])

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <Swiper
        modules={[Zoom]}
        spaceBetween={24}
        slidesPerView={1}
        className="h-full"
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={handleSlideChange}
        loop={true}
        zoom={{
          maxRatio: 3,
          minRatio: 1,
        }}
        a11y={{
          enabled: true,
          prevSlideMessage: "Previous image",
          nextSlideMessage: "Next image",
          firstSlideMessage: "This is the first image",
          lastSlideMessage: "This is the last image",
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide
            key={`${image.url}-${index}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${totalImages}`}
          >
            <div className="swiper-zoom-container relative h-full w-full">
              <Image
                src={image.url}
                alt={`${productTitle} - Image ${index + 1} of ${totalImages}`}
                fill
                className="object-cover border border-gray-300"
                data-swiper-zoom="3"
                sizes={imageSizes}
                {...(index === 0
                  ? { priority: true }
                  : { loading: "lazy" as const })}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="absolute bottom-4 right-4 z-[1] flex space-x-2"
        role="group"
        aria-label="Gallery navigation"
      >
        <button
          type="button"
          onClick={handlePrev}
          className="h-11 w-11 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2"
          aria-label="Previous image"
        >
          <Image
            src="/images/icons/arrow-left.svg"
            width={12}
            height={20}
            alt=""
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="h-11 w-11 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2"
          aria-label="Next image"
        >
          <Image
            src="/images/icons/arrow-right.svg"
            width={12}
            height={20}
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className="absolute bottom-4 left-4 z-[1] rounded-full bg-black/60 px-3 py-1 font-maison-neue text-sm text-white"
        aria-hidden="true"
      >
        {currentIndex + 1} / {totalImages}
      </div>
    </>
  )
}
