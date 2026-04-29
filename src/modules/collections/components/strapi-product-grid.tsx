"use client"

import { useLayoutEffect, useState } from "react"
import Image from "next/image"
import { Tooltip, TooltipProvider } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FormattedPrice from "@modules/common/components/formatted-price"
import ProductCardCarousel from "@modules/common/components/product-card-carousel"
import { addToCart } from "@lib/data/cart"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

// Find every card title in the document, group them by visible row (Y top),
// and pad shorter titles within each row to the max natural height of that
// row. Works in both the CSS-grid collection page and the PDP Swiper because
// it groups by rendered position, not parent type. Runs once per animation
// frame regardless of how many cards request alignment.
function alignTitlesAcrossRows() {
  if (typeof document === "undefined") return
  const titles = Array.from(
    document.querySelectorAll<HTMLElement>("[data-card-title]")
  )
  if (titles.length === 0) return

  // Reset every title's inline padding-right so we measure natural heights.
  for (const t of titles) t.style.paddingRight = ""

  // Group by Y position (5px tolerance to account for sub-pixel rounding).
  const buckets: Array<{ y: number; titles: HTMLElement[] }> = []
  for (const t of titles) {
    const y = t.getBoundingClientRect().top
    const bucket = buckets.find((b) => Math.abs(b.y - y) < 5)
    if (bucket) bucket.titles.push(t)
    else buckets.push({ y, titles: [t] })
  }

  for (const { titles: rowTitles } of buckets) {
    if (rowTitles.length <= 1) continue
    let maxH = 0
    for (const t of rowTitles) if (t.offsetHeight > maxH) maxH = t.offsetHeight
    for (const t of rowTitles) {
      if (t.offsetHeight >= maxH - 1) continue
      const fullWidth = t.clientWidth
      if (fullWidth <= 0) continue
      let lo = 0
      let hi = fullWidth * 0.7
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        t.style.paddingRight = `${mid}px`
        if (t.offsetHeight >= maxH - 1) hi = mid
        else lo = mid
      }
      t.style.paddingRight = `${hi}px`
    }
  }
}

let alignScheduled = false
function scheduleAlignTitles() {
  if (alignScheduled || typeof window === "undefined") return
  alignScheduled = true
  requestAnimationFrame(() => {
    alignScheduled = false
    alignTitlesAcrossRows()
  })
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", scheduleAlignTitles)
}

function useTitleAlignToRow(deps: any[]) {
  useLayoutEffect(() => {
    scheduleAlignTitles()
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
  useTitleAlignToRow([product.Title, viewMode])

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

  const galleryImages = [
    product?.FeaturedImage?.url,
    ...(product?.GalleryImages?.map((g) => g?.url) ?? []),
  ].filter((u): u is string => !!u)

  if (viewMode === "list") {
    return (
      <article className="grid grid-cols-[180px_1fr_auto] gap-6 border-b border-gray-200 pb-6 items-stretch">
        {/* Col 1: Image */}
        <LocalizedClientLink
          href={`/products/${product?.MedusaProduct?.Handle}`}
          className="block shrink-0"
        >
          <figure className="relative w-[180px] aspect-square bg-gray-50 overflow-hidden">
            <ProductCardCarousel
              images={galleryImages}
              alt={product.Title}
              sizes="180px"
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
                      width={48}
                      height={48}
                      alt="Gluten Free"
                      className="h-6 w-auto"
                    />
                  </span>
                </Tooltip>
              )}
              {product?.Metadata?.Cooked ? (
                <Tooltip content="Ready to Eat" className="bg-Charcoal text-white">
                  <span className="inline-flex items-center cursor-default">
                    <Image
                      src="/images/icons/ready-to-eat.png"
                      width={347}
                      height={126}
                      alt="Ready to Eat"
                      className="h-5 w-auto"
                    />
                  </span>
                </Tooltip>
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

        </div>

        {/* Col 3: Price & Actions */}
        <div className="flex flex-col items-end justify-between py-1 h-full self-stretch">
          <div className="flex flex-col items-end gap-1 whitespace-nowrap">
            {price && (
              <p className="text-Charcoal">
                <FormattedPrice
                  value={`$${Number(price).toFixed(2)}`}
                  className="text-h4 font-gyst"
                />{" "}
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
    <article className="grid grid-rows-subgrid row-span-6 gap-y-0 pb-8">
      <LocalizedClientLink
        href={`/products/${product?.MedusaProduct?.Handle}`}
        className="block"
      >
        <figure className="relative w-full bg-gray-50 overflow-hidden">
          <div aria-hidden className="block pb-[100%]" />
          <div className="absolute inset-0">
            <ProductCardCarousel
              images={galleryImages}
              alt={product.Title}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </div>
        </figure>
      </LocalizedClientLink>

      {/* Row 2: Price (left) + SKU (right) */}
      <div className="mt-6 flex items-baseline justify-between gap-3">
        {price ? (
          <p className="text-Charcoal leading-none">
            <FormattedPrice
              value={`$${Number(price).toFixed(2)}`}
              className="text-h4 font-gyst"
            />{" "}
            <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-1">
              per lb
            </span>
          </p>
        ) : <span />}
      </div>

      {/* Row 3: Title — line-clamp-3 caps at 3 lines, and useTitleAlignToTrack
         pads shorter titles to match the actual title-row track height so all
         cards in the same row have aligned title blocks. */}
      <LocalizedClientLink
        href={`/products/${product?.MedusaProduct?.Handle}`}
        className="block mt-3"
      >
        <h2
          data-card-title
          className="text-h4 font-gyst font-bold text-Charcoal hover:text-VibrantRed transition-colors sm:line-clamp-3 pr-6 text-balance"
        >
          {product.Title}
        </h2>
      </LocalizedClientLink>

      {/* Row 4: Icons — below the title */}
      <TooltipProvider delayDuration={100}>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-maison-neue-mono uppercase text-gray-500 justify-start">
          {product?.Metadata?.GlutenFree && (
            <Tooltip content="Gluten Free" className="bg-Charcoal text-white">
              <span className="inline-flex items-center cursor-default">
                <Image
                  src="/images/icons/gluten-free.png"
                  width={48}
                  height={48}
                  alt="Gluten Free"
                  className="h-6 w-auto"
                />
              </span>
            </Tooltip>
          )}
          {product?.Metadata?.Cooked ? (
            <Tooltip content="Ready to Eat" className="bg-Charcoal text-white">
              <span className="inline-flex items-center cursor-default">
                <Image
                  src="/images/icons/ready-to-eat.png"
                  width={347}
                  height={126}
                  alt="Ready to Eat"
                  className="h-5 w-auto"
                />
              </span>
            </Tooltip>
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

      {/* Row 5: Short Description (always rendered to keep subgrid alignment) */}
      <p className="text-sm font-maison-neue text-gray-500 leading-snug sm:line-clamp-3 mt-3 text-balance">
        {product?.MedusaProduct?.ShortDescription ?? ""}
      </p>

      {/* Row 6: Actions */}
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
            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-0"
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
