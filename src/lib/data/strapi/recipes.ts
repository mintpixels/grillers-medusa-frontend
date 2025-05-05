import { gql } from "graphql-request"

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
