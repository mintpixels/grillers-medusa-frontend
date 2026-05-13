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
import KashruthBadges from "@modules/products/components/kashruth-badges"
import NotifyBackInStockForm from "@modules/products/components/notify-back-in-stock"

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
      className="relative w-full h-96 md:h-[600px]"
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
              className="object-cover border border-gray-300"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Slider nav with enhanced accessibility */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-[1]" role="group" aria-label="Gallery navigation">
        <button
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

  // Build breadcrumb items.
  // Order of preference: Medusa product.categories (Medusa-managed category
  // tree) → Medusa product.collection → Strapi ProductCollections (the
  // collections used in the storefront's nav, now nested under
  // Categorization) → Strapi L2 product tag.
  const strapiData = strapiProductData as any
  const strapiCollection = strapiData?.Categorization?.ProductCollections?.[0]
  const strapiL2Tag = strapiData?.Categorization?.ProductTags?.find(
    (t: { Name: string }) => t.Name?.startsWith("L2:")
  )
  const fallbackCollection =
    product.collection ||
    (strapiCollection
      ? { title: strapiCollection.Name, handle: strapiCollection.Slug }
      : strapiL2Tag
        ? {
            title: strapiL2Tag.Name.replace(/^L2:\s*/, ""),
            handle: encodeURIComponent(strapiL2Tag.Name),
          }
        : null)

  const breadcrumbItems = buildProductBreadcrumbs(
    fallbackCollection,
    countryCode,
    (product as any).categories
  )

  return (
    <section className="py-4 md:pt-4 md:pb-16 bg-Scroll relative">
      {/* Breadcrumb Navigation */}
      <div className="mx-auto max-w-7xl px-6 mb-8">
        <Breadcrumb
          items={breadcrumbItems}
          currentPage={strapiProductData?.Title || product.title || "Product"}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left: product image + nav buttons - sticky on desktop */}
        <div className="md:sticky md:top-[150px] md:self-start mt-6">
          <ProductImages product={product} images={images} />
        </div>

        {/* Right: product info */}
        <div className="flex flex-col pt-4 relative">
          {/* Certification icon - absolutely positioned. The 72px right
              padding on the SKU + h1 below keeps the title text out from
              under the badge on mobile (badge is 63px wide; 72px gives a
              small breathing margin). */}
          <div className="absolute top-0 right-0">
            <Image
              src="/images/pages/pdp/CertifiedKosher.png"
              width={63}
              height={63}
              alt="Certified Kosher"
            />
          </div>

          {/* Tag + Title */}
          <div className="mb-6">
            <span className="bg-Black text-White font-maison-neue-mono leading-none text-p-sm px-4 pt-2 pb-1.5 rounded-full uppercase tracking-wide">
              {mockedProduct.tag}
            </span>
          </div>
          {(selectedVariant?.sku || strapiProductData?.MedusaProduct?.Variants?.[0]?.Sku) && (
            <p className="text-xs font-maison-neue-mono uppercase tracking-wider text-Charcoal/40 mb-2 pr-[72px] sm:pr-0">
              SKU: {selectedVariant?.sku || strapiProductData?.MedusaProduct?.Variants?.[0]?.Sku}
            </p>
          )}
          <h1 className="text-h3 font-gyst text-Charcoal mb-7 text-balance pr-[72px] sm:pr-0">
            {strapiProductData?.Title || product.title}
          </h1>

          {/* Price block. Headline + math-on-one-line sub for catch-weight
              items, `Each — fixed price` for items flagged as such in QB.
              AVG PACK WEIGHT box dropped — the math line now carries the
              same info (`Estimated $4.78 for a ~1.2 lb pack`) without
              forcing the customer to multiply. */}
          <div className="border-t border-b border-Charcoal mb-6">
            <ProductPrice
              product={product}
              variant={selectedVariant}
              metadata={strapiProductData?.Metadata}
              explicitMode={(strapiProductData?.MedusaProduct as { PricingMode?: "per_lb" | "fixed_price" } | undefined)?.PricingMode}
            />
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

          {/* Notify-me-when-back-in-stock — only shown when the
              selected variant is OOS. Drops the customer's email
              into a Strapi `back-in-stock-request` collection and
              fires a Postmark confirmation. Restock trigger lives
              outside this surface (Medusa inventory webhook). #102. */}
          {!inStock && (
            <div className="mb-6">
              <NotifyBackInStockForm
                medusaProductId={product.id || ""}
                productHandle={product.handle || ""}
                productTitle={strapiProductData?.Title || product.title || "this product"}
              />
            </div>
          )}

          {/* Key product facts */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6 border-y border-Charcoal py-5">
            {inStock && (
              <div className="inline-flex items-center gap-2">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt=""
                  className="flex-shrink-0"
                />
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  In Stock
                </span>
              </div>
            )}
            {strapiProductData?.Metadata?.Serves && (
              <div className="inline-flex items-center gap-2">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="serves"
                  className="flex-shrink-0"
                />
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  Serves {strapiProductData.Metadata.Serves}
                </span>
              </div>
            )}
            {strapiProductData?.Metadata?.Uncooked && (
              <div className="inline-flex items-center gap-2">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="Uncooked"
                  className="flex-shrink-0"
                />
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  Uncooked
                </span>
              </div>
            )}
            {strapiProductData?.Metadata?.Cooked && (
              <div className="inline-flex items-center gap-2">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="Ready to Eat"
                  className="flex-shrink-0"
                />
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  Ready to Eat
                </span>
              </div>
            )}
            {strapiProductData?.Metadata?.PiecesPerPack && (
              <div className="inline-flex items-center gap-2">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt={strapiProductData.Metadata.PiecesPerPack.toString()}
                  className="flex-shrink-0"
                />
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  {strapiProductData.Metadata.PiecesPerPack} pieces per pack
                </span>
              </div>
            )}
            {/* AvgPackSize chip — restored after the AVG PACK WEIGHT
                box dropped in 4e77641. Holds descriptive shape info
                ("28 oz container", "vacuum-sealed pouch", "case of 6")
                that complements the catch-weight math line above. #129. */}
            {strapiProductData?.Metadata?.AvgPackSize && (
              <div className="inline-flex items-center gap-2">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt=""
                  className="flex-shrink-0"
                />
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  Pack size: {strapiProductData.Metadata.AvgPackSize}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {strapiProductData?.MedusaProduct?.Description && (
            <>
              <h2 className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal pb-2">
                Description
              </h2>
              <p className="text-p-md font-maison-neue text-Charcoal mb-6 leading-relaxed">
                {strapiProductData.MedusaProduct.Description}
              </p>
            </>
          )}

          {/* Kashruth + sourcing chips — only renders flags that come
              from Strapi metadata; always shows the "kashruth policy"
              link so customers who filter on a specific hechsher can
              read GP's umbrella supervision details (#39). */}
          <KashruthBadges
            metadata={strapiProductData?.Metadata}
            countryCode={countryCode}
          />

          {/* Shipping eligibility callout moved out of the buybox to
              its own section between ProductDetail and HowItWorks (see
              templates/index.tsx). This decongests the buybox column
              and puts the trust-building content in the natural
              "how-it-works / why-us" trust zone — Avi's call on
              #128 part 2. */}

          {/* Social Share */}
          <div className="mb-8">
            <SocialShare
              url={typeof window !== "undefined" ? window.location.href : `/${countryCode}/products/${product.handle}`}
              title={product.title || ""}
              description={strapiProductData?.MedusaProduct?.Description || product.description || ""}
              imageUrl={strapiProductData?.FeaturedImage?.url || product.thumbnail || ""}
            />
          </div>

          {/* Legacy "Details & Certifications" grid removed in #126 —
              the KashruthBadges chip row above renders the same Gluten
              Free / sourcing flags as data-driven chips, and the
              umbrella Certified Kosher graphic still hangs in the
              hero badge area at the top of the page. */}
        </div>
      </div>
    </section>
  )
}
