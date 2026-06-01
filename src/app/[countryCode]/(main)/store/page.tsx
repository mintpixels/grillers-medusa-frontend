import { Metadata } from "next"

import { generateAlternates } from "@lib/util/seo"
import { getBaseURL } from "@lib/util/env"
import { hitToProduct } from "@lib/algolia/hit-to-product"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { enrichProductsWithIngredientDisclosures } from "@lib/data/strapi/ingredient-disclosures"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import { withTimeout } from "@lib/util/promise-timeout"
import {
  ALGOLIA_COLLECTION_PRODUCT_ATTRIBUTES,
  compactCollectionProducts,
} from "@lib/util/collection-product"
import CollectionTemplate from "@modules/collections/templates"
import ExperimentExposure from "@lib/experiments/exposure"
import { getExperimentAssignment } from "@lib/experiments/server"
import { itemListJsonLd, webPageJsonLd } from "@lib/util/structured-data"

type Params = {
  params: Promise<{ countryCode: string }>
}

export function generateStaticParams() {
  return [{ countryCode: "us" }]
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { countryCode } = await params
  const alternates = await generateAlternates("/store", countryCode)

  return {
    title: "Shop All Products | Grillers Pride",
    description:
      "Browse our full kosher catalog: beef, poultry, lamb, veal, prepared and provisions. Filter by cooking state, sourcing, and certification.",
    alternates,
  }
}

/**
 * /us/store browse. Previously paginated 767 products from Strapi GraphQL
 * on every render and reliably hit Vercel's function timeout → 504 (#120).
 *
 * Now fetches the full catalog from Algolia (the same index that powers
 * /us/search) in a single round trip, then hands off to the existing
 * `CollectionTemplate` for filter / sort / view-toggle / pagination /
 * mobile drawer. SSR'd HTML includes all product links so crawlers and
 * social previews see the full grid; client-side state (selected filters,
 * pagination, etc.) hydrates over it.
 *
 * Pricing is enriched from Medusa before the page renders — Algolia is a
 * Strapi snapshot, not a price-of-truth, and `enrichStrapiProductsWithMedusaPrices`
 * already batches the IDs into one Medusa call.
 */
async function browseAlgoliaCatalog(): Promise<StrapiCollectionProduct[]> {
  const appId = process.env.ALGOLIA_APPLICATION_ID
  const searchKey = process.env.ALGOLIA_SEARCH_API_KEY
  if (!appId || !searchKey) return []

  try {
    const res = await fetch(
      `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(
        PRODUCT_INDEX
      )}/query`,
      {
        method: "POST",
        headers: {
          "X-Algolia-API-Key": searchKey,
          "X-Algolia-Application-Id": appId,
          "Content-Type": "application/json",
        },
        // Empty `query` browses the index. 1000 is Algolia's per-request
        // cap and is well above the current catalog (~400-500 records).
        // If/when the catalog crosses that, swap to a paginated browse.
        body: JSON.stringify({
          query: "",
          hitsPerPage: 1000,
          attributesToRetrieve: ALGOLIA_COLLECTION_PRODUCT_ATTRIBUTES,
        }),
        // ISR: catalog doesn't change in real-time, so cache the Algolia
        // response for 5 min. Medusa prices are re-enriched on each render
        // by the helper below, which has its own Next.js Data Cache layer.
        next: { revalidate: 300, tags: ["strapi"] },
      }
    )
    if (!res.ok) return []
    const data = (await res.json()) as { hits?: unknown[] }
    if (!Array.isArray(data.hits)) return []
    // hitToProduct returns null for stub hits the upstream plugin writes
    // when its transformer returns null/async (#115). Drop them so the
    // grid doesn't render ghost cards.
    return data.hits
      .map((h: unknown) => hitToProduct(h))
      .filter((p): p is StrapiCollectionProduct => p !== null)
  } catch {
    return []
  }
}

export default async function StorePage(props: Params) {
  const { countryCode } = await props.params

  const rawProducts = await browseAlgoliaCatalog()
  // Cards collapse without an image, so require FeaturedImage at minimum
  // (matches the prior Strapi-fetched implementation's filter).
  const visibleProducts = rawProducts.filter((p) => p.FeaturedImage?.url)
  const products = await withTimeout(
    enrichStrapiProductsWithMedusaPrices(visibleProducts, countryCode).catch(
      () => visibleProducts
    ),
    1200,
    visibleProducts,
    "store Medusa price enrichment"
  )
  const productsWithDisclosures = await withTimeout(
    enrichProductsWithIngredientDisclosures(products).catch(() => products),
    1200,
    products,
    "store Strapi ingredient disclosures"
  )
  const plpExperiment = await getExperimentAssignment("plp_merchandising_v1", {
    routeMarket: countryCode,
    customerType: "unknown",
  })
  const baseUrl = getBaseURL()
  const productListJsonLd = itemListJsonLd(
    baseUrl,
    countryCode,
    "All kosher products",
    productsWithDisclosures
      .filter((product) => product.MedusaProduct?.Handle)
      .slice(0, 48)
      .map((product) => ({
        type: "Product",
        name: product.Title,
        path: `/products/${product.MedusaProduct!.Handle}`,
        description:
          product.MedusaProduct?.ShortDescription ||
          product.MedusaProduct?.Description,
        image: product.FeaturedImage?.url,
      }))
  )
  const storeJsonLd = webPageJsonLd({
    baseUrl,
    countryCode,
    path: "/store",
    name: "Shop All Products",
    description:
      "Browse the Grillers Pride kosher catalog by product, cut, cooking state, sourcing, and certification.",
    type: "CollectionPage",
    breadcrumbs: [{ name: "Store", path: "/store" }],
    mainEntity: productListJsonLd,
    about: ["Kosher meat", "Frozen delivery", "Local pickup"],
  })

  return (
    <>
      <ExperimentExposure assignment={plpExperiment} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <CollectionTemplate
        title="All Products"
        slug="store"
        countryCode={countryCode}
        products={compactCollectionProducts(productsWithDisclosures)}
      />
    </>
  )
}
