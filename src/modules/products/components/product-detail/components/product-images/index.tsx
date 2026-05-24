"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import type { HttpTypes } from "@medusajs/types"

export type ProductImage = {
  url: string
}

export type ProductImagesAction = "prev" | "next"

export type ProductImagesSwiperProps = {
  product: HttpTypes.StoreProduct
  images: ProductImage[]
  initialAction?: ProductImagesAction | null
}

type HydratedGallery = React.ComponentType<ProductImagesSwiperProps>

const imageSizes =
  "(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) 50vw, 600px"

export default function ProductImages({
  product,
  images,
}: {
  product: HttpTypes.StoreProduct
  images: ProductImage[]
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [shouldHydrate, setShouldHydrate] = useState(false)
  const [HydratedGallery, setHydratedGallery] =
    useState<HydratedGallery | null>(null)
  const [initialAction, setInitialAction] =
    useState<ProductImagesAction | null>(null)
  const totalImages = images.length
  const primaryImage = images[0]

  const requestHydration = useCallback(() => {
    if (totalImages > 1) {
      setShouldHydrate(true)
    }
  }, [totalImages])

  useEffect(() => {
    if (totalImages <= 1 || shouldHydrate) return

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
      { rootMargin: "120px 0px" }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [requestHydration, shouldHydrate, totalImages])

  useEffect(() => {
    if (!shouldHydrate || totalImages <= 1 || HydratedGallery) return

    let isMounted = true
    import("./swiper-gallery").then((module) => {
      if (isMounted) {
        setHydratedGallery(() => module.default)
      }
    })

    return () => {
      isMounted = false
    }
  }, [HydratedGallery, shouldHydrate, totalImages])

  const hydrateWithAction = useCallback(
    (action: ProductImagesAction) => {
      setInitialAction(action)
      requestHydration()
    },
    [requestHydration]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        hydrateWithAction("prev")
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        hydrateWithAction("next")
      }
    },
    [hydrateWithAction]
  )

  if (totalImages === 0 || !primaryImage?.url) {
    return (
      <div className="flex h-96 w-full items-center justify-center border border-gray-300 bg-white md:h-[600px]">
        <span className="px-6 text-center font-maison-neue text-p-sm text-Charcoal/60">
          Product image coming soon
        </span>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="relative h-96 w-full md:h-[600px]"
      role="region"
      aria-label={`Product image gallery for ${product.title}`}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      onPointerEnter={requestHydration}
      onFocusCapture={requestHydration}
      onTouchStart={requestHydration}
    >
      {HydratedGallery ? (
        <HydratedGallery
          product={product}
          images={images}
          initialAction={initialAction}
        />
      ) : (
        <>
          <Image
            src={primaryImage.url}
            alt={`${product.title} - Image 1 of ${totalImages}`}
            fill
            priority
            className="object-cover border border-gray-300"
            sizes={imageSizes}
          />

          {totalImages > 1 && (
            <>
              <div
                className="absolute bottom-4 right-4 z-[1] flex space-x-2"
                role="group"
                aria-label="Gallery navigation"
              >
                <button
                  type="button"
                  onClick={() => hydrateWithAction("prev")}
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
                  onClick={() => hydrateWithAction("next")}
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
                1 / {totalImages}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
