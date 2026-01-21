import React, { useRef, useState, useCallback } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import { HttpTypes } from "@medusajs/types"

import ProductActions from "./product-actions"
import ProductPrice from "./product-price"
import ProductVariantPicker from "./product-variant-picker"
import Breadcrumb, { buildProductBreadcrumbs } from "@modules/common/components/breadcrumb"
import SocialShare from "@modules/common/components/social-share"

import type { StrapiProductData } from "types/strapi"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiProductData: StrapiProductData
  selectedVariant?: HttpTypes.StoreProductVariant
  options: Record<string, string>
  setOptionValue: (optionId: string, value: string) => void
  inStock?: boolean
  isAdding?: boolean
  isValidVariant?: boolean
  quantity: number
  increment: () => void
  decrement: () => void
  handleAddToCart: () => void
}

const ProductImages = ({
  product,
  images,
}: {
  product: HttpTypes.StoreProduct
  images: any[]
}) => {
  const swiperRef = useRef<SwiperType | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [announcement, setAnnouncement] = useState("")
  const totalImages = images.length

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    const newIndex = swiper.realIndex
    setCurrentIndex(newIndex)
    setAnnouncement(`Image ${newIndex + 1} of ${totalImages}: ${product.title}`)
  }, [totalImages, product.title])

  const handlePrev = useCallback(() => {
    swiperRef.current?.slidePrev()
  }, [])

  const handleNext = useCallback(() => {
    swiperRef.current?.slideNext()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      handlePrev()
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      handleNext()
    }
  }, [handlePrev, handleNext])

  return (
    <div
      className="relative md:absolute md:w-[50vw] md:left-0 h-96 md:h-[calc(100%-98px)]"
      role="region"
      aria-label={`Product image gallery for ${product.title}`}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
    >
      {/* Screen reader announcements for image changes */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <Swiper
        spaceBetween={24}
        slidesPerView={1}
        className="h-full"
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={handleSlideChange}
        loop={true}
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
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${totalImages}`}
          >
            <Image
              src={image.url}
              alt={`${product.title} - Image ${index + 1} of ${totalImages}`}
              fill
              className="object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Slider nav with enhanced accessibility */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-[1]" role="group" aria-label="Gallery navigation">
        <button
          onClick={handlePrev}
          className="h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2"
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
          onClick={handleNext}
          className="h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2"
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

      {/* Image counter for visual users */}
      <div
        className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-maison-neue z-[1]"
        aria-hidden="true"
      >
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  )
}

export default function ProductDetail({
  product,
  region,
  countryCode,
  strapiProductData,
  selectedVariant,
  options,
  setOptionValue,
  quantity,
  increment,
  decrement,
  inStock,
  isAdding,
  isValidVariant,
  handleAddToCart,
}: ProductTemplateProps) {
  const mockedProduct = {
    tag: "Kosher for Passover",
    title: "Kosher Organic Chicken Breasts",
    pricePerLb: 6.08,
    avgPackPrice: 6.69,
    avgPackWeight: 1.1,
    inStock: true,
    serves: "5–8",
    uncooked: true,
    piecesPerPack: 8,
    description:
      "Indulge in the richness of our Organic, Kosher Chicken Breasts, perfect for an unforgettable Shabbat dinner or Jewish festivities. Expertly pack weighing approximately 1.1 lb, each chicken breast is kosher, uncooked, and ready to be transformed into a mouth‑watering dish. Taste the kosher goodness of our premium chicken breasts now!",
    details: [
      { icon: "/images/icons/gluten-free.svg", label: "Gluten Free" },
      { icon: "/images/icons/lorem-ipsum.svg", label: "Lorem Ipsum" },
    ],
    certifications: [
      { icon: "/images/icons/dolor.svg", label: "Dolor" },
      { icon: "/images/icons/consectitur.svg", label: "Consectitur" },
    ],
    imageUrl: "https://placehold.co/750x750/png",
  }

  const images = [
    strapiProductData?.FeaturedImage,
    ...(strapiProductData?.GalleryImages || []),
  ].filter((image) => image?.url)

  // Build breadcrumb items
  const breadcrumbItems = buildProductBreadcrumbs(product.collection, countryCode)

  return (
    <section className="py-8 md:pt-8 md:pb-16 bg-Scroll relative">
      {/* Breadcrumb Navigation */}
      <div className="mx-auto max-w-7xl px-4.5">
        <Breadcrumb
          items={breadcrumbItems}
          currentPage={product.title || "Product"}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4.5 grid grid-cols-1 md:grid-cols-2 gap-8 ">
        {/* Left: product image + nav buttons */}
        <div>
          <ProductImages product={product} images={images} />
        </div>

        {/* Right: product info */}
        <div className="flex flex-col md:max-w-[510px] ml-auto pt-4">
          {/* Tag + Title + Certification icon */}
          <div className="mb-6">
            <span className="bg-Black text-White font-maison-neue-mono leading-none text-p-sm px-4 pt-2 pb-1.5 rounded-full uppercase tracking-wide">
              {mockedProduct.tag}
            </span>
          </div>
          <div className="flex items-center justify-between mb-7">
            <h1 className="text-h3 font-gyst text-Charcoal">
              {strapiProductData?.MedusaProduct?.Title}
            </h1>
            <Image
              src="/images/pages/pdp/CertifiedKosher.png"
              width={90}
              height={90}
              alt="Certified Kosher"
            />
          </div>

          {/* Price & pack info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-b border-Charcoal mb-6">
            {/* price per lb */}
            <ProductPrice product={product} variant={selectedVariant} />

            {/* avg pack info */}
            <div className="flex flex-col sm:items-end md:pl-8 md:mt-0 py-6">
              {strapiProductData?.Metadata?.AvgPackSize && (
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  avg pack size:
                  <span className="inline-block text-right text-p-sm-bold font-maison-neue text-Charcoal font-bold ml-1 min-w-[50px]">
                    {strapiProductData.Metadata.AvgPackSize}
                  </span>
                </span>
              )}
              {strapiProductData?.Metadata?.AvgPackWeight && (
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal mt-2">
                  avg pack weight:
                  <span className="inline-block text-right text-p-sm-bold font-maison-neue text-Charcoal font-bold ml-1 min-w-[50px]">
                    {strapiProductData.Metadata.AvgPackWeight}
                  </span>
                </span>
              )}
            </div>
          </div>

          <ProductVariantPicker
            product={product}
            options={options}
            setOptionValue={setOptionValue}
          />

          {/* Quantity + Add to Cart */}
          <ProductActions
            product={product}
            variant={selectedVariant}
            inStock={inStock}
            isAdding={isAdding}
            isValidVariant={isValidVariant}
            quantity={quantity}
            increment={increment}
            decrement={decrement}
            handleAddToCart={handleAddToCart}
          />

          {/* Key product facts */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-1 border-y border-Charcoal py-4">
            {inStock && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={32}
                  height={32}
                  alt=""
                />
                <span className="ml-0.5 text-p-ex-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  In Stock
                </span>
              </span>
            )}
            {strapiProductData?.Metadata?.Serves && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={32}
                  height={32}
                  alt="serves"
                />
                <span className="ml-0.5 text-p-ex-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  Serves {strapiProductData.Metadata.Serves}
                </span>
              </span>
            )}
            {strapiProductData?.Metadata?.Uncooked && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={32}
                  height={32}
                  alt="Uncooked"
                />
                <span className="ml-0.5 text-p-ex-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  Uncooked
                </span>
              </span>
            )}
            {strapiProductData?.Metadata?.PiecesPerPack && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={32}
                  height={32}
                  alt={strapiProductData.Metadata.PiecesPerPack.toString()}
                />
                <span className="ml-0.5 text-p-ex-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  {strapiProductData.Metadata.PiecesPerPack} pieces per pack
                </span>
              </span>
            )}
          </div>

          {/* Description */}
          {strapiProductData?.MedusaProduct?.Description && (
            <>
              <h2 className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal pb-2">
                Description
              </h2>
              <p className="text-p-md font-maison-neue text-Charcoal mb-6">
                {strapiProductData.MedusaProduct.Description}
              </p>
            </>
          )}

          {/* Social Share */}
          <div className="mb-8">
            <SocialShare
              url={typeof window !== "undefined" ? window.location.href : `/${countryCode}/products/${product.handle}`}
              title={product.title || ""}
              description={strapiProductData?.MedusaProduct?.Description || product.description || ""}
              imageUrl={strapiProductData?.FeaturedImage?.url || product.thumbnail || ""}
            />
          </div>

          {/* Details & Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-Charcoal">
            {/* Details */}
            <div className="sm:border-r border-Charcoal pt-4 pb-4 sm:pb-0">
              <h3 className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal mb-4">
                Details
              </h3>
              <div className="flex gap-x-6">
                {strapiProductData?.Metadata?.GlutenFree && (
                  <div className="flex flex-col items-center">
                    <Image
                      src="/images/icons/icon-gluten free.svg"
                      width={48}
                      height={48}
                      alt="Gluten Free"
                    />
                    <span className="text-p-sm-mono font-maison-neue-mono text-Charcoal mt-2">
                      Gluten Free
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div className="pt-4 sm:pl-8 border-t sm:border-t-0 border-Charcoal">
              <h3 className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal mb-4">
                Certifications
              </h3>
              <div className="flex gap-x-6">
                {/* {mockedProduct.certifications.map((c, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Image
                      src="/images/icons/icon-gluten free.svg"
                      width={48}
                      height={48}
                      alt={c.label}
                    />
                    <span className="text-p-sm-mono font-maison-neue-mono text-Charcoal mt-2">
                      {c.label}
                    </span>
                  </div>
                ))} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
