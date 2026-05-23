import { Metadata } from "next"
import { notFound } from "next/navigation"

import RecipesCollection from "@modules/recipes/templates/recipes-collection"
import { extractFilterOptions } from "@modules/recipes/lib/filter-helpers"
import recipeHubData from "@modules/recipes/data/recipe-bucket-audit.generated.json"
import {
  applyRecipeRuntimeFilters,
  sortRecipesForBucket,
} from "@modules/recipes/lib/recipe-taxonomy"
import { generateAlternates } from "@lib/util/seo"
import { getBaseURL } from "@lib/util/env"
import {
  getWaysToShopMission,
  isWaysToShopMissionId,
} from "@lib/content/ways-to-shop"

type PageProps = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{
    page?: string
    category?: string
    method?: string
    difficulty?: string
    dietary?: string
    q?: string
    bucket?: string
    mission?: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  const baseUrl = getBaseURL()
  const alternates = await generateAlternates("/recipes", countryCode)

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

async function getAllRecipeCards() {
  return recipeHubData.recipeCards || []
}

export default async function RecipesPage(props: PageProps) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const page = Math.max(1, parseInt(searchParams.page || "1", 10))
  const pageSize = DEFAULT_PAGE_SIZE
  const mission = isWaysToShopMissionId(searchParams.mission)
    ? getWaysToShopMission(searchParams.mission)
    : null
  const resolvedBucket = searchParams.bucket || mission?.recipeBucket

  // Extract filter params
  const filterParams = {
    category: searchParams.category,
    method: searchParams.method,
    difficulty: searchParams.difficulty,
    dietary: searchParams.dietary,
    search: searchParams.q,
    bucket: resolvedBucket,
    mission: mission?.id,
  }

  const hubRecipes = await getAllRecipeCards()

  if (!hubRecipes.length) {
    return notFound()
  }

  const filteredRecipes = sortRecipesForBucket(
    applyRecipeRuntimeFilters(hubRecipes, filterParams),
    filterParams.bucket
  )
  const total = filteredRecipes.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const recipes = filteredRecipes.slice((page - 1) * pageSize, page * pageSize)
  const pageInfo = {
    page,
    pageSize,
    pageCount,
    total,
  }
  const filterOptions = extractFilterOptions(hubRecipes)

  return (
    <RecipesCollection
      recipes={recipes}
      page={page}
      pageInfo={pageInfo}
      countryCode={countryCode}
      filterOptions={filterOptions}
      currentFilters={filterParams}
      hubRecipes={hubRecipes}
    />
  )
}

export const dynamic = "force-dynamic"
