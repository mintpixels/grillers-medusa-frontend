import { gql } from "graphql-request"
import type { StrapiSEO, StrapiSocialMeta } from "./seo"

export type RecipeCategory = {
  Name: string
  Slug: string
}

export type RecipeData = {
  Title: string
  Slug: string
  ShortDescription?: string
  Image?: { url: string }
  PublishedDate?: string
  TotalTime?: string
  PrepTime?: string
  CookTime?: string
  Servings?: string
  Ingredients?: { ingredient: string; id: string }[]
  Steps?: { id: string; instruction: string }[]
  Category?: RecipeCategory
  CookingMethod?: string
  Difficulty?: string
  DietaryTags?: string[]
  SEO?: StrapiSEO
  SocialMeta?: StrapiSocialMeta
}

export type RecipeFilterParams = {
  category?: string
  cookingMethod?: string
  difficulty?: string
  dietaryTag?: string
  search?: string
}

export const GetRecipeBySlugQuery = gql`
  query GetRecipeBySlug($slug: String!) {
    recipes(filters: { Slug: { eq: $slug } }, pagination: { limit: 1 }) {
      Title
      Slug
      ShortDescription
      Image {
        url
      }
      PublishedDate
      TotalTime
      PrepTime
      CookTime
      Servings
      Ingredients {
        ingredient
        id
      }
      Steps {
        id
        instruction
      }
      SEO {
        metaTitle
        metaDescription
        keywords
        canonicalUrl
      }
      SocialMeta {
        ogTitle
        ogDescription
        ogImage {
          url
        }
        ogImageAlt
        ogType
        twitterCard
        twitterTitle
        twitterDescription
        twitterImage {
          url
        }
        twitterImageAlt
        twitterCreator
        twitterSite
      }
    }
  }
`

export const GetPaginatedRecipesQuery = gql`
  query PaginatedRecipes($page: Int!, $pageSize: Int!) {
    recipes_connection(
      pagination: { page: $page, pageSize: $pageSize }
      sort: ["PublishedDate:desc"]
      status: PUBLISHED
    ) {
      nodes {
        documentId
        Slug
        Title
        ShortDescription
        Image {
          url
        }
        Category {
          Name
          Slug
        }
        CookingMethod
        Difficulty
        DietaryTags
      }
      pageInfo {
        page
        pageSize
        pageCount
        total
      }
    }
  }
`

// Filtered recipes query with dynamic filters
export const GetFilteredRecipesQuery = gql`
  query FilteredRecipes(
    $page: Int!
    $pageSize: Int!
    $filters: RecipeFiltersInput
  ) {
    recipes_connection(
      pagination: { page: $page, pageSize: $pageSize }
      sort: ["PublishedDate:desc"]
      status: PUBLISHED
      filters: $filters
    ) {
      nodes {
        documentId
        Slug
        Title
        ShortDescription
        Image {
          url
        }
        Category {
          Name
          Slug
        }
        CookingMethod
        Difficulty
        DietaryTags
      }
      pageInfo {
        page
        pageSize
        pageCount
        total
      }
    }
  }
`

// Get all recipe categories for filter dropdown
export const GetRecipeCategoriesQuery = gql`
  query RecipeCategories {
    recipeCategories {
      Name
      Slug
    }
  }
`

// Get distinct filter options from recipes
export const GetRecipeFilterOptionsQuery = gql`
  query RecipeFilterOptions {
    recipes(pagination: { limit: 100 }, status: PUBLISHED) {
      Category {
        Name
        Slug
      }
      CookingMethod
      Difficulty
      DietaryTags
    }
  }
`

export type RecipesPageData = {
  SEO?: StrapiSEO
  SocialMeta?: StrapiSocialMeta
}

export const GetRecipesPageSEOQuery = gql`
  query RecipesPageSEO {
    recipesPage {
      SEO {
        metaTitle
        metaDescription
        keywords
        canonicalUrl
      }
      SocialMeta {
        ogTitle
        ogDescription
        ogImage {
          url
        }
        ogImageAlt
        ogType
        twitterCard
        twitterTitle
        twitterDescription
        twitterImage {
          url
        }
        twitterImageAlt
        twitterCreator
        twitterSite
      }
    }
  }
`
