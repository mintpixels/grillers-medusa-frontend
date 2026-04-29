import { Metadata } from "next"
import strapiClient from "@lib/strapi"

import {
  GetProductsWithImagesQuery,
  type StrapiCollectionProduct,
} from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import CollectionTemplate from "@modules/collections/templates"
import { generateAlternates } from "@lib/util/seo"

type Params = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { countryCode } = await params
  const alternates = await generateAlternates("/store", countryCode)

  return {
    title: "Shop All Products | Grillers Pride",
    description:
      "Browse our full kosher catalog — beef, poultry, lamb, veal, prepared and provisions. Filter by cooking state, sourcing, and certification.",
    alternates,
  }
}

const PAGE_SIZE = 100

async function getAllStoreProducts(): Promise<StrapiCollectionProduct[]> {
  const all: StrapiCollectionProduct[] = []
  let start = 0
  while (true) {
    const result = await strapiClient.request<{
      products: StrapiCollectionProduct[]
    }>(GetProductsWithImagesQuery, { limit: PAGE_SIZE, start })
    const batch = result.products || []
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }
  // Cards collapse without an image, so require FeaturedImage at minimum.
  return all.filter((p) => p.FeaturedImage?.url)
}

export default async function StorePage(props: Params) {
  const { countryCode } = await props.params

  const rawProducts = await getAllStoreProducts()
  const products = await enrichStrapiProductsWithMedusaPrices(
    rawProducts,
    countryCode
  )

  return (
    <CollectionTemplate
      title="All Products"
      slug="store"
      countryCode={countryCode}
      products={products}
    />
  )
}

export const dynamic = "force-dynamic"
