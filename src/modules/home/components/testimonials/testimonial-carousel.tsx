"use client"

import { useRef, useEffect } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import "swiper/css/pagination"

import TestimonialCard from "./testimonial-card"
import type { StrapiTestimonial } from "types/strapi"

type TestimonialCarouselProps = {
  testimonials: StrapiTestimonial[]
  title?: string
  subtitle?: string
  showRatings?: boolean
  autoRotate?: boolean
  autoRotateInterval?: number // in seconds
}

export default function TestimonialCarousel({
  testimonials,
  title,
  subtitle,
  showRatings = true,
  autoRotate = true,
  autoRotateInterval = 5,
}: TestimonialCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null)

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-20 bg-Scroll">
      <div className="content-container">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2 className="text-h3 md:text-h2 font-gyst text-Charcoal mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-p-md font-maison-neue text-Charcoal/70 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Carousel */}
        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            autoplay={
              autoRotate
                ? {
                    delay: autoRotateInterval * 1000,
                    disableOnInteraction: false,
                  }
                : false
            }
            pagination={{
              clickable: true,
              el: ".testimonial-pagination",
              bulletClass: "inline-block w-2 h-2 rounded-full bg-Pewter/30 mx-1 cursor-pointer transition-colors",
              bulletActiveClass: "!bg-Charcoal",
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
            className="!pb-12"
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.documentId} className="h-auto">
                <TestimonialCard
                  testimonial={testimonial}
                  showRating={showRatings}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom pagination */}
          <div className="testimonial-pagination flex justify-center mt-6" />

          {/* Navigation arrows */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden lg:flex w-10 h-10 items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            aria-label="Previous testimonial"
          >
            <svg className="w-5 h-5 text-Charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden lg:flex w-10 h-10 items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            aria-label="Next testimonial"
          >
            <svg className="w-5 h-5 text-Charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

