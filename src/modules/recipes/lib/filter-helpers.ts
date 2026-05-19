// Pure helpers — used by both the server-side recipes page route and the
// client-side <RecipeFilters /> component. Lives in its own module so the
// server can import without pulling in the "use client" boundary.

export type FilterOptions = {
  categories: Array<{ Name: string; Slug: string }>
  cookingMethods: string[]
  difficulties: string[]
  dietaryTags: string[]
}

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "advanced"]

export function extractFilterOptions(recipes: any[]): FilterOptions {
  const categories = new Map<string, { Name: string; Slug: string }>()
  const difficulties = new Set<string>()

  recipes.forEach((recipe) => {
    // Schema is RecipeCategories (relation, multiple). CookingMethod /
    // DietaryTags fields were removed from the Strapi schema so those
    // filter groups are inert until they return.
    const cats = recipe.RecipeCategories || []
    for (const cat of cats) {
      if (cat?.Slug) {
        categories.set(cat.Slug, { Name: cat.Name, Slug: cat.Slug })
      }
    }
    if (recipe.Difficulty) {
      difficulties.add(recipe.Difficulty)
    }
  })

  const sortedDifficulties = Array.from(difficulties).sort((a, b) => {
    const aIndex = DIFFICULTY_ORDER.indexOf(a.toLowerCase())
    const bIndex = DIFFICULTY_ORDER.indexOf(b.toLowerCase())

    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
    }

    return a.localeCompare(b)
  })

  return {
    categories: Array.from(categories.values()).sort((a, b) =>
      a.Name.localeCompare(b.Name)
    ),
    cookingMethods: [],
    difficulties: sortedDifficulties,
    dietaryTags: [],
  }
}

export function buildStrapiFilters(params: {
  category?: string
  method?: string
  difficulty?: string
  dietary?: string
  search?: string
}): Record<string, any> | undefined {
  const filters: Record<string, any> = {
    Title: { notContainsi: "Recipe Title" },
    ShortDescription: { notContainsi: "Etiam id nisi" },
  }

  if (params.category) {
    filters.RecipeCategories = { Slug: { eq: params.category } }
  }
  if (params.difficulty) {
    filters.Difficulty = { eq: params.difficulty }
  }
  if (params.search) {
    filters.or = [
      { Title: { containsi: params.search } },
      { ShortDescription: { containsi: params.search } },
    ]
  }

  return filters
}
