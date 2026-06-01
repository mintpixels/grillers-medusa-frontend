"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"

export type ProductCardCarouselProps = {
  images: string[]
  alt: string
  sizes?: string
  initialAction?: "prev" | "next" | null
  hydrateOnView?: boolean
  priority?: boolean
}

type HydratedCarousel = React.ComponentType<ProductCardCarouselProps>

const PLACEHOLDER_IMAGE = "https://placehold.co/400x400"

// Keep the first product image in the initial client bundle, then import the
// Swiper carousel only when the card is close to the viewport or interacted with.
export default function ProductCardCarousel({
  images,
  alt,
  sizes,
  hydrateOnView = true,
  priority = false,
}: ProductCardCarouselProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [shouldHydrate, setShouldHydrate] = useState(false)
  const [initialAction, setInitialAction] =
    useState<ProductCardCarouselProps["initialAction"]>(null)
  const [HydratedCarousel, setHydratedCarousel] =
    useState<HydratedCarousel | null>(null)

  const total = images.length
  const primaryImage = images[0] || PLACEHOLDER_IMAGE

  const requestHydration = useCallback(() => {
    if (total > 1) {
      setShouldHydrate(true)
    }
  }, [total])

  useEffect(() => {
    if (!hydrateOnView || total <= 1 || shouldHydrate) return

    const root = rootRef.current
    if (!root || !("IntersectionObserver" in window)) {
      requestHydration()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          requestHydration()
          observer.disconnect()
        }
      },
      { rootMargin: "300px 0px" }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [hydrateOnView, requestHydration, shouldHydrate, total])

  useEffect(() => {
    if (!shouldHydrate || total <= 1 || HydratedCarousel) return

    let isMounted = true
    import("./swiper-carousel").then((module) => {
      if (isMounted) {
        setHydratedCarousel(() => module.default)
      }
    })

    return () => {
      isMounted = false
    }
  }, [HydratedCarousel, shouldHydrate, total])

  const stopAndHydrate = (
    event: React.MouseEvent<HTMLButtonElement>,
    action: "prev" | "next"
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setInitialAction(action)
    requestHydration()
  }

  if (total <= 1) {
    return (
      <div ref={rootRef} className="absolute inset-0">
        <Image
          src={primaryImage}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
        />
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      onPointerEnter={requestHydration}
      onFocusCapture={requestHydration}
      onTouchStart={requestHydration}
    >
      {HydratedCarousel ? (
        <HydratedCarousel
          images={images}
          alt={alt}
          sizes={sizes}
          initialAction={initialAction}
        />
      ) : (
        <>
          <Image
            src={primaryImage}
            alt={`${alt}, image 1 of ${total}`}
            fill
            className="object-cover"
            sizes={sizes}
            priority={priority}
          />

          <div
            className="absolute bottom-2 right-2 z-[2] flex space-x-1.5"
            role="group"
            aria-label="Gallery navigation"
          >
            <button
              type="button"
              onClick={(event) => stopAndHydrate(event, "prev")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-1"
              aria-label="Previous image"
            >
              <Image
                src="/images/icons/arrow-left.svg"
                width={20}
                height={12}
                alt=""
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={(event) => stopAndHydrate(event, "next")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-1"
              aria-label="Next image"
            >
              <Image
                src="/images/icons/arrow-right.svg"
                width={21}
                height={12}
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            className="absolute bottom-2 left-2 z-[2] rounded-full bg-black/60 px-2 py-0.5 font-maison-neue text-[11px] text-white"
            aria-hidden="true"
          >
            1 / {total}
          </div>
        </>
      )}
    </div>
  )
}
