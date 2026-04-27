"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { Tooltip, TooltipProvider } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

// Force the title to fill the available 3-line slot. Subgrid sizes the title
// track to the longest title in a row, but shorter titles still wrap to 1–2
// lines, leaving the badges/desc rows visually anchored to a half-empty title.
// We binary-search a right-padding value that pushes the natural wrap to 3
// lines so all titles in a row look like equal blocks of text.
function useTitleFillsThreeLines(ref: React.RefObject<HTMLElement>, deps: any[]) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const adjust = () => {
      // Reset inline pr so the base class (pr-3) takes effect for measurement.
      el.style.paddingRight = ""
      const cs = window.getComputedStyle(el)
      const lineHeight = parseFloat(cs.lineHeight)
      const basePr = parseFloat(cs.paddingRight) || 0
      if (!lineHeight || !isFinite(lineHeight)) return
      const targetHeight = lineHeight * 3
      // Already 3+ lines (or clamped to 3). Nothing to do.
      if (el.offsetHeight >= targetHeight - 1) return

      const fullWidth = el.clientWidth
      if (fullWidth <= 0) return

      // Binary search the smallest pr (≥ basePr) that pushes the wrap to 3 lines.
      let lo = basePr
      let hi = basePr + fullWidth * 0.7
      // Safety: 12 iterations gives ~px precision over the search range.
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        el.style.paddingRight = `${mid}px`
        if (el.offsetHeight >= targetHeight - 1) {
          hi = mid
        } else {
          lo = mid
        }
      }
      el.style.paddingRight = `${hi}px`
    }

    adjust()

    // Re-run on parent resize (viewport resize, sidebar collapse, etc.).
    const parent = el.parentElement
    if (!parent || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(adjust)
    ro.observe(parent)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

type StrapiProductGridProps = {
  products: StrapiCollectionProduct[]
  countryCode: string
  viewMode?: "grid" | "list"
}

export function ProductCard({ product, countryCode, viewMode = "grid" }: { product: StrapiCollectionProduct; countryCode: string; viewMode?: "grid" | "list" }) {
  const [isAdding, setIsAdding] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useTitleFillsThreeLines(
    titleRef,
    [product.Title, viewMode]
  )

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
          <figure className="relative w-[180px] aspect-square bg-gray-50 overflow-hidden">
            <Image
              src={product?.FeaturedImage?.url ?? "https://placehold.co/400x400"}
              alt={product.Title}
              fill
              className="object-cover"
            />
          </figure>
        </LocalizedClientLink>

        {/* Col 2: Details */}
        <div className="min-w-0 pr-12">
          <LocalizedClientLink
            href={`/products/${product?.MedusaProduct?.Handle}`}
            className="block mb-2"
          >
            <h2 className="text-h4 font-gyst font-bold text-Charcoal hover:text-VibrantRed transition-colors text-balance">
              {product.Title}
            </h2>
          </LocalizedClientLink>

          {/* Description */}
          {product?.MedusaProduct?.ShortDescription && (
            <p className="text-sm font-maison-neue text-gray-500 leading-snug mb-3 text-balance">
              {product.MedusaProduct.ShortDescription}
            </p>
          )}

          {/* Icons row — below title + description */}
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center flex-wrap gap-4 mb-3">
              {product?.Metadata?.GlutenFree && (
                <Tooltip content="Gluten Free" className="bg-Charcoal text-white">
                  <span className="inline-flex items-center cursor-default">
                    <Image
                      src="/images/icons/gluten-free.png"
                      width={64}
                      height={32}
                      alt="Gluten Free"
                      className="h-7 w-auto"
                    />
                  </span>
                </Tooltip>
              )}
              {product?.Metadata?.Cooked ? (
                <span className="text-xs font-maison-neue-mono uppercase text-gray-500">
                  Ready to Eat
                </span>
              ) : product?.Metadata?.Uncooked ? (
                <Tooltip content="Uncooked" className="bg-Charcoal text-white">
                  <span className="inline-flex items-center cursor-default">
                    <Image
                      src="/images/icons/raw.png"
                      width={95}
                      height={43}
                      alt="Uncooked"
                      className="h-5 w-auto"
                    />
                  </span>
                </Tooltip>
              ) : null}
              {product?.Metadata?.MSG && (
                <Tooltip content="No MSG" className="bg-Charcoal text-white">
                  <span className="inline-flex items-center cursor-default">
                    <Image
                      src="/images/icons/no-msg.png"
                      width={48}
                      height={24}
                      alt="No MSG"
                      className="h-5 w-auto"
                    />
                  </span>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>

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
          <div className="flex flex-col items-end gap-1 whitespace-nowrap">
            {product?.MedusaProduct?.Variants?.[0]?.Sku && (
              <p className="text-xs font-maison-neue-mono text-gray-400">
                {product.MedusaProduct.Variants[0].Sku}
              </p>
            )}
            {price && (
              <p className="text-Charcoal">
                <span className="text-h4 font-gyst">${Number(price).toFixed(2)}</span>{" "}
                <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-1">per lb</span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <LocalizedClientLink
              href={`/products/${product?.MedusaProduct?.Handle}`}
              className="inline-flex gap-2 items-center justify-center hover:opacity-70 transition-opacity w-full"
            >
              <span className="text-Charcoal font-rexton text-[10px] font-bold uppercase whitespace-nowrap">View Details</span>
              <Image src="/images/icons/arrow-right.svg" width={16} height={10} alt="view details" />
            </LocalizedClientLink>

            <button
              onClick={handleAddToCart}
              disabled={isAdding || !product?.MedusaProduct?.Variants?.[0]?.VariantId}
              className="w-full px-6 py-2.5 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
            >
              {isAdding ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    // Subgrid layout: each card spans 7 row tracks of the parent grid
    // (image, price+sku, title, badges, desc, pack, actions). Cards in
    // the same parent-grid row share track heights, so the title row
    // auto-sizes to the longest title in that row, etc. — no fixed
    // line-clamp needed. Falls back to a regular grid container when
    // the parent isn't a CSS grid (e.g. the PDP swiper).
    <article className="grid grid-rows-subgrid row-span-7 gap-y-0 pb-8">
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

      {/* Row 2: Price */}
      <div className="mt-6">
        {price ? (
          <p className="text-Charcoal leading-none">
            <span className="text-h4 font-gyst">
              ${Number(price).toFixed(2)}
            </span>{" "}
            <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-1">
              per lb
            </span>
          </p>
        ) : null}
      </div>

      {/* Row 3: Title — line-clamp-3 caps at 3 lines, and useTitleFillsThreeLines
         pushes shorter titles to 3 lines via JS-measured padding-right so the
         row of cards has visually balanced 3-line title blocks. */}
      <LocalizedClientLink
        href={`/products/${product?.MedusaProduct?.Handle}`}
        className="block"
      >
        <h2
          ref={titleRef}
          className="text-h4 font-gyst font-bold text-Charcoal hover:text-VibrantRed transition-colors line-clamp-3 pr-6 text-balance"
        >
          {product.Title}
        </h2>
      </LocalizedClientLink>

      {/* Row 4: Icons (left) + SKU (right) — below the title */}
      <TooltipProvider delayDuration={100}>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap items-center gap-4 text-xs font-maison-neue-mono uppercase text-gray-500 justify-start">
            {product?.Metadata?.GlutenFree && (
              <Tooltip content="Gluten Free" className="bg-Charcoal text-white">
                <span className="inline-flex items-center cursor-default">
                  <Image
                    src="/images/icons/gluten-free.png"
                    width={64}
                    height={32}
                    alt="Gluten Free"
                    className="h-7 w-auto"
                  />
                </span>
              </Tooltip>
            )}
            {product?.Metadata?.Cooked ? (
              <span className="inline-flex items-center">Ready to Eat</span>
            ) : product?.Metadata?.Uncooked ? (
              <Tooltip content="Uncooked" className="bg-Charcoal text-white">
                <span className="inline-flex items-center cursor-default">
                  <Image
                    src="/images/icons/raw.png"
                    width={95}
                    height={43}
                    alt="Uncooked"
                    className="h-5 w-auto"
                  />
                </span>
              </Tooltip>
            ) : null}
            {product?.Metadata?.MSG && (
              <Tooltip content="No MSG" className="bg-Charcoal text-white">
                <span className="inline-flex items-center cursor-default">
                  <Image
                    src="/images/icons/no-msg.png"
                    width={48}
                    height={24}
                    alt="No MSG"
                    className="h-5 w-auto"
                  />
                </span>
              </Tooltip>
            )}
          </div>
          {product?.MedusaProduct?.Variants?.[0]?.Sku && (
            <p className="text-xs font-maison-neue-mono text-gray-400 shrink-0 ml-3">
              {product.MedusaProduct.Variants[0].Sku}
            </p>
          )}
        </div>
      </TooltipProvider>

      {/* Row 5: Short Description (always rendered to keep subgrid alignment) */}
      <p className="text-sm font-maison-neue text-gray-500 leading-snug line-clamp-3 mt-3 text-balance">
        {product?.MedusaProduct?.ShortDescription ?? ""}
      </p>

      {/* Row 6: Pack Information */}
      <div className="grid grid-cols-3 gap-2 mt-3">
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

      {/* Row 7: Actions */}
      <div className="flex items-center justify-between gap-2 mt-4">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !product?.MedusaProduct?.Variants?.[0]?.VariantId}
          className="px-4 py-2 rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-xs font-bold uppercase transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </button>

        <LocalizedClientLink
          href={`/products/${product?.MedusaProduct?.Handle}`}
          className="inline-flex gap-2 items-center hover:opacity-70 transition-opacity shrink-0"
        >
          <span className="text-Charcoal font-rexton text-[10px] font-bold uppercase whitespace-nowrap">
            View Details
          </span>
          <Image
            src={"/images/icons/arrow-right.svg"}
            width={16}
            height={10}
            alt="view details"
          />
        </LocalizedClientLink>
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
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0"
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
