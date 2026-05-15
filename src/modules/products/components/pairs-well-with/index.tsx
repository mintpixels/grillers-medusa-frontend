import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddBundleButton from "./add-bundle-button"
import strapiClient from "@lib/strapi"
import {
  getProductsByHandles,
  type StrapiCollectionProduct,
} from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { sanitizeProductCopy } from "@lib/util/product-claims"
import { formatProductPriceDisplay } from "@lib/util/price-display"
import type { HttpTypes } from "@medusajs/types"

type BundleDef = {
  id: string
  eyebrow: string
  title: string
  copy: string
  handles: string[]
}

const BUNDLES: BundleDef[] = [
  {
    id: "cholent",
    eyebrow: "For the pot",
    title: "Build a cholent basket",
    copy: "Hearty freezer staples that make the Thursday-night prep list shorter.",
    handles: [
      "kishke-16-oz-not-pareve-uncooked-not-kosher-for-passover",
      "1-lb-pack-ground-beef-8020-100-grass-fed-all-natural-no-hormones-no-antibiotics-uncooked-not-kosher-for-passover-1399pack",
      "beef-fat-1-lb-500lb",
      "boneless-shank-meat-ideal-for-cholent-or-soup-1-lb-american-angus-uncooked-kosher-for-passover-1249lb",
      "meaty-bones-for-soupstew-or-cholent-12-15-piecespack-2-lb-american-angus-uncooked-kosher-for-passover-699lb",
    ],
  },
  {
    id: "shabbos",
    eyebrow: "For Shabbos",
    title: "Stock the Shabbos table",
    copy: "Reliable mains and sides for a full table without a second shopping trip.",
    handles: [
      "organic-chicken-8-piece-cutup-3-lb-uncooked-kosher-for-passover-882lb",
      "8-piece-cutup-chicken-antibiotic-free-hormone-free-3-lb-uncooked-kosher-for-passover-vacuum-packed-kosher-for-passover-615lb",
      "chicken-wings-david-elliot-chk-supervision-vacuum-packed-17-lb-kosher-for-passover-328lb",
    ],
  },
  {
    id: "grill",
    eyebrow: "For the grill",
    title: "Fire up the grill",
    copy: "Crowd-friendly cuts and snacks that move from freezer to flame cleanly.",
    handles: [
      "grillers-pride-gourmet-beef-burger-patties-individually-packed-1x6-oz-uncooked-not-kosher-for-passover",
      "marinated-ribeye-steaks-boneless-rich-and-tangy-uncooked-8-oz-dry-weight-not-kosher-for-passover",
      "kosherbratz-classic-beef-and-lamb-grilling-sausages-no-nitrates-6-pcs-net-wt-24-oz-uncooked-not-kosher-for-passover",
    ],
  },
]

function productPrice(product: StrapiCollectionProduct): string {
  const variant = product.MedusaProduct?.Variants?.[0]
  const price = variant?.Price?.CalculatedPriceNumber
  if (typeof price !== "number") return ""
  return formatProductPriceDisplay(
    price,
    product.Metadata,
    variant?.Sku,
    (product.MedusaProduct as { PricingMode?: "per_lb" | "fixed_price" } | undefined)
      ?.PricingMode
  ).primary
}

function itemTotal(product: StrapiCollectionProduct): number {
  return product.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber ?? 0
}

function pickBundles(currentProduct: HttpTypes.StoreProduct): BundleDef[] {
  const title = `${currentProduct.title || ""} ${currentProduct.handle || ""}`.toLowerCase()
  if (title.includes("kishke") || title.includes("cholent")) {
    return BUNDLES
  }
  if (
    title.includes("ribeye") ||
    title.includes("steak") ||
    title.includes("boerie") ||
    title.includes("grill")
  ) {
    return [BUNDLES[2], BUNDLES[0], BUNDLES[1]]
  }
  if (title.includes("chicken") || title.includes("wing") || title.includes("cutup")) {
    return [BUNDLES[1], BUNDLES[0], BUNDLES[2]]
  }
  return BUNDLES
}

export default async function PairsWellWith({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  const orderedBundles = pickBundles(product)
  const handles = Array.from(new Set(orderedBundles.flatMap((b) => b.handles)))
  const fetched = await getProductsByHandles(handles, strapiClient)
  const enriched = await enrichStrapiProductsWithMedusaPrices(fetched, countryCode)
  const byHandle = new Map(
    enriched.map((item) => [item.MedusaProduct?.Handle || "", item])
  )

  const currentHandle = product.handle || ""
  const bundles = orderedBundles
    .map((bundle) => ({
      ...bundle,
      products: bundle.handles
        .map((handle) => byHandle.get(handle))
        .filter(
          (item): item is StrapiCollectionProduct =>
            !!item && item.MedusaProduct?.Handle !== currentHandle
        )
        .slice(0, 3),
    }))
    .filter((bundle) => bundle.products.length >= 2)
    .slice(0, 3)

  if (bundles.length === 0) return null

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
            Curated baskets for the way customers actually cook: cholent,
            Shabbos meals, and grilling.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {bundles.map((bundle) => {
            const items = bundle.products
              .map((item) => ({
                variantId: item.MedusaProduct?.Variants?.[0]?.VariantId || "",
                title: item.Title,
              }))
              .filter((item) => item.variantId)
            const total = bundle.products.reduce(
              (sum, item) => sum + itemTotal(item),
              0
            )

            return (
              <article
                key={bundle.id}
                className="flex min-w-0 flex-col rounded-[5px] border border-Charcoal/10 bg-white"
              >
                <div className="border-b border-Charcoal/10 p-5">
                  <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
                    {bundle.eyebrow}
                  </p>
                  <h3 className="mt-2 font-gyst text-h4 font-bold leading-tight text-Charcoal">
                    {bundle.title}
                  </h3>
                  <p className="mt-2 font-maison-neue text-sm leading-relaxed text-Charcoal/70">
                    {bundle.copy}
                  </p>
                </div>

                <div className="flex flex-1 flex-col divide-y divide-Charcoal/10">
                  {bundle.products.map((item) => {
                    const imageUrl = item.FeaturedImage?.url
                    const price = productPrice(item)
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
                          <p className="line-clamp-2 font-maison-neue text-sm font-semibold leading-snug text-Charcoal">
                            {item.Title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {price && (
                              <span className="font-maison-neue-mono text-[11px] font-bold uppercase text-Charcoal/70">
                                {price}
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
                      Bundle estimate
                    </span>
                    <span className="font-gyst text-h4 leading-none text-Charcoal">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <AddBundleButton
                    items={items}
                    countryCode={countryCode}
                    bundleId={bundle.id}
                    bundleTitle={bundle.title}
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
