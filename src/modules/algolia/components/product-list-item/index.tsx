"use client"

import { useState } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import type { StrapiProductData } from "types/strapi"

const ProductListItem = ({ hit }: { hit: StrapiProductData }) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    const variantId = hit?.MedusaProduct?.Variants?.[0]?.VariantId
    if (!variantId) return

    setIsAdding(true)
    try {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode: "us",
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex gap-6">
        {/* Product Image */}
        <LocalizedClientLink
          href={`/products/${hit?.MedusaProduct?.Handle}`}
          className="flex-shrink-0"
        >
          <figure className="relative w-32 h-32 bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={hit?.FeaturedImage?.url ?? "https://placehold.co/400x400"}
              alt={hit.Title}
              fill
              className="object-cover"
            />
          </figure>
        </LocalizedClientLink>

        {/* Product Details - Middle Section */}
        <div className="flex-1 min-w-0">
          <LocalizedClientLink
            href={`/products/${hit?.MedusaProduct?.Handle}`}
            className="block"
          >
            <h4 className="text-lg font-gyst font-bold text-Charcoal hover:text-VibrantRed transition-colors mb-2">
              {hit.Title}
            </h4>
          </LocalizedClientLink>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-maison-neue-mono uppercase text-Charcoal">
            {hit?.Metadata?.GlutenFree && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="Gluten Free"
                  className="mr-1"
                />
                Gluten Free
              </span>
            )}
            {hit?.Metadata?.Uncooked && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="Uncooked"
                  className="mr-1"
                />
                Uncooked
              </span>
            )}
            {hit?.Metadata?.Cooked && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="Ready to Eat"
                  className="mr-1"
                />
                Ready to Eat
              </span>
            )}
            {hit?.Metadata?.Serves && (
              <span className="inline-flex items-center">
                <span className="text-gray-400 mr-2">|</span>
                Serves {hit.Metadata.Serves}
              </span>
            )}
            {hit?.Metadata?.AvgPackSize && (
              <span className="inline-flex items-center">
                <span className="text-gray-400 mr-2">|</span>
                Pack: {hit.Metadata.AvgPackSize}
              </span>
            )}
            {hit?.Metadata?.AvgPackWeight && (
              <span className="inline-flex items-center">
                <span className="text-gray-400 mr-2">|</span>
                {hit.Metadata.AvgPackWeight}
              </span>
            )}
            {hit?.Metadata?.PiecesPerPack && (
              <span className="inline-flex items-center">
                <span className="text-gray-400 mr-2">|</span>
                {hit.Metadata.PiecesPerPack} Pieces
              </span>
            )}
          </div>
        </div>

        {/* Price and Actions - Right Section */}
        <div className="flex-shrink-0 flex flex-col items-end justify-center gap-3 min-w-[180px]">
          {/* Price */}
          {hit?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber && (
            <div className="text-Charcoal text-right">
              <span className="text-2xl font-gyst font-bold">
                ${hit.MedusaProduct.Variants[0].Price.CalculatedPriceNumber}
              </span>
              <span className="text-sm font-maison-neue-mono uppercase ml-1">
                per lb
              </span>
            </div>
          )}

          {/* View Details Link */}
          <LocalizedClientLink
            href={`/products/${hit?.MedusaProduct?.Handle}`}
            className="inline-flex gap-2 items-center text-sm font-medium text-Charcoal hover:text-VibrantRed transition-colors"
          >
            View Details
            <Image
              src={"/images/icons/arrow-right.svg"}
              width={16}
              height={10}
              alt="view details"
            />
          </LocalizedClientLink>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !hit?.MedusaProduct?.Variants?.[0]?.VariantId}
            className="w-full py-2 px-4 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductListItem