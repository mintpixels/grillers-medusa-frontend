import { Metadata } from "next"
import { notFound } from "next/navigation"

import strapiClient from "@lib/strapi"
import { GetRecipeBySlugQuery } from "@lib/data/strapi/recipes"
import RecipeTemplate from "@modules/recipes/templates/recipe-detail"

type PageProps = {
  params: {
    countryCode: string
    handle: string
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = params

  try {
    const response = await strapiClient.request(GetRecipeBySlugQuery, {
      slug: handle,
    })
    const record = response?.recipes?.[0]

    if (!record) {
      return { title: "Recipe Not Found" }
    }

    const { Title, ShortDescription } = record.attributes
    const imageUrl = record.attributes.Image?.data?.attributes?.url

    return {
      title: Title,
      description: ShortDescription,
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
  const { handle } = params
  const response = await strapiClient.request(GetRecipeBySlugQuery, {
    slug: handle,
  })
  const record = response?.recipes?.[0]

  if (!record) {
    notFound()
  }

  return <RecipeTemplate recipe={record} />
}

export const dynamic = "force-dynamic"
