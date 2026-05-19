import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { PurchaseHistoryItem } from "@lib/data/orders"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

type ReorderRowProps = {
  history: PurchaseHistoryItem[]
  strapiMap: Record<string, StrapiCollectionProduct>
  firstName?: string | null
  countryCode: string
  maxCards?: number
}

function weeksAgo(iso: string): number {
  const then = new Date(iso).getTime()
  const now = Date.now()
  if (Number.isNaN(then) || then > now) return 0
  return Math.floor((now - then) / (1000 * 60 * 60 * 24 * 7))
}

function lastOrderedLabel(iso: string): string {
  const w = weeksAgo(iso)
  if (w <= 0) return "Last ordered this week"
  if (w === 1) return "Last ordered 1 week ago"
  if (w < 8) return `Last ordered ${w} weeks ago`
  const months = Math.round(w / 4.345)
  if (months === 1) return "Last ordered ~1 month ago"
  if (months < 12) return `Last ordered ~${months} months ago`
  const years = Math.round(months / 12)
  return years === 1 ? "Last ordered ~1 year ago" : `Last ordered ~${years} years ago`
}

function itemKey(item: PurchaseHistoryItem): string {
  return (
    item.key ||
    item.variantId ||
    item.productId ||
    item.legacyItemId ||
    item.sku ||
    `${item.title}-${item.lastOrderedAt}`
  )
}

function normalizedSku(value?: string | null) {
  return value?.trim().toLowerCase() || ""
}

function strapiProductForHistory(
  item: PurchaseHistoryItem,
  strapiMap: Record<string, StrapiCollectionProduct>
) {
  return (
    (item.productId ? strapiMap[item.productId] : undefined) ||
    (item.variantId ? strapiMap[item.variantId] : undefined) ||
    (item.sku ? strapiMap[normalizedSku(item.sku)] : undefined)
  )
}

function isRenderableCatalogProduct(
  product?: StrapiCollectionProduct
): product is StrapiCollectionProduct {
  return Boolean(
    product?.MedusaProduct?.Handle &&
      product.MedusaProduct.Variants?.some((variant) => variant.VariantId)
  )
}

function catalogProductKey(
  item: PurchaseHistoryItem,
  product: StrapiCollectionProduct
) {
  return (
    product.documentId ||
    product.MedusaProduct?.ProductId ||
    product.MedusaProduct?.Handle ||
    itemKey(item)
  )
}

function catalogProductTitle(product: StrapiCollectionProduct) {
  return product.Title || product.MedusaProduct?.Handle || "Product"
}

export default function ReorderRow({
  history,
  strapiMap,
  firstName,
  countryCode,
  maxCards = 6,
}: ReorderRowProps) {
  if (!history?.length) return null

  const seen = new Set<string>()
  const cards: Array<{
    key: string
    item: PurchaseHistoryItem
    strapi: StrapiCollectionProduct
  }> = []
  for (const item of history) {
    const strapi = strapiProductForHistory(item, strapiMap)
    if (!isRenderableCatalogProduct(strapi)) continue

    const key = catalogProductKey(item, strapi)
    if (seen.has(key)) continue
    seen.add(key)
    cards.push({
      key,
      item,
      strapi,
    })
    if (cards.length >= maxCards) break
  }

  if (cards.length === 0) return null

  const greeting = firstName
    ? `Welcome back, ${firstName}`
    : "Welcome back"

  return (
    <section
      aria-labelledby="reorder-row-heading"
      className="bg-White py-10 md:py-14 border-y border-Charcoal/15"
    >
      <div className="content-container">
        <div className="grid gap-8 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] lg:items-start">
          <div className="max-w-[360px]">
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Gold mb-3">
              {greeting}
            </p>
            <h2
              id="reorder-row-heading"
              className="text-h2-mobile md:text-h3 font-gyst text-Charcoal"
            >
              Reorder your favorites
            </h2>
            <p className="text-p-md font-maison-neue text-Charcoal/70 mt-3">
              The cuts you've ordered before, ready to add or request again.
            </p>
            <LocalizedClientLink
              href="/account/reorder"
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal hover:text-Gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
            >
              See full reorder list
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 1l5 5-5 5M15 6H0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </LocalizedClientLink>
          </div>

          <ul
            className="grid grid-cols-2 gap-4 border-t border-Charcoal/15 pt-5 md:grid-cols-3 lg:grid-cols-6 lg:border-t-0 lg:pt-0"
            role="list"
          >
            {cards.map(({ key, item, strapi }) => {
              const handle = strapi.MedusaProduct?.Handle
              const title = catalogProductTitle(strapi)
              const image =
                strapi.FeaturedImage?.url || item.thumbnail || undefined
              const lastOrdered = lastOrderedLabel(item.lastOrderedAt)
              const href = `/products/${handle}`
              return (
                <li key={key}>
                  <LocalizedClientLink
                    href={href}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded-sm"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-Scroll border border-Charcoal/10">
                      {image ? (
                        <Image
                          src={image}
                          alt={title}
                          fill
                          sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-Charcoal/30 text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="mt-3 border-t border-Charcoal/15 pt-3">
                      <p className="text-p-sm font-maison-neue font-semibold text-Charcoal line-clamp-2 group-hover:text-Gold transition-colors">
                        {title}
                      </p>
                      <p className="text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/50 mt-1">
                        {lastOrdered}
                      </p>
                    </div>
                  </LocalizedClientLink>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
