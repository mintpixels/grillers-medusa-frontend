import { gql } from "graphql-request"

export const GetCommonPdpQuery = gql`
  query CommonPdpQuery {
    pdp {
      WhyUs {
        Title
        Image {
          url
        }
        List {
          id
          Title
          Description
        }
      }
      HowItWorks {
        Title
        Description
        Cards {
          Text
          Image {
            url
          }
          id
        }
      }
    }
  }
`

export const GetProductQuery = gql`
  query GetProductQuery($medusa_product_id: String) {
    products(
      filters: { MedusaProduct: { ProductId: { eq: $medusa_product_id } } }
      pagination: { limit: 1 }
    ) {
      documentId
      medusa_product_id
      Title
      FeaturedImage {
        url
      }
      GalleryImages {
        url
      }
      Metadata {
        GlutenFree
        Uncooked
        Cooked
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
      }
      Recipes {
        documentId
        Title
        Slug
        ShortDescription
        Image {
          url
        }
      }
      MedusaProduct {
        ProductId
        Title
        Description
        Handle
        Variants {
          VariantId
          Title
          Price {
            OriginalPriceNumber
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

export const GetProductFeaturedImageQuery = gql`
  query GetProductFeaturedImageQuery($medusa_product_id: String) {
    products(
      filters: { MedusaProduct: { ProductId: { eq: $medusa_product_id } } }
      pagination: { limit: 1 }
    ) {
      FeaturedImage {
        url
      }
    }
  }
`
