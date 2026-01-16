import { Metadata } from "next"
import { notFound } from "next/navigation"

import strapiClient from "@lib/strapi"
import { GetRecipeBySlugQuery } from "@lib/data/strapi/recipes"
import RecipeTemplate from "@modules/recipes/templates/recipe-detail"
import { generateAlternates } from "@lib/util/seo"
import { retrieveCustomer } from "@lib/data/customer"
import { isRecipeFavorited } from "@lib/data/favorites"

type PageProps = {
  params: Promise<{
    countryCode: string
    handle: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle, countryCode } = await params

  try {
    const response = await strapiClient.request(GetRecipeBySlugQuery, {
      slug: handle,
    })
    const record = response?.recipes?.[0]

    if (!record) {
      return { title: "Recipe Not Found" }
    }

    const { Title, ShortDescription } = record.attributes || record
    const imageUrl = record.attributes?.Image?.data?.attributes?.url || record.Image?.url

    const alternates = await generateAlternates(`/recipes/${handle}`, countryCode)

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
  const { handle } = await params
  const response = await strapiClient.request(GetRecipeBySlugQuery, {
    slug: handle,
  })
  const record = response?.recipes?.[0]

  if (!record) {
    notFound()
  }

  // Check authentication and favorite status
  const customer = await retrieveCustomer()
  const isLoggedIn = !!customer
  const isFavorited = isLoggedIn ? await isRecipeFavorited(handle) : false

  return (
    <RecipeTemplate 
      recipe={record}
      isLoggedIn={isLoggedIn}
      isFavorited={isFavorited}
    />
  )
}

export const dynamic = "force-dynamic"
