import { Metadata } from "next"
import { notFound } from "next/navigation"

import strapiClient from "@lib/strapi"
import { GetPaginatedRecipesQuery } from "@lib/data/strapi/recipes"
import RecipesCollection from "@modules/recipes/templates/recipes-collection"

type PageProps = {
  params: { countryCode: string }
  searchParams: { page?: string }
}

export const metadata: Metadata = {
  title: "Recipes",
  description: "Browse our collection of delicious recipes",
}

const DEFAULT_PAGE_SIZE = 9

export default async function RecipesPage({
  params: { countryCode },
  searchParams,
}: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10))
  const pageSize = DEFAULT_PAGE_SIZE

  const { recipes_connection } = await strapiClient.request(
    GetPaginatedRecipesQuery,
    { page, pageSize }
  )

  if (!recipes_connection) {
    return notFound()
  }

  const { nodes: recipes, pageInfo } = recipes_connection

  return (
    <RecipesCollection
      recipes={recipes}
      page={page}
      pageInfo={pageInfo}
      countryCode={countryCode}
    />
  )
}

export const dynamic = "force-dynamic"
