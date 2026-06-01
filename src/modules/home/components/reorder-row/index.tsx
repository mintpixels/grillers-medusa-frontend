"use client"

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

function latestHistoryDate(history: PurchaseHistoryItem[]) {
  return history
    .map((item) => new Date(item.lastOrderedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0]
}

function formatHistoryDate(date?: Date) {
  if (!date) return "On file"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function daysSince(date?: Date) {
  if (!date) return null

  return Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  )
}

export default function ReorderRow({
  history,
  strapiMap,
  firstName,
  countryCode,
  maxCards = 3,
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
    cards.push({ key, item, strapi })
    if (cards.length >= maxCards) break
  }

  const latest = latestHistoryDate(history)
  const lastOrderDays = daysSince(latest)
  const readyOnlineCount = seen.size
  const isLongGap = typeof lastOrderDays === "number" && lastOrderDays > 180
  const hasReadyItems = cards.length > 0

  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back"
  const heading = hasReadyItems
    ? isLongGap
      ? "Your order history is ready"
      : "Your usuals are ready"
    : "We found your past orders"
  const body = hasReadyItems
    ? "Start from items we recognize, then use the reorder hub to rebuild a useful cart from past orders."
    : "Your older purchases are saved in the reorder hub, where staff-assisted reorder can help match them to today's catalog."
  const historyStat = `${history.length} item${
    history.length === 1 ? "" : "s"
  } remembered`
  const recognizedStat = hasReadyItems
    ? `${readyOnlineCount} ready online`
    : "Staff-assisted"

  return (
    <section
      aria-labelledby="reorder-row-heading"
      className="border-y border-Charcoal/15 bg-White py-10 md:py-14"
    >
      <div className="content-container">
        <div className="grid gap-0 overflow-hidden rounded-lg border border-Charcoal/15 bg-SilverPlate/35 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="p-6 md:p-8">
            <p className="mb-3 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Gold">
              {greeting}
            </p>
            <h2
              id="reorder-row-heading"
              className="max-w-2xl text-h2-mobile font-gyst text-Charcoal md:text-h3"
            >
              {heading}
            </h2>
            <p className="mt-3 max-w-2xl text-p-md font-maison-neue leading-relaxed text-Charcoal/70">
              {body}
            </p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="border-t border-Charcoal/15 pt-3">
                <dt className="text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/45">
                  History
                </dt>
                <dd className="mt-1 text-p-md font-maison-neue font-semibold text-Charcoal">
                  {historyStat}
                </dd>
              </div>
              <div className="border-t border-Charcoal/15 pt-3">
                <dt className="text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/45">
                  Last order
                </dt>
                <dd className="mt-1 text-p-md font-maison-neue font-semibold text-Charcoal">
                  {formatHistoryDate(latest)}
                </dd>
              </div>
              <div className="border-t border-Charcoal/15 pt-3">
                <dt className="text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/45">
                  Restock
                </dt>
                <dd className="mt-1 text-p-md font-maison-neue font-semibold text-Charcoal">
                  {recognizedStat}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-col gap-3 xsmall:flex-row">
              <LocalizedClientLink
                href="/account/reorder?start=usuals"
                className="inline-flex min-h-[44px] items-center justify-center rounded-[5px] bg-Gold px-5 py-3 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
              >
                Build usual cart
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/account/reorder"
                className="inline-flex min-h-[44px] items-center justify-center rounded-[5px] border border-Charcoal px-5 py-3 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal transition-colors hover:bg-Charcoal hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
              >
                Open reorder hub
              </LocalizedClientLink>
            </div>
          </div>

          <div className="border-t border-Charcoal/15 bg-White/75 p-4 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-4">
              <p className="text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/50">
                Recognized from history
              </p>
              <LocalizedClientLink
                href="/account/reorder"
                className="text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal hover:text-Gold"
              >
                View all
              </LocalizedClientLink>
            </div>

            {hasReadyItems ? (
              <ul className="mt-4 space-y-3" role="list">
                {cards.map(({ key, strapi }) => {
                  const handle = strapi.MedusaProduct?.Handle
                  const title = catalogProductTitle(strapi)
                  const image = strapi.FeaturedImage?.url || undefined

                  return (
                    <li key={key}>
                      <LocalizedClientLink
                        href={`/products/${handle}`}
                        className="group grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-[5px] p-2 transition-colors hover:bg-SilverPlate/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
                      >
                        <div className="relative h-[72px] overflow-hidden rounded-[4px] bg-Scroll">
                          {image ? (
                            <Image
                              src={image}
                              alt={title}
                              fill
                              sizes="72px"
                              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/30">
                              GP
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 self-center">
                          <p className="line-clamp-2 text-p-sm font-maison-neue font-semibold leading-snug text-Charcoal group-hover:text-Gold">
                            {title}
                          </p>
                          <p className="mt-1 text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/45">
                            Previously ordered
                          </p>
                        </div>
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-[5px] border border-dashed border-Charcoal/20 p-5">
                <p className="text-p-sm font-maison-neue text-Charcoal/70">
                  Older purchases may need staff matching before they can be
                  reordered online.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
