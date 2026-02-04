"use client"

import { useState } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

type StrapiProductGridProps = {
  products: StrapiCollectionProduct[]
  countryCode: string
  viewMode?: "grid" | "list"
}

function ProductCard({ product, countryCode }: { product: StrapiCollectionProduct; countryCode: string }) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    const variantId = product?.MedusaProduct?.ProductId
    if (!variantId) return

    setIsAdding(true)
    try {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const price = product?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber

  return (
    <article>
      <LocalizedClientLink
        href={`/products/${product?.MedusaProduct?.Handle}`}
        className="block"
      >
        <figure className="relative w-full aspect-square bg-gray-50">
          <Image
            src={product?.FeaturedImage?.url ?? "https://placehold.co/400x400"}
            alt={product.Title}
            fill
            className="object-cover"
          />
        </figure>
      </LocalizedClientLink>

      <div className="py-8">
        <LocalizedClientLink
          href={`/products/${product?.MedusaProduct?.Handle}`}
          className="block"
        >
          <h4
            className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal hover:text-VibrantRed transition-colors"
          >
            {product.Title}
          </h4>
        </LocalizedClientLink>
        
        {price && (
          <p className="text-Charcoal py-7 border-b border-Charcoal">
            <span className="text-h3 font-gyst">
              ${price}
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
            {product?.Metadata?.GlutenFree && (
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
            {product?.Metadata?.Uncooked && (
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
            {product?.Metadata?.Cooked && (
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
            {product?.Metadata?.AvgPackSize && (
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Pack Size</p>
                <p className="text-sm font-bold font-maison-neue text-Charcoal">{product.Metadata.AvgPackSize}</p>
              </div>
            )}
            {product?.Metadata?.AvgPackWeight && (
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Weight</p>
                <p className="text-sm font-bold font-maison-neue text-Charcoal">{product.Metadata.AvgPackWeight}</p>
              </div>
            )}
            {product?.Metadata?.Serves && (
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Serves</p>
                <p className="text-sm font-bold font-maison-neue text-Charcoal">{product.Metadata.Serves}</p>
              </div>
            )}
            {product?.Metadata?.PiecesPerPack && (
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">Pieces</p>
                <p className="text-sm font-bold font-maison-neue text-Charcoal">{product.Metadata.PiecesPerPack}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <LocalizedClientLink
            href={`/products/${product?.MedusaProduct?.Handle}`}
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
            disabled={isAdding || !product?.MedusaProduct?.ProductId}
            className="px-6 py-2 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function StrapiProductGrid({ products, countryCode, viewMode = "grid" }: StrapiProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-h4 font-gyst text-Charcoal mb-2">No products found</p>
        <p className="text-p-md text-gray-600">
          Products with this tag will appear here once they are tagged in the system.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
      </div>
      
      <div 
        className={
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            : "flex flex-col space-y-8"
        }
      >
        {products.map((product) => (
          <ProductCard 
            key={product.documentId} 
            product={product} 
            countryCode={countryCode}
          />
        ))}
      </div>
    </>
  )
}
