import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddBundleButton from "@modules/products/components/pairs-well-with/add-bundle-button"
import CuratedCollectionItems from "@modules/collections/components/curated-collection-items"
import {
  getCollectionProducts,
  type CuratedCollection,
} from "@lib/data/strapi/curated-collections"
import {
  collectionEstimatedSubtotals,
  getCollectionSubstitutionGuardrails,
  lineCartMetadata,
} from "@lib/util/collection-substitutions"

type CollectionsHubProps = {
  collections: CuratedCollection[]
  countryCode: string
}

const occasionLabels: Record<string, string> = {
  starter: "First orders",
  shabbos: "Shabbos",
  weeknight: "Weeknight",
  holiday: "Holidays",
  grilling: "Grill",
  premium: "Premium",
  heritage: "Heritage",
  prepared: "Prepared",
  stock_up: "Stock up",
  cart_upsell: "Cart builders",
  other: "More paths",
}

function formatOccasion(value?: string | null) {
  if (!value) return "More paths"
  return (
    occasionLabels[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

function sectionId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function imageForCollection(collection: CuratedCollection) {
  const products = getCollectionProducts(collection)
  return (
    collection.HeroImage?.url ||
    products.find((item) => item.Product.FeaturedImage?.url)?.Product
      .FeaturedImage?.url ||
    null
  )
}

function collectionGroups(collections: CuratedCollection[]) {
  const groups = new Map<string, CuratedCollection[]>()

  for (const collection of collections) {
    const label = formatOccasion(collection.Occasion)
    groups.set(label, [...(groups.get(label) || []), collection])
  }

  return Array.from(groups.entries())
}

function addItemsForCollection(collection: CuratedCollection) {
  return getCollectionProducts(collection)
    .map((collectionItem) => {
      const variant = collectionItem.Product.MedusaProduct?.Variants?.[0]
      return {
        variantId: variant?.VariantId || "",
        title: collectionItem.Product.Title,
        quantity: collectionItem.Quantity || 1,
        metadata: lineCartMetadata(collectionItem),
      }
    })
    .filter((item) => item.variantId)
}

function CollectionCard({
  collection,
  countryCode,
}: {
  collection: CuratedCollection
  countryCode: string
}) {
  const products = getCollectionProducts(collection)
  const { total, eligible, excluded } = collectionEstimatedSubtotals(products)
  const totalQuantity = products.reduce(
    (sum, item) => sum + (item.Quantity || 1),
    0
  )
  const imageUrl = imageForCollection(collection)
  const guardrails = getCollectionSubstitutionGuardrails(products)
  const disabledReason = guardrails.needsBusinessReview
    ? "Needs substitution review before purchase."
    : guardrails.requiresAcknowledgement
    ? "Review substitution details first."
    : undefined

  return (
    <article className="grid min-w-0 overflow-hidden rounded-[5px] border border-Charcoal/10 bg-white lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
      <LocalizedClientLink
        href={`/collections/${collection.Slug}`}
        className="group relative block min-h-[260px] bg-Scroll"
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={collection.HeroImageAlt || collection.Name}
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
              {collection.Eyebrow || formatOccasion(collection.Occasion)}
            </p>
            <LocalizedClientLink href={`/collections/${collection.Slug}`}>
              <h2 className="mt-2 font-gyst text-h3-mobile font-bold leading-tight text-Charcoal hover:text-VibrantRed md:text-h3">
                {collection.Name}
              </h2>
            </LocalizedClientLink>
          </div>
          <div className="rounded-full bg-Scroll px-3 py-1 text-right font-maison-neue-mono text-[10px] font-bold uppercase leading-tight tracking-wide text-Charcoal/60">
            {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
          </div>
        </div>

        <p className="mt-3 font-maison-neue text-sm leading-relaxed text-Charcoal/70">
          {collection.ShortDescription}
        </p>

        <div className="mt-5 grid gap-3 border-y border-Charcoal/10 py-4 sm:grid-cols-3">
          <div>
            <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
              Estimated subtotal
            </p>
            <p className="mt-1 font-gyst text-h4 leading-none text-Charcoal">
              ${total.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
              Eligible progress
            </p>
            <p className="mt-1 font-maison-neue text-sm font-semibold leading-tight text-Charcoal">
              ${eligible.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
              Excluded
            </p>
            <p className="mt-1 font-maison-neue text-sm font-semibold leading-tight text-Charcoal">
              {excluded > 0 ? `$${excluded.toFixed(2)}` : "$0.00"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal/45">
            What is inside
          </p>
          <CuratedCollectionItems
            collection={collection}
            countryCode={countryCode}
            className="mt-3"
            showDescriptions
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <AddBundleButton
            items={addItemsForCollection(collection)}
            countryCode={countryCode}
            bundleId={collection.documentId}
            bundleTitle={collection.Name}
            bundleSlug={collection.Slug}
            disabledReason={disabledReason}
            className="space-y-2"
            fullWidth
          />
          <LocalizedClientLink
            href={`/collections/${collection.Slug}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-Charcoal px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal hover:bg-Charcoal hover:text-white"
          >
            View details
          </LocalizedClientLink>
        </div>
      </div>
    </article>
  )
}

export default function CollectionsHub({
  collections,
  countryCode,
}: CollectionsHubProps) {
  const groups = collectionGroups(collections)

  return (
    <main className="bg-Scroll">
      <section className="content-container py-8 md:py-12">
        <div className="max-w-4xl">
          <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
            Shop collections
          </p>
          <h1 className="mt-3 font-gyst text-h1-mobile font-bold leading-none text-Charcoal md:text-h1">
            Build a cart around the way you actually cook.
          </h1>
          <p className="mt-4 max-w-2xl font-maison-neue text-p-lg leading-relaxed text-Charcoal/70">
            Curated kosher meat paths for first orders, family freezer stock,
            Shabbos tables, local delivery, and cold-chain shipping. Every
            collection shows the item-level price math before you add it.
          </p>
        </div>

        {groups.length > 0 && (
          <nav
            aria-label="Collection paths"
            className="mt-6 flex gap-2 overflow-x-auto pb-2"
          >
            <a
              href="#all-collections"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-Charcoal px-4 font-maison-neue text-sm font-semibold text-white"
            >
              All
            </a>
            {groups.map(([label]) => (
              <a
                key={label}
                href={`#${sectionId(label)}`}
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-Charcoal/15 bg-white px-4 font-maison-neue text-sm font-semibold text-Charcoal hover:border-Charcoal"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </section>

      <section
        id="all-collections"
        className="content-container border-t border-Charcoal/10 py-8 md:py-10"
      >
        <div className="mb-7 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-Gold">
              Browse paths
            </p>
            <h2 className="mt-2 font-maison-neue text-p-lg font-semibold leading-tight text-Charcoal">
              {collections.length} collections available.
            </h2>
          </div>
          <p className="font-maison-neue text-sm leading-relaxed text-Charcoal/60 md:max-w-sm md:text-right">
            Choose one as a complete cart, or open it to adjust item by item.
          </p>
        </div>

        {groups.length > 0 ? (
          <div className="space-y-12">
            {groups.map(([label, groupedCollections]) => (
              <div key={label} id={sectionId(label)} className="scroll-mt-24">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
                      {label}
                    </p>
                    <h3 className="mt-2 font-gyst text-h3-mobile font-bold leading-tight text-Charcoal md:text-h3">
                      {label} collections
                    </h3>
                  </div>
                  <a
                    href="#all-collections"
                    className="hidden font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal underline underline-offset-4 hover:text-VibrantRed sm:inline-flex"
                  >
                    Back to all
                  </a>
                </div>
                <div className="space-y-6">
                  {groupedCollections.map((collection) => (
                    <CollectionCard
                      key={collection.documentId || collection.Slug}
                      collection={collection}
                      countryCode={countryCode}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[5px] border border-Charcoal/10 bg-white p-6">
            <h2 className="font-gyst text-h3-mobile font-bold text-Charcoal md:text-h3">
              Collections are being restocked.
            </h2>
            <p className="mt-3 max-w-xl font-maison-neue text-sm leading-relaxed text-Charcoal/65">
              The curated collection feed is temporarily unavailable. You can
              still shop the butcher counter while this page refreshes.
            </p>
            <LocalizedClientLink
              href="/store"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-[5px] border border-Charcoal px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal hover:bg-Charcoal hover:text-white"
            >
              Shop all products
            </LocalizedClientLink>
          </div>
        )}
      </section>
    </main>
  )
}
