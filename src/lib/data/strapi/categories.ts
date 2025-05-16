// src/lib/data/strapi/categories.ts
import { gql } from "graphql-request"

export const AllCategoryTreeQuery = gql`
  query AllCategoryTree {
    aisles {
      Slug
    }
    productTypes {
      Slug
      Aisle {
        Slug
      }
    }
    masterCategories {
      Slug
      ProductType {
        Slug
      }
    }
    categories {
      Slug
      MasterCategory {
        Slug
      }
    }
    subCategories {
      Slug
      Category {
        Slug
      }
    }
  }
`
