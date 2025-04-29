"use client"

import React, { useState, useRef, useMemo, useEffect } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import { HttpTypes } from "@medusajs/types"
import { isEqual } from "lodash"
import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"

import { getProductPrice } from "@lib/util/get-product-price"
type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiProductData: any
  selectedVariant: HttpTypes.StoreProductVariant
}

const ProductImages = ({
  product,
  images,
}: {
  product: HttpTypes.StoreProduct
  images: any[]
}) => {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <div className="absolute w-[50vw] left-0 h-[calc(100%-98px)]">
      <Swiper
        spaceBetween={24}
        slidesPerView={1}
        className="h-full"
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        loop={true}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index} className="">
            <Image
              src={image.url}
              alt={product.title + index}
              fill
              className="object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Slider nav */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-[1]">
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
        >
          <Image
            src="/images/icons/arrow-left.svg"
            width={12}
            height={20}
            alt="Prev"
          />
        </button>
        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
        >
          <Image
            src="/images/icons/arrow-right.svg"
            width={12}
            height={20}
            alt="Next"
          />
        </button>
      </div>
    </div>
  )
}

const ProductPrice = ({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) => {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="border-r border-Charcoal py-6">
      <span className="text-h3 font-gyst text-Charcoal">
        {selectedPrice.calculated_price}
      </span>
      <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal pl-5">
        per lb
      </span>
    </div>
  )
}

function ProductDetail({
  product,
  region,
  countryCode,
  strapiProductData,
  selectedVariant,
}: ProductTemplateProps) {
  const [quantity, setQuantity] = useState(1)

  const increment = () => setQuantity((q) => q + 1)
  const decrement = () => setQuantity((q) => Math.max(1, q - 1))

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
    strapiProductData.FeaturedImage,
    ...strapiProductData.GalleryImages,
  ].filter((image) => image.url)

  return (
    <section className="py-8 md:pt-8 md:pb-16 bg-Scroll relative">
      <div className="mx-auto max-w-7xl px-4.5 grid grid-cols-1 md:grid-cols-2 gap-8 ">
        {/* Left: product image + nav buttons */}
        <div>
          <ProductImages product={product} images={images} />
        </div>

        {/* Right: product info */}
        <div className="flex flex-col max-w-[510px] ml-auto pt-4">
          {/* Tag + Title + Certification icon */}
          <div className="mb-6">
            <span className="bg-Black text-White font-maison-neue-mono leading-none text-p-sm px-4 pt-2 pb-1.5 rounded-full uppercase tracking-wide">
              {mockedProduct.tag}
            </span>
          </div>
          <div className="flex items-center justify-between mb-7">
            <h1 className="text-h3 font-gyst text-Charcoal">{product.title}</h1>
            <Image
              src="/images/pages/pdp/CertifiedKosher.png"
              width={90}
              height={90}
              alt="Certified Kosher"
            />
          </div>

          {/* Price & pack info */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-b border-Charcoal mb-6">
            {/* price per lb */}
            <ProductPrice product={product} variant={selectedVariant} />

            {/* avg pack info */}
            <div className="flex flex-col items-end md:pl-8 mt-4 md:mt-0 py-6">
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

          {/* Quantity + Add to Cart */}
          <div className="flex flex-col md:flex-row items-center mb-6 gap-y-4 md:gap-y-0 md:gap-x-8">
            {/* qty selector */}
            <div className="flex border border-Charcoal h-full font-maison-neue text-p-lg">
              <button
                onClick={decrement}
                className="px-4 text-Charcoal hover:bg-SilverPlate transition w-[50px]"
              >
                –
              </button>
              <span className="inline-flex items-center justify-center px-4 border-x border-Charcoal text-Charcoal w-[50px]">
                {quantity}
              </span>
              <button
                onClick={increment}
                className="px-4 text-Charcoal hover:bg-SilverPlate transition w-[50px]"
              >
                +
              </button>
            </div>

            {/* add to cart */}
            <button className="flex-1 btn-primary">
              Add to Cart – $
              {(mockedProduct.avgPackPrice * quantity).toFixed(2)}
            </button>
          </div>

          {/* Key product facts */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-1 border-y border-Charcoal py-4">
            {mockedProduct.inStock && (
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
            {strapiProductData.Metadata.PiecesPerPack && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={32}
                  height={32}
                  alt={strapiProductData.Metadata.PiecesPerPack}
                />
                <span className="ml-0.5 text-p-ex-sm-mono font-maison-neue-mono uppercase text-Charcoal">
                  {strapiProductData.Metadata.PiecesPerPack} pieces per pack
                </span>
              </span>
            )}
          </div>

          {/* Description */}
          {product?.description && (
            <>
              <h2 className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal pb-2">
                Description
              </h2>
              <p className="text-p-md font-maison-neue text-Charcoal mb-8">
                {product.description}
              </p>{" "}
            </>
          )}

          {/* Details & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-Charcoal">
            {/* Details */}
            <div className="border-r border-Charcoal pt-4">
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
            <div className="pt-4 pl-8">
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

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductDetailContainer({
  product,
  region,
  countryCode,
  strapiProductData,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiProductData: any
}) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <ProductDetail
      product={product}
      region={region}
      countryCode={countryCode}
      strapiProductData={strapiProductData}
      selectedVariant={selectedVariant}
    />
  )
}
