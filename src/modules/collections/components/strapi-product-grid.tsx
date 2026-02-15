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

function ProductCard({ product, countryCode, viewMode = "grid" }: { product: StrapiCollectionProduct; countryCode: string; viewMode?: "grid" | "list" }) {
  const [isAdding, setIsAdding] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const handleAddToCart = async () => {
    const variantId = product?.MedusaProduct?.Variants?.[0]?.VariantId
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

  if (viewMode === "list") {
    return (
      <article className="grid grid-cols-[180px_1fr_auto] gap-6 border-b border-gray-200 pb-6 items-stretch">
        {/* Col 1: Image */}
        <LocalizedClientLink
          href={`/products/${product?.MedusaProduct?.Handle}`}
          className="block shrink-0"
        >
          <figure className="relative w-[180px] aspect-square bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={product?.FeaturedImage?.url ?? "https://placehold.co/400x400"}
              alt={product.Title}
              fill
              className="object-cover"
            />
          </figure>
        </LocalizedClientLink>

        {/* Col 2: Details */}
        <div className="min-w-0 py-1 pr-12">
          {/* Preparation badge */}
          {(product?.Metadata?.Cooked || product?.Metadata?.Uncooked) && (
            <p className="text-xs font-maison-neue-mono uppercase text-gray-500 mb-1">
              {product?.Metadata?.Cooked ? "Ready to Eat" : "Uncooked"}
            </p>
          )}

          <LocalizedClientLink
            href={`/products/${product?.MedusaProduct?.Handle}`}
            className="block mb-2"
          >
            <h2 className="text-h4 font-gyst font-bold text-Charcoal hover:text-VibrantRed transition-colors">
              {product.Title}
            </h2>
          </LocalizedClientLink>

          {/* Description */}
          {product?.MedusaProduct?.Description && (
            <div className="mb-3">
              {descExpanded ? (
                <p className="text-sm font-maison-neue text-gray-600">
                  {product.MedusaProduct.Description}{" "}
                  <button
                    onClick={() => setDescExpanded(false)}
                    className="text-xs font-maison-neue text-VibrantRed hover:underline focus:outline-none inline"
                  >
                    Read less
                  </button>
                </p>
              ) : (
                <p className="text-sm font-maison-neue text-gray-600">
                  {product.MedusaProduct.Description.length > 160
                    ? `${product.MedusaProduct.Description.slice(0, 160).trimEnd()}… `
                    : product.MedusaProduct.Description}
                  {product.MedusaProduct.Description.length > 160 && (
                    <button
                      onClick={() => setDescExpanded(true)}
                      className="text-xs font-maison-neue text-VibrantRed hover:underline focus:outline-none inline"
                    >
                      Read more
                    </button>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Dietary badges */}
          <div className="flex items-center flex-wrap gap-3 mb-2">
            {product?.Metadata?.GlutenFree && (
              <span className="inline-flex items-center text-xs font-maison-neue-mono uppercase text-Charcoal">
                <Image src="/images/icons/icon-circle-check.svg" width={16} height={16} alt="Gluten Free" className="mr-1" />
                Gluten Free
              </span>
            )}
            {product?.Metadata?.MSG && (
              <span className="inline-flex items-center text-xs font-maison-neue-mono uppercase text-Charcoal">
                <Image src="/images/icons/icon-circle-check.svg" width={16} height={16} alt="No MSG" className="mr-1" />
                No MSG
              </span>
            )}
          </div>

          {/* Pack info */}
          <div className="flex items-center flex-wrap gap-2">
            {product?.Metadata?.AvgPackWeight && (
              <div className="border border-gray-200 rounded-md px-3 py-1 bg-white">
                <span className="text-xs font-maison-neue-mono uppercase text-gray-500 mr-1">Weight:</span>
                <span className="text-xs font-bold font-maison-neue text-Charcoal">{product.Metadata.AvgPackWeight}</span>
              </div>
            )}
            {product?.Metadata?.Serves && (
              <div className="border border-gray-200 rounded-md px-3 py-1 bg-white">
                <span className="text-xs font-maison-neue-mono uppercase text-gray-500 mr-1">Serves:</span>
                <span className="text-xs font-bold font-maison-neue text-Charcoal">{product.Metadata.Serves}</span>
              </div>
            )}
            {product?.Metadata?.PiecesPerPack && (
              <div className="border border-gray-200 rounded-md px-3 py-1 bg-white">
                <span className="text-xs font-maison-neue-mono uppercase text-gray-500 mr-1">Pieces:</span>
                <span className="text-xs font-bold font-maison-neue text-Charcoal">{product.Metadata.PiecesPerPack}</span>
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Price & Actions */}
        <div className="flex flex-col items-end justify-between py-1 h-full self-stretch">
          {price && (
            <p className="text-Charcoal whitespace-nowrap text-right pt-8">
              <span className="text-h4 font-gyst">${Number(price).toFixed(2)}</span>{" "}
              <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-1">per lb</span>
            </p>
          )}

          <div className="flex flex-col items-end gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !product?.MedusaProduct?.Variants?.[0]?.VariantId}
              className="w-full px-6 py-2.5 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
            >
              {isAdding ? "Adding..." : "Add to Cart"}
            </button>

            <LocalizedClientLink
              href={`/products/${product?.MedusaProduct?.Handle}`}
              className="inline-flex gap-2 items-center justify-center hover:opacity-70 transition-opacity w-full"
            >
              <span className="text-Charcoal font-rexton text-xs font-bold uppercase whitespace-nowrap">View Details</span>
              <Image src="/images/icons/arrow-right.svg" width={16} height={10} alt="view details" />
            </LocalizedClientLink>
          </div>
        </div>
      </article>
    )
  }

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
        {/* Preparation badge above title */}
        <div className="min-h-[16px] mb-1">
          {(product?.Metadata?.Cooked || product?.Metadata?.Uncooked) && (
            <p className="text-xs font-maison-neue-mono uppercase text-gray-500">
              {product?.Metadata?.Cooked ? "Ready to Eat" : "Uncooked"}
            </p>
          )}
        </div>

        <LocalizedClientLink
          href={`/products/${product?.MedusaProduct?.Handle}`}
          className="block"
        >
          <h2
            className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal hover:text-VibrantRed transition-colors text-balance min-h-[68px]"
          >
            {product.Title}
          </h2>
        </LocalizedClientLink>
        
        <div className="flex items-center justify-between py-4 border-b border-Charcoal">
          {price && (
            <p className="text-Charcoal">
              <span className="text-h4 font-gyst">
                ${Number(price).toFixed(2)}
              </span>{" "}
              <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-1">
                per lb
              </span>
            </p>
          )}

          {/* Dietary Badges */}
          <div className="flex flex-wrap gap-3 text-xs font-maison-neue-mono uppercase text-Charcoal justify-end">
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
            {product?.Metadata?.MSG && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={20}
                  height={20}
                  alt="No MSG"
                  className="mr-1"
                />
                No MSG
              </span>
            )}
          </div>
        </div>

        {/* Pack Information */}
        <div className="py-6">

          {/* Pack Information Grid */}
          <div className="grid grid-cols-3 gap-2">
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
        <div className="flex items-center justify-between gap-2 pt-4">
          <LocalizedClientLink
            href={`/products/${product?.MedusaProduct?.Handle}`}
            className="inline-flex gap-2 items-center hover:opacity-70 transition-opacity shrink-0"
          >
            <span className="text-Charcoal font-rexton text-xs font-bold uppercase whitespace-nowrap">
              View Details
            </span>
            <Image
              src={"/images/icons/arrow-right.svg"}
              width={16}
              height={10}
              alt="view details"
            />
          </LocalizedClientLink>

          <button
            onClick={handleAddToCart}
            disabled={isAdding || !product?.MedusaProduct?.Variants?.[0]?.VariantId}
            className="px-4 py-2 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
      <div 
        className={
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8"
            : "flex flex-col space-y-8"
        }
      >
        {products.map((product) => (
          <ProductCard 
            key={product.documentId} 
            product={product} 
            countryCode={countryCode}
            viewMode={viewMode}
          />
        ))}
      </div>
    </>
  )
}
