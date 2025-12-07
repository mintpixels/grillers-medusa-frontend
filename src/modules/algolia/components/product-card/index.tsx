"use client"

import { useState } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import type { StrapiProductData } from "types/strapi"

const ProductCard = ({ hit }: { hit: StrapiProductData }) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    // Get the first variant ID
    const variantId = hit?.MedusaProduct?.Variants?.[0]?.VariantId
    if (!variantId) return

    setIsAdding(true)
    try {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode: "us", // You might want to get this from context
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
  <article>
    <LocalizedClientLink
      href={`/products/${hit?.MedusaProduct?.Handle}`}
      className="block"
    >
      <figure className="relative w-full aspect-square bg-gray-50">
        <Image
          src={hit?.FeaturedImage?.url ?? "https://placehold.co/400x400"}
          alt={hit.Title}
          fill
          className="object-cover"
        />
      </figure>
    </LocalizedClientLink>

    <div className="py-8">
      <LocalizedClientLink
        href={`/products/${hit?.MedusaProduct?.Handle}`}
        className="block"
      >
        <h4
          id={`hit-${hit.id}-title`}
          className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal hover:text-VibrantRed transition-colors"
        >
          {hit.Title}
        </h4>
      </LocalizedClientLink>
      
      {hit?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber && (
        <p className="text-Charcoal py-7 border-b border-Charcoal">
          <span className="text-h3 font-gyst">
            ${hit.MedusaProduct.Variants[0].Price.CalculatedPriceNumber}
          </span>{" "}
          <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-2">
            per lb
          </span>
        </p>
      )}

      {/* Enhanced Product Metadata */}
      <div className="py-6 space-y-4">
        {/* Dietary & Preparation Badges */}
        <div className="flex flex-wrap gap-3 text-xs font-maison-neue-mono uppercase text-Charcoal">
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
        </div>

        {/* Pack Information Grid */}
        <div className="grid grid-cols-2 gap-3">
          {hit?.Metadata?.AvgPackSize && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Pack Size</p>
              <p className="text-sm font-bold font-maison-neue text-Charcoal">{hit.Metadata.AvgPackSize}</p>
            </div>
          )}
          {hit?.Metadata?.AvgPackWeight && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Weight</p>
              <p className="text-sm font-bold font-maison-neue text-Charcoal">{hit.Metadata.AvgPackWeight}</p>
            </div>
          )}
          {hit?.Metadata?.Serves && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Serves</p>
              <p className="text-sm font-bold font-maison-neue text-Charcoal">{hit.Metadata.Serves}</p>
            </div>
          )}
          {hit?.Metadata?.PiecesPerPack && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Pieces</p>
              <p className="text-sm font-bold font-maison-neue text-Charcoal">{hit.Metadata.PiecesPerPack}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <LocalizedClientLink
          href={`/products/${hit?.MedusaProduct?.Handle}`}
          className="inline-flex gap-3 items-center hover:opacity-70 transition-opacity"
        >
          <span className="text-Charcoal font-rexton text-h6 font-bold uppercase">
            View Details
          </span>
          <Image
            src={"/images/icons/arrow-right.svg"}
            width={20}
            height={12}
            alt="view details"
          />
        </LocalizedClientLink>

        <button
          onClick={handleAddToCart}
          disabled={isAdding || !hit?.MedusaProduct?.Variants?.[0]?.VariantId}
          className="px-6 py-2 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  </article>
  )
}

export default ProductCard
