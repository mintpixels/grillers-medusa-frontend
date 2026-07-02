import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import strapiClient from "@lib/strapi"
import {
  GetRecipeBySlugQuery,
  generateRecipeJsonLd,
  type RecipeData,
} from "@lib/data/strapi/recipes"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { reportProductEnrichmentFailure } from "@lib/product-enrichment-ops-alerts"
import RecipeTemplate from "@modules/recipes/templates/recipe-detail"
import { generateAlternates } from "@lib/util/seo"
import { getBaseURL } from "@lib/util/env"
import { retrieveCustomer } from "@lib/data/customer"
import { isRecipeFavorited } from "@lib/data/favorites"

type PageProps = {
  params: Promise<{
    countryCode: string
    handle: string
  }>
}

type RecipeQueryResponse = {
  recipes: RecipeData[]
}

const getRecipeBySlugForPage = cache(async (slug: string) => {
  const response = await strapiClient.request<RecipeQueryResponse>(
    GetRecipeBySlugQuery,
    { slug }
  )

  return response?.recipes?.[0] || null
})

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle, countryCode } = await params

  try {
    const record = await getRecipeBySlugForPage(handle)

    if (!record) {
      return { title: "Recipe Not Found" }
    }

    const { Title, ShortDescription, Image } = record
    const imageUrl = Image?.url

    const alternates = await generateAlternates(
      `/recipes/${handle}`,
      countryCode
    )

    return {
      title: Title,
      description: ShortDescription,
      alternates,
      openGraph: {
        title: Title,
        description: ShortDescription,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return { title: "Recipe" }
  }
}

export default async function RecipePage({ params }: PageProps) {
  const { handle, countryCode } = await params
  const [record, customer] = await Promise.all([
    getRecipeBySlugForPage(handle),
    retrieveCustomer().catch(() => null),
  ])

  if (!record) {
    notFound()
  }

  // Strapi holds the recipe → product links, but Medusa is the source of truth
  // for live price AND inventory. Overlay live Medusa state onto the recipe's
  // linked products so the hero renders the current price and an accurate
  // in-stock hint (the Strapi query carries no inventory fields). Fail open to
  // the raw Strapi products on enrichment failure — the server-side ATP gate in
  // place-order is the authoritative oversell backstop.
  let relatedProducts = record.RelatedProducts ?? []
  if (relatedProducts.length > 0) {
    try {
      relatedProducts = await enrichStrapiProductsWithMedusaPrices(
        relatedProducts,
        countryCode
      )
    } catch (error) {
      reportProductEnrichmentFailure({
        stage: "medusa_price_inventory_chunk",
        countryCode,
        productCount: relatedProducts.length,
        chunkIndex: 0,
        chunkSize: relatedProducts.length,
        error,
      })
      // Fail open: the recipe hero should still render with raw Strapi products.
    }
  }
  const recipe: RecipeData = { ...record, RelatedProducts: relatedProducts }

  // Check authentication and favorite status
  const isLoggedIn = !!customer
  const isFavorited = isLoggedIn ? await isRecipeFavorited(handle) : false

  // Generate Recipe JSON-LD for SEO
  const baseUrl = getBaseURL()
  const recipeJsonLd = generateRecipeJsonLd(recipe, baseUrl, countryCode)

  return (
    <>
      {/* Recipe JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
      />
      <RecipeTemplate
        recipe={recipe}
        countryCode={countryCode}
        isLoggedIn={isLoggedIn}
        isFavorited={isFavorited}
      />
    </>
  )
}

export const dynamic = "force-dynamic"
