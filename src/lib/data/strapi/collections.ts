import { gql } from "graphql-request"
import type { StrapiSEO, StrapiSocialMeta } from "./seo"

export type ProductCollectionData = {
  Name: string
  Slug: string
  Description?: string
  HeroImage?: {
    url: string
  }
  HeroImageAlt?: string
  SEO?: StrapiSEO
  SocialMeta?: StrapiSocialMeta
}

export const AllProductCollectionsQuery = gql`
  query AllProductCollections {
    productCollections {
      Slug
    }
  }
`

export const GetProductCollectionQuery = gql`
  query GetProductCollectionQuery($handle: String) {
    productCollections(
      filters: { Slug: { eq: $handle } }
      pagination: { limit: 1 }
    ) {
      Name
      Slug
      Description
      HeroImage {
        url
      }
      HeroImageAlt
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

// Helper to extract tag value from tag name (removes L1:/L2:/L3: prefix)
export function extractTagValue(tagName: string): string {
  if (tagName.match(/^L[123]:/)) {
    return tagName.split(":")[1].trim()
  }
  return tagName
}

// Helper to generate slug from tag value with "kosher-" prefix for SEO
export function generateTagSlug(tagValue: string): string {
  const baseSlug = tagValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  
  return `kosher-${baseSlug}`
}

// Product Tag types
export type ProductTag = {
  documentId: string
  Name: string
  Description?: string
  SEODescription?: string
}

// Get tag by slug (generated from name)
export const GetProductTagBySlugQuery = gql`
  query GetProductTagBySlug {
    productTags(pagination: { limit: 1000 }) {
      documentId
      Name
      Description
      SEODescription
    }
  }
`

export async function getProductTagBySlug(
  handle: string,
  client: any
): Promise<ProductTag | null> {
  try {
    const result = await client.request(GetProductTagBySlugQuery)
    const tags = result.productTags || []
    
    // Find tag where generated slug matches the handle
    const matchedTag = tags.find((tag: ProductTag) => {
      const tagValue = extractTagValue(tag.Name)
      const tagSlug = generateTagSlug(tagValue)
      return tagSlug === handle
    })
    
    return matchedTag || null
  } catch (error) {
    console.error("Error fetching product tag:", error)
    return null
  }
}

// Strapi Product types for collections
export type StrapiCollectionProduct = {
  documentId: string
  Title: string
  FeaturedImage?: {
    url: string
  }
  Metadata?: {
    GlutenFree?: boolean
    Cooked?: boolean
    Uncooked?: boolean
    AvgPackSize?: string
    AvgPackWeight?: string
    Serves?: string
    PiecesPerPack?: number
  }
  MedusaProduct?: {
    ProductId: string
    Handle: string
    Variants?: Array<{
      Price?: {
        CalculatedPriceNumber: number
      }
    }>
  }
}

export const GetProductsByTagQuery = gql`
  query GetProductsByTag($tagName: String!, $limit: Int, $start: Int) {
    products(
      filters: {
        Categorization: {
          ProductTags: {
            Name: { contains: $tagName }
          }
        }
      }
      pagination: { limit: $limit, start: $start }
    ) {
      documentId
      Title
      FeaturedImage {
        url
      }
      Metadata {
        GlutenFree
        Cooked
        Uncooked
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
      }
      MedusaProduct {
        ProductId
        Handle
        Variants {
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

export async function getProductsByTag(
  tagName: string,
  client: any,
  options: { limit?: number; start?: number } = {}
): Promise<StrapiCollectionProduct[]> {
  try {
    const result = await client.request(GetProductsByTagQuery, {
      tagName,
      limit: options.limit || 100,
      start: options.start || 0,
    })
    
    return result.products || []
  } catch (error) {
    console.error("Error fetching products by tag:", error)
    return []
  }
}
