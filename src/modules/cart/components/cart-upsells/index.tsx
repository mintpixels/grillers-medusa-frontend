"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { trackSelectItem } from "@lib/gtm"
import { jitsuTrack } from "@lib/jitsu"

type CartUpsell = {
  id: string
  title: string
  handle: string
  image: string
  price?: number
}

const CART_UPSELLS: CartUpsell[] = [
  {
    id: "prod_01KC9RFN8D0E194R1KETKZ26CN",
    title: "Kosher Chicken Drumettes & Wingettes",
    handle:
      "chicken-wings-david-elliot-chk-supervision-vacuum-packed-17-lb-kosher-for-passover-328lb",
    image:
      "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_01_12_1_primary_9143d2bfb5.jpg",
    price: 5.58,
  },
  {
    id: "prod_01KC9RFAPPJ29C9BJXBMMK9E7S",
    title: "Kosher First Cut Hand-Trimmed Lamb Chops",
    handle:
      "first-cut-lamb-chops-hand-trimmed-4-chops-uncooked-kosher-for-passover",
    image:
      "https://helpful-nature-fab70f9c51.media.strapiapp.com/3_01_12_1_primary_c58f64bb16.jpg",
    price: 101.95,
  },
  {
    id: "prod_01KC9RH2JQY5YYFAQ3A4TBX248",
    title: "Kosher Ground Dark Turkey Meat",
    handle:
      "ground-turkey-dark-meat-vacuum-packed-antibiotic-free-hormone-free-1-lb-uncooked-not-kosher-for-passover",
    image:
      "https://helpful-nature-fab70f9c51.media.strapiapp.com/7_61_15_1_primary_cd2f48c347.jpg",
    price: 12.3,
  },
]

type CartUpsellsProps = {
  surface: "cart_page" | "side_cart"
  compact?: boolean
  excludeProductIds?: Array<string | null | undefined>
  className?: string
}

export default function CartUpsells({
  surface,
  compact = false,
  excludeProductIds = [],
  className = "",
}: CartUpsellsProps) {
  const excluded = new Set(excludeProductIds.filter(Boolean))
  const products = CART_UPSELLS.filter((product) => !excluded.has(product.id))
    .slice(0, compact ? 2 : 3)

  if (!products.length) return null

  const listId = `cart_upsells_${surface}`
  const listName = surface === "side_cart" ? "Side Cart Upsells" : "Cart Page Upsells"

  const handleClick = (product: CartUpsell, index: number) => {
    trackSelectItem({
      listId,
      listName,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        position: index,
      },
    })
    jitsuTrack("cart_upsell_clicked", {
      surface,
      product_id: product.id,
      product_name: product.title,
      product_handle: product.handle,
      position: index,
    })
  }

  return (
    <section className={className} aria-label="Recommended additions">
      <div className={compact ? "mb-2" : "mb-4"}>
        <h2 className="text-sm font-maison-neue-mono uppercase tracking-wider text-Charcoal/60">
          Add to your order
        </h2>
      </div>
      <div className={compact ? "space-y-2" : "grid grid-cols-1 small:grid-cols-3 gap-3"}>
        {products.map((product, index) => (
          <LocalizedClientLink
            key={product.id}
            href={`/products/${product.handle}`}
            onClick={() => handleClick(product, index)}
            className={
              compact
                ? "min-h-[72px] flex items-center gap-3 rounded-lg border border-Charcoal/10 bg-white p-2 hover:border-Gold/70 transition-colors"
                : "block min-h-[44px] rounded-lg border border-Charcoal/10 bg-white p-3 hover:border-Gold/70 transition-colors"
            }
          >
            <div
              className={
                compact
                  ? "relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-50"
                  : "relative aspect-square w-full overflow-hidden rounded-md bg-gray-50"
              }
            >
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes={compact ? "56px" : "(max-width: 768px) 100vw, 180px"}
                className="object-cover"
              />
            </div>
            <div className={compact ? "min-w-0 flex-1" : "mt-3"}>
              <p className="text-sm font-maison-neue font-semibold text-Charcoal leading-snug line-clamp-2">
                {product.title}
              </p>
              {product.price != null && (
                <p className="mt-1 text-xs font-maison-neue text-Charcoal/55">
                  From ${product.price.toFixed(2)}
                </p>
              )}
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
