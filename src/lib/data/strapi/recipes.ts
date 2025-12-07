import { gql } from "graphql-request"
import type { StrapiSEO, StrapiSocialMeta } from "./seo"

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
  SEO?: StrapiSEO
  SocialMeta?: StrapiSocialMeta
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
