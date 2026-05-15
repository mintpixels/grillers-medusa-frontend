import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddBundleButton from "./add-bundle-button"
import { sanitizeProductCopy } from "@lib/util/product-claims"
import {
  formatProductPriceDisplay,
  type PriceDisplay,
} from "@lib/util/price-display"
import {
  getCollectionProducts,
  getCuratedCollections,
  type CuratedCollection,
} from "@lib/data/strapi/curated-collections"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import type { HttpTypes } from "@medusajs/types"

function productPriceDisplay(
  product: StrapiCollectionProduct
): PriceDisplay | null {
  const variant = product.MedusaProduct?.Variants?.[0]
  const price = variant?.Price?.CalculatedPriceNumber
  if (typeof price !== "number") return null
  return formatProductPriceDisplay(
    price,
    product.Metadata,
    variant?.Sku,
    (
      product.MedusaProduct as
        | { PricingMode?: "per_lb" | "fixed_price" }
        | undefined
    )?.PricingMode
  )
}

function lineTotal(product: StrapiCollectionProduct, quantity: number): number {
  return (productPriceDisplay(product)?.estimatedPackPrice ?? 0) * quantity
}

function normalize(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function currentProductText(
  product: HttpTypes.StoreProduct,
  strapiProductData?: any
) {
  const tags =
    strapiProductData?.Categorization?.ProductTags?.map((tag: any) => tag.Name) ||
    []
  return normalize(
    [
      product.title,
      product.handle,
      product.description,
      strapiProductData?.Title,
      strapiProductData?.MedusaProduct?.Description,
      ...tags,
    ].join(" ")
  )
}

function scoreCollection(collection: CuratedCollection, currentText: string) {
  let score = collection.IsFeatured ? 8 : 0
  score += Math.max(0, 200 - (collection.SortOrder || 100)) / 100

  for (const keyword of collection.PdpMatchKeywords || []) {
    if (currentText.includes(normalize(keyword))) score += 10
  }

  for (const rule of collection.RecommendationRules || []) {
    if (rule.Surface !== "pdp") continue
    for (const keyword of rule.MatchKeywords || []) {
      if (currentText.includes(normalize(keyword))) score += 6
    }
    score += Math.max(0, 200 - (rule.Priority || 100)) / 200
  }

  return score
}

function prepareCollections(
  collections: CuratedCollection[],
  product: HttpTypes.StoreProduct,
  strapiProductData?: any
) {
  const currentHandle = product.handle || ""
  const currentText = currentProductText(product, strapiProductData)

  return collections
    .map((collection) => {
      const products = getCollectionProducts(collection).filter(
        ({ Product }) => Product.MedusaProduct?.Handle !== currentHandle
      )
      return {
        ...collection,
        products,
        score: scoreCollection(collection, currentText),
      }
    })
    .filter((collection) => collection.products.length >= 2)
    .sort((a, b) => b.score - a.score || (a.SortOrder || 999) - (b.SortOrder || 999))
    .slice(0, 3)
}

export default async function PairsWellWith({
  product,
  countryCode,
  strapiProductData,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
  strapiProductData?: any
}) {
  const curatedCollections = await getCuratedCollections({
    countryCode,
    surface: "pdp",
    customerState: "all",
    limit: 50,
  })
  const collections = prepareCollections(
    curatedCollections,
    product,
    strapiProductData
  )

  if (collections.length === 0) return null

  return (
    <section className="bg-Scroll py-12 md:py-16">
      <div className="content-container">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
              Complete the cart
            </p>
            <h2 className="mt-2 font-gyst text-h3 font-bold leading-tight text-Charcoal">
              Pairs well with this order
            </h2>
          </div>
          <p className="max-w-xl font-maison-neue text-p-md leading-relaxed text-Charcoal/70">
            Curated collections for the way customers actually cook: Shabbos,
            weeknights, grilling, holidays, and first orders.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {collections.map((collection) => {
            const items = collection.products
              .map(({ Product, Quantity }) => ({
                variantId:
                  Product.MedusaProduct?.Variants?.[0]?.VariantId || "",
                title: Product.Title,
                quantity: Quantity,
              }))
              .filter((item) => item.variantId)
            const total = collection.products.reduce(
              (sum, item) => sum + lineTotal(item.Product, item.Quantity),
              0
            )

            return (
              <article
                key={collection.documentId}
                className="flex min-w-0 flex-col rounded-[5px] border border-Charcoal/10 bg-white"
              >
                <div className="border-b border-Charcoal/10 p-5">
                  <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
                    {collection.Eyebrow || collection.Occasion.replace(/_/g, " ")}
                  </p>
                  <h3 className="mt-2 font-gyst text-h4 font-bold leading-tight text-Charcoal">
                    {collection.Name}
                  </h3>
                  <p className="mt-2 font-maison-neue text-sm leading-relaxed text-Charcoal/70">
                    {collection.ShortDescription}
                  </p>
                  <LocalizedClientLink
                    href={`/collections/${collection.Slug}`}
                    className="mt-3 inline-flex font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal underline underline-offset-4"
                  >
                    View collection
                  </LocalizedClientLink>
                </div>

                <div className="flex flex-1 flex-col divide-y divide-Charcoal/10">
                  {collection.products.slice(0, 5).map(({ Product: item, Quantity }) => {
                    const imageUrl = item.FeaturedImage?.url
                    const price = productPriceDisplay(item)
                    const description = sanitizeProductCopy(
                      item.MedusaProduct?.ShortDescription,
                      {
                        handle: item.MedusaProduct?.Handle,
                        title: item.Title,
                      }
                    )

                    return (
                      <LocalizedClientLink
                        key={item.documentId}
                        href={`/products/${item.MedusaProduct?.Handle}`}
                        className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 p-4 transition-colors hover:bg-Scroll"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-[5px] bg-gray-100">
                          {imageUrl && (
                            <Image
                              src={imageUrl}
                              alt={item.Title}
                              fill
                              sizes="72px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start gap-2">
                            {Quantity > 1 && (
                              <span className="mt-0.5 shrink-0 rounded-full bg-Gold/20 px-2 py-0.5 font-maison-neue-mono text-[10px] font-bold uppercase text-Charcoal">
                                {Quantity}x
                              </span>
                            )}
                            <p className="line-clamp-2 font-maison-neue text-sm font-semibold leading-snug text-Charcoal">
                              {item.Title}
                            </p>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {price && (
                              <span className="font-maison-neue-mono text-[11px] font-bold uppercase text-Charcoal/70">
                                {price.primary}
                                {price.primaryLabel && ` ${price.primaryLabel}`}
                              </span>
                            )}
                            {description && (
                              <span className="line-clamp-1 font-maison-neue text-xs text-Charcoal/50">
                                {description}
                              </span>
                            )}
                          </div>
                        </div>
                      </LocalizedClientLink>
                    )
                  })}
                </div>

                <div className="border-t border-Charcoal/10 p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="font-maison-neue text-sm text-Charcoal/60">
                      Estimated subtotal
                    </span>
                    <span className="font-gyst text-h4 leading-none text-Charcoal">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <AddBundleButton
                    items={items}
                    countryCode={countryCode}
                    bundleId={collection.documentId}
                    bundleTitle={collection.Name}
                    bundleSlug={collection.Slug}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
