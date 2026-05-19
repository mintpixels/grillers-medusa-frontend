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

export default function ReorderRow({
  history,
  strapiMap,
  firstName,
  countryCode,
  maxCards = 6,
}: ReorderRowProps) {
  if (!history?.length) return null

  // Deduplicate by current product when possible. Legacy-only items may not
  // have a current product yet, but should still direct customers to reorder.
  const seen = new Set<string>()
  const cards: Array<{
    key: string
    item: PurchaseHistoryItem
    strapi?: StrapiCollectionProduct
  }> = []
  for (const item of history) {
    const key = item.productId ? `product:${item.productId}` : itemKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    cards.push({
      key,
      item,
      strapi: item.productId ? strapiMap[item.productId] : undefined,
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
      className="bg-Scroll py-12 md:py-20"
    >
      <div className="content-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Gold mb-3">
              {greeting}
            </p>
            <h2
              id="reorder-row-heading"
              className="text-h2-mobile md:text-h2 font-gyst text-Charcoal"
            >
              Reorder your favorites
            </h2>
            <p className="text-p-md font-maison-neue text-Charcoal/70 mt-3 max-w-prose">
              The cuts you've ordered before, ready to add or request again.
            </p>
          </div>
          <LocalizedClientLink
            href="/account/reorder"
            className="self-start md:self-end inline-flex items-center gap-2 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal hover:text-Gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
          role="list"
        >
          {cards.map(({ key, item, strapi }) => {
            const handle = strapi?.MedusaProduct?.Handle
            const title =
              strapi?.Title || item.productTitle || item.title
            const image =
              strapi?.FeaturedImage?.url ||
              item.thumbnail ||
              undefined
            const lastOrdered = lastOrderedLabel(item.lastOrderedAt)
            const href = handle ? `/products/${handle}` : "/account/reorder"
            return (
              <li key={key}>
                <LocalizedClientLink
                  href={href}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded-sm"
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-white border border-Charcoal/10">
                    {image ? (
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-Charcoal/30 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
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
    </section>
  )
}
