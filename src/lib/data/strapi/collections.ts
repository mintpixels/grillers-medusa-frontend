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
  GalleryImages?: Array<{
    url: string
  }>
  Metadata?: {
    // Pack info
    AvgPackSize?: string
    AvgPackWeight?: string
    Serves?: string
    PiecesPerPack?: number
    // Cooking state
    Uncooked?: boolean
    Cooked?: boolean
    HeatAndServe?: boolean
    // Diet & clean labels
    GlutenFree?: boolean
    MSG?: boolean
    AntibioticFree?: boolean
    HormoneFree?: boolean
    NoSteroids?: boolean
    NoNitrites?: boolean
    NoNitrates?: boolean
    Organic?: boolean
    // Sourcing
    Brand?: string
    Source?: string
    Origin?: string
    Breed?: string
    Supplier?: string
    Angus?: boolean
    GrassFed?: boolean
    FreeRange?: boolean
    SouthAmerican?: boolean
    GrainFree?: boolean
    // Cut
    BoneIn?: boolean
    Boneless?: boolean
    SkinOn?: boolean
    Skinless?: boolean
    Trimmed?: boolean
    Untrimmed?: boolean
    Netted?: boolean
    FirstCut?: boolean
    DeckelOn?: boolean
    WholePacker?: boolean
    CowboyCut?: boolean
    Thickness?: string
    Pargiot?: boolean
    Capon?: boolean
    Schnitzel?: boolean
    Strips?: boolean
    Marrow?: boolean
    Kebab?: boolean
    // Preparation
    Smoked?: boolean
    Pickled?: boolean
    Cured?: boolean
    Marinated?: boolean
    MarinadeFlavor?: string
    CharGrilled?: boolean
    Sliced?: boolean
    Ground?: boolean
    Bulk?: boolean
    Offcut?: boolean
    // Packaging
    VacuumPacked?: boolean
    BulkPack?: boolean
    BoilablePouch?: boolean
    AluminumPan?: boolean
    IQF?: boolean
    // Kosher
    KosherForPassover?: boolean
    Pareve?: boolean
    Meat?: boolean
    Dairy?: boolean
    CholovYisroel?: boolean
  }
  Categorization?: {
    ProductTags?: Array<{ Name: string }>
  }
  MedusaProduct?: {
    ProductId: string
    Handle: string
    Description?: string
    ShortDescription?: string | null
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
      GalleryImages {
        url
      }
      Metadata {
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
        Uncooked
        Cooked
        HeatAndServe
        GlutenFree
        MSG
        AntibioticFree
        HormoneFree
        NoSteroids
        NoNitrites
        NoNitrates
        Organic
        Brand
        Source
        Origin
        Breed
        Supplier
        Angus
        GrassFed
        FreeRange
        SouthAmerican
        GrainFree
        BoneIn
        Boneless
        SkinOn
        Skinless
        Trimmed
        Untrimmed
        Netted
        FirstCut
        DeckelOn
        WholePacker
        CowboyCut
        Thickness
        Pargiot
        Capon
        Schnitzel
        Strips
        Marrow
        Kebab
        Smoked
        Pickled
        Cured
        Marinated
        MarinadeFlavor
        CharGrilled
        Sliced
        Ground
        Bulk
        Offcut
        VacuumPacked
        BulkPack
        BoilablePouch
        AluminumPan
        IQF
        KosherForPassover
        Pareve
        Meat
        Dairy
        CholovYisroel
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
        ShortDescription
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
      GalleryImages {
        url
      }
      Metadata {
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
        Uncooked
        Cooked
        HeatAndServe
        GlutenFree
        MSG
        AntibioticFree
        HormoneFree
        NoSteroids
        NoNitrites
        NoNitrates
        Organic
        Brand
        Source
        Origin
        Breed
        Supplier
        Angus
        GrassFed
        FreeRange
        SouthAmerican
        GrainFree
        BoneIn
        Boneless
        SkinOn
        Skinless
        Trimmed
        Untrimmed
        Netted
        FirstCut
        DeckelOn
        WholePacker
        CowboyCut
        Thickness
        Pargiot
        Capon
        Schnitzel
        Strips
        Marrow
        Kebab
        Smoked
        Pickled
        Cured
        Marinated
        MarinadeFlavor
        CharGrilled
        Sliced
        Ground
        Bulk
        Offcut
        VacuumPacked
        BulkPack
        BoilablePouch
        AluminumPan
        IQF
        KosherForPassover
        Pareve
        Meat
        Dairy
        CholovYisroel
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
        ShortDescription
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

// Query to fetch products by multiple Medusa product IDs
export const GetProductsByMedusaIdsQuery = gql`
  query GetProductsByMedusaIds($productIds: [String]!, $limit: Int, $start: Int) {
    products(
      filters: {
        MedusaProduct: {
          ProductId: { in: $productIds }
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
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
        Uncooked
        Cooked
        HeatAndServe
        GlutenFree
        MSG
        AntibioticFree
        HormoneFree
        NoSteroids
        NoNitrites
        NoNitrates
        Organic
        Brand
        Source
        Origin
        Breed
        Supplier
        Angus
        GrassFed
        FreeRange
        SouthAmerican
        GrainFree
        BoneIn
        Boneless
        SkinOn
        Skinless
        Trimmed
        Untrimmed
        Netted
        FirstCut
        DeckelOn
        WholePacker
        CowboyCut
        Thickness
        Pargiot
        Capon
        Schnitzel
        Strips
        Marrow
        Kebab
        Smoked
        Pickled
        Cured
        Marinated
        MarinadeFlavor
        CharGrilled
        Sliced
        Ground
        Bulk
        Offcut
        VacuumPacked
        BulkPack
        BoilablePouch
        AluminumPan
        IQF
        KosherForPassover
        Pareve
        Meat
        Dairy
        CholovYisroel
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
        ShortDescription
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

// Fetch Strapi products by their Medusa product IDs
export async function getProductsByMedusaIds(
  productIds: string[],
  client: any
): Promise<StrapiCollectionProduct[]> {
  if (productIds.length === 0) return []

  try {
    const result = await client.request(GetProductsByMedusaIdsQuery, {
      productIds,
      limit: productIds.length,
      start: 0,
    })

    return result.products || []
  } catch (error) {
    console.error("Error fetching products by Medusa IDs:", error)
    return []
  }
}

// Query to fetch all products (image filtering done client-side since Strapi can't filter on media fields)
export const GetProductsWithImagesQuery = gql`
  query GetProductsWithImages($limit: Int, $start: Int) {
    products(
      pagination: { limit: $limit, start: $start }
    ) {
      documentId
      Title
      FeaturedImage {
        url
      }
      GalleryImages {
        url
      }
      Metadata {
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
        Uncooked
        Cooked
        HeatAndServe
        GlutenFree
        MSG
        AntibioticFree
        HormoneFree
        NoSteroids
        NoNitrites
        NoNitrates
        Organic
        Brand
        Source
        Origin
        Breed
        Supplier
        Angus
        GrassFed
        FreeRange
        SouthAmerican
        GrainFree
        BoneIn
        Boneless
        SkinOn
        Skinless
        Trimmed
        Untrimmed
        Netted
        FirstCut
        DeckelOn
        WholePacker
        CowboyCut
        Thickness
        Pargiot
        Capon
        Schnitzel
        Strips
        Marrow
        Kebab
        Smoked
        Pickled
        Cured
        Marinated
        MarinadeFlavor
        CharGrilled
        Sliced
        Ground
        Bulk
        Offcut
        VacuumPacked
        BulkPack
        BoilablePouch
        AluminumPan
        IQF
        KosherForPassover
        Pareve
        Meat
        Dairy
        CholovYisroel
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
        ShortDescription
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

// ── Cached pool of eligible products for "related products" ──
// Fetches the full catalog once, caches in server memory, refreshes every 5 min.
// Each PDP just picks randomly from the cache — no per-request catalog scan.

let _cachedEligibleProducts: StrapiCollectionProduct[] | null = null
let _cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let _cachePromise: Promise<StrapiCollectionProduct[]> | null = null

async function getEligibleProductPool(
  client: any
): Promise<StrapiCollectionProduct[]> {
  const now = Date.now()

  // Return cached data if still fresh
  if (_cachedEligibleProducts && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedEligibleProducts
  }

  // If another request is already refreshing the cache, wait for it
  if (_cachePromise) {
    return _cachePromise
  }

  _cachePromise = (async () => {
    try {
      const PAGE_SIZE = 100
      let allProducts: StrapiCollectionProduct[] = []
      let start = 0

      while (true) {
        const result = await client.request(GetProductsWithImagesQuery, {
          limit: PAGE_SIZE,
          start,
        })

        const products = result.products || []
        allProducts = allProducts.concat(products)

        if (products.length < PAGE_SIZE) break
        start += PAGE_SIZE
      }

      // Filter to only those with both a FeaturedImage and at least one GalleryImage
      const eligible = allProducts.filter(
        (p) =>
          p.FeaturedImage?.url &&
          p.GalleryImages &&
          p.GalleryImages.length > 0
      )

      _cachedEligibleProducts = eligible
      _cacheTimestamp = Date.now()
      return eligible
    } catch (error) {
      console.error("Error building related products cache:", error)
      // Return stale cache if available, otherwise empty
      return _cachedEligibleProducts || []
    } finally {
      _cachePromise = null
    }
  })()

  return _cachePromise
}

// Fetch random products that have both a FeaturedImage and at least one GalleryImage
export async function getRandomProductsWithImages(
  count: number,
  excludeProductId?: string,
  client?: any
): Promise<StrapiCollectionProduct[]> {
  if (!client) return []

  try {
    const pool = await getEligibleProductPool(client)

    // Exclude the current product
    let eligible = excludeProductId
      ? pool.filter((p) => p.MedusaProduct?.ProductId !== excludeProductId)
      : [...pool]

    // Shuffle and pick `count` random products
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[eligible[i], eligible[j]] = [eligible[j], eligible[i]]
    }

    return eligible.slice(0, count)
  } catch (error) {
    console.error("Error fetching random products with images:", error)
    return []
  }
}
