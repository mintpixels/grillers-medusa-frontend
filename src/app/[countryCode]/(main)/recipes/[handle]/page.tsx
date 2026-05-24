import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import strapiClient from "@lib/strapi"
import {
  GetRecipeBySlugQuery,
  generateRecipeJsonLd,
  type RecipeData,
} from "@lib/data/strapi/recipes"
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

  // Check authentication and favorite status
  const isLoggedIn = !!customer
  const isFavorited = isLoggedIn ? await isRecipeFavorited(handle) : false

  // Generate Recipe JSON-LD for SEO
  const baseUrl = getBaseURL()
  const recipeJsonLd = generateRecipeJsonLd(record, baseUrl, countryCode)

  return (
    <>
      {/* Recipe JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
      />
      <RecipeTemplate
        recipe={record}
        countryCode={countryCode}
        isLoggedIn={isLoggedIn}
        isFavorited={isFavorited}
      />
    </>
  )
}

export const dynamic = "force-dynamic"
