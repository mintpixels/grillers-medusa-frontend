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
    MSG?: boolean
    Cooked?: boolean
    Uncooked?: boolean
    AvgPackSize?: string
    AvgPackWeight?: string
    Serves?: string
    PiecesPerPack?: number
  }
  Categorization?: {
    ProductTags?: Array<{ Name: string }>
  }
  MedusaProduct?: {
    ProductId: string
    Handle: string
    Description?: string
    Variants?: Array<{
      VariantId: string
      Sku?: string
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
        MSG
        Cooked
        Uncooked
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
      }
      Categorization {
        ProductTags {
          Name
        }
      }
      MedusaProduct {
        ProductId
        Handle
        Description
        Variants {
          VariantId
          Sku
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

export const GetProductsByCollectionSlugQuery = gql`
  query GetProductsByCollectionSlug($slug: String!, $limit: Int, $start: Int) {
    products(
      filters: {
        Categorization: {
          ProductCollections: {
            Slug: { eq: $slug }
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
        MSG
        Cooked
        Uncooked
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
      }
      Categorization {
        ProductTags {
          Name
        }
      }
      MedusaProduct {
        ProductId
        Handle
        Description
        Variants {
          VariantId
          Sku
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

// Fetch all products by tag, paginating through all results
export async function getProductsByTag(
  tagName: string,
  client: any
): Promise<StrapiCollectionProduct[]> {
  const PAGE_SIZE = 100
  let allProducts: StrapiCollectionProduct[] = []
  let start = 0

  try {
    while (true) {
      const result = await client.request(GetProductsByTagQuery, {
        tagName,
        limit: PAGE_SIZE,
        start,
      })

      const products = result.products || []
      allProducts = allProducts.concat(products)

      if (products.length < PAGE_SIZE) break
      start += PAGE_SIZE
    }

    return allProducts
  } catch (error) {
    console.error("Error fetching products by tag:", error)
    return []
  }
}

// Fetch all products by collection slug, paginating through all results
export async function getProductsByCollectionSlug(
  slug: string,
  client: any
): Promise<StrapiCollectionProduct[]> {
  const PAGE_SIZE = 100
  let allProducts: StrapiCollectionProduct[] = []
  let start = 0

  try {
    while (true) {
      const result = await client.request(GetProductsByCollectionSlugQuery, {
        slug,
        limit: PAGE_SIZE,
        start,
      })

      const products = result.products || []
      allProducts = allProducts.concat(products)

      if (products.length < PAGE_SIZE) break
      start += PAGE_SIZE
    }

    return allProducts
  } catch (error) {
    console.error("Error fetching products by collection slug:", error)
    return []
  }
}
