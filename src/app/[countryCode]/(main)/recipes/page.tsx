import { Metadata } from "next"
import { notFound } from "next/navigation"

import strapiClient from "@lib/strapi"
import { 
  GetPaginatedRecipesQuery, 
  GetFilteredRecipesQuery,
  GetRecipeFilterOptionsQuery,
} from "@lib/data/strapi/recipes"
import RecipesCollection from "@modules/recipes/templates/recipes-collection"
import { extractFilterOptions, buildStrapiFilters } from "@modules/recipes/components/recipe-filters"
import { generateAlternates } from "@lib/util/seo"

type PageProps = {
  params: { countryCode: string }
  searchParams: { 
    page?: string
    category?: string
    method?: string
    difficulty?: string
    dietary?: string
    q?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const alternates = await generateAlternates("/recipes", params.countryCode)

  return {
    title: "Recipes | Grillers Pride",
    description:
      "Discover delicious kosher recipes from Grillers Pride. Expert cooking tips and recipes for premium kosher meats, perfect for Shabbat dinners and Jewish holidays.",
    alternates,
    openGraph: {
      title: "Recipes | Grillers Pride",
      description:
        "Discover delicious kosher recipes from Grillers Pride. Expert cooking tips for premium kosher meats.",
      type: "website",
      url: `${baseUrl}/recipes`,
      siteName: "Grillers Pride",
    },
    twitter: {
      card: "summary_large_image",
      title: "Recipes | Grillers Pride",
      description:
        "Discover delicious kosher recipes from Grillers Pride. Expert cooking tips for premium kosher meats.",
    },
  }
}

const DEFAULT_PAGE_SIZE = 9

export default async function RecipesPage({
  params: { countryCode },
  searchParams,
}: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10))
  const pageSize = DEFAULT_PAGE_SIZE

  // Extract filter params
  const filterParams = {
    category: searchParams.category,
    method: searchParams.method,
    difficulty: searchParams.difficulty,
    dietary: searchParams.dietary,
    search: searchParams.q,
  }

  const hasFilters = Object.values(filterParams).some(Boolean)

  // Build Strapi filters if any filters are active
  const strapiFilters = hasFilters ? buildStrapiFilters(filterParams) : undefined

  // Fetch recipes with or without filters
  let recipes_connection
  if (strapiFilters) {
    const result = await strapiClient.request(
      GetFilteredRecipesQuery,
      { page, pageSize, filters: strapiFilters }
    )
    recipes_connection = result.recipes_connection
  } else {
    const result = await strapiClient.request(
      GetPaginatedRecipesQuery,
      { page, pageSize }
    )
    recipes_connection = result.recipes_connection
  }

  // Fetch all recipes to extract filter options (only unique values)
  const { recipes: allRecipes } = await strapiClient.request(
    GetRecipeFilterOptionsQuery
  )
  const filterOptions = extractFilterOptions(allRecipes || [])

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
      filterOptions={filterOptions}
      currentFilters={filterParams}
    />
  )
}

export const dynamic = "force-dynamic"
