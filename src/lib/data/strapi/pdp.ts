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

export const GetProductMetadataQuery = gql`
  query GetProductMetadataQuery($medusa_product_id: String) {
    products(
      filters: { MedusaProduct: { ProductId: { eq: $medusa_product_id } } }
      pagination: { limit: 1 }
    ) {
      Metadata {
        AvgPackWeight
        AvgPackSize
      }
    }
  }
`

export type ProductMetadata = {
  AvgPackWeight?: string | null
  AvgPackSize?: string | null
}

/**
 * Generates Product JSON-LD schema for SEO
 */
export function generateProductJsonLd(
  product: {
    id?: string
    title?: string
    description?: string | null
    thumbnail?: string | null
    handle?: string
    variants?: Array<{
      id?: string
      sku?: string | null
      calculated_price?: {
        calculated_amount?: number
        currency_code?: string
      }
      inventory_quantity?: number
    }>
  },
  strapiData: {
    FeaturedImage?: { url: string }
    GalleryImages?: Array<{ url: string }>
    MedusaProduct?: {
      Description?: string
    }
    Metadata?: {
      GlutenFree?: boolean
    }
  } | null,
  baseUrl: string,
  countryCode: string
) {
  const variant = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount
  const currency = variant?.calculated_price?.currency_code?.toUpperCase() || "USD"
  const inStock = (variant?.inventory_quantity ?? 0) > 0

  // Collect all images
  const images: string[] = []
  if (strapiData?.FeaturedImage?.url) {
    images.push(strapiData.FeaturedImage.url)
  }
  if (strapiData?.GalleryImages) {
    images.push(...strapiData.GalleryImages.map((img) => img.url))
  }
  if (images.length === 0 && product.thumbnail) {
    images.push(product.thumbnail)
  }

  const productUrl = `${baseUrl}/${countryCode}/products/${product.handle}`

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: strapiData?.MedusaProduct?.Description || product.description,
    image: images.length > 0 ? images : undefined,
    url: productUrl,
    sku: variant?.sku || variant?.id,
    brand: {
      "@type": "Brand",
      name: "Grillers Pride",
    },
    ...(price && {
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: currency,
        price: (price / 100).toFixed(2),
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: "Grillers Pride",
        },
      },
    }),
    ...(strapiData?.Metadata?.GlutenFree && {
      additionalProperty: {
        "@type": "PropertyValue",
        name: "Dietary",
        value: "Gluten Free",
      },
    }),
  }
}
