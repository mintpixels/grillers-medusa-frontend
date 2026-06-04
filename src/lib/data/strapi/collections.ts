import { gql } from "graphql-request"
import { compactCollectionProducts } from "@lib/util/collection-product"
import type { StrapiSEO, StrapiSocialMeta } from "./seo"
import type { IngredientDisclosure } from "types/strapi"

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
  IngredientDisclosures?: IngredientDisclosure[]
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
    // Hechsher / Shchita (#43). Backfill in Strapi will surface these in PLP filters.
    ChassidishShchita?: boolean
    CHK?: boolean
    RabbiWeissmandl?: boolean
    OU?: boolean
    StarK?: boolean
    RabbiTeitelbaum?: boolean
    CRC?: boolean
    Lubavitch?: boolean
    QualifiesForFreeDeliveryOffers?: boolean
    FreeDeliveryExclusionReason?: string
  }
  Categorization?: {
    ProductTags?: Array<{ Name: string }>
  }
  MedusaProduct?: {
    ProductId: string
    Handle: string
    Description?: string | null
    ShortDescription?: string | null
    PricingMode?: "per_lb" | "fixed_price" | null
    Variants?: Array<{
      VariantId: string
      Sku?: string
      QualifiesForFreeDeliveryOffers?: boolean | null
      FreeDeliveryExclusionReason?: string | null
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
        Categorization: { ProductTags: { Name: { contains: $tagName } } }
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
        ChassidishShchita
        CHK
        RabbiWeissmandl
        OU
        StarK
        RabbiTeitelbaum
        CRC
        Lubavitch
        QualifiesForFreeDeliveryOffers
        FreeDeliveryExclusionReason
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
          QualifiesForFreeDeliveryOffers
          FreeDeliveryExclusionReason
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
        Categorization: { ProductCollections: { Slug: { eq: $slug } } }
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
        ChassidishShchita
        CHK
        RabbiWeissmandl
        OU
        StarK
        RabbiTeitelbaum
        CRC
        Lubavitch
        QualifiesForFreeDeliveryOffers
        FreeDeliveryExclusionReason
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
          QualifiesForFreeDeliveryOffers
          FreeDeliveryExclusionReason
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

const FUTURE_PRODUCT_FIELD_RE =
  /^\s+(ChassidishShchita|CHK|RabbiWeissmandl|OU|StarK|RabbiTeitelbaum|CRC|Lubavitch|QualifiesForFreeDeliveryOffers|FreeDeliveryExclusionReason)\n/gm

function legacyProductQuery(query: string): string {
  return query.replace(FUTURE_PRODUCT_FIELD_RE, "")
}

const LegacyGetProductsByTagQuery = legacyProductQuery(GetProductsByTagQuery)
const LegacyGetProductsByCollectionSlugQuery = legacyProductQuery(
  GetProductsByCollectionSlugQuery
)

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestStrapiProductsWithRetry(
  client: any,
  query: string,
  variables: Record<string, unknown>,
  attempts = 3
): Promise<StrapiCollectionProduct[]> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await client.request(query, variables)
      if (!Array.isArray(result?.products)) {
        throw new Error("Strapi products response was not an array.")
      }
      return result.products
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await wait(150 * attempt)
      }
    }
  }

  throw lastError
}

async function fetchPaginatedProducts(
  client: any,
  query: string,
  variables: Record<string, unknown>,
  pageSize = 100,
  retryAttempts = 3
): Promise<StrapiCollectionProduct[]> {
  let allProducts: StrapiCollectionProduct[] = []
  let start = 0

  while (true) {
    const products = await requestStrapiProductsWithRetry(
      client,
      query,
      {
        ...variables,
        limit: pageSize,
        start,
      },
      retryAttempts
    )

    allProducts = allProducts.concat(products)

    if (products.length < pageSize) break
    start += pageSize
  }

  return allProducts
}

// Fetch all products by tag, paginating through all results
export async function getProductsByTag(
  tagName: string,
  client: any
): Promise<StrapiCollectionProduct[]> {
  return getProductsByTagStrict(tagName, client).catch((error) => {
    console.error("Error fetching legacy products by tag:", error)
    return []
  })
}

export async function getProductsByTagStrict(
  tagName: string,
  client: any
): Promise<StrapiCollectionProduct[]> {
  try {
    return await fetchPaginatedProducts(client, GetProductsByTagQuery, {
      tagName,
    })
  } catch (error) {
    console.error("Error fetching products by tag:", error)
  }

  try {
    return await fetchPaginatedProducts(client, LegacyGetProductsByTagQuery, {
      tagName,
    })
  } catch (error) {
    console.error("Error fetching legacy products by tag:", error)
    throw error
  }
}

// Fetch all products by collection slug, paginating through all results
export async function getProductsByCollectionSlug(
  slug: string,
  client: any
): Promise<StrapiCollectionProduct[]> {
  return getProductsByCollectionSlugStrict(slug, client).catch((error) => {
    console.error("Error fetching legacy products by collection slug:", error)
    return []
  })
}

export async function getProductsByCollectionSlugStrict(
  slug: string,
  client: any
): Promise<StrapiCollectionProduct[]> {
  try {
    return await fetchPaginatedProducts(
      client,
      GetProductsByCollectionSlugQuery,
      {
        slug,
      }
    )
  } catch (error) {
    console.error("Error fetching products by collection slug:", error)
  }

  try {
    return await fetchPaginatedProducts(
      client,
      LegacyGetProductsByCollectionSlugQuery,
      { slug }
    )
  } catch (error) {
    console.error("Error fetching legacy products by collection slug:", error)
    throw error
  }
}

// Query to fetch products by multiple Medusa product IDs
export const GetProductsByMedusaIdsQuery = gql`
  query GetProductsByMedusaIds(
    $productIds: [String]!
    $limit: Int
    $start: Int
  ) {
    products(
      filters: { MedusaProduct: { ProductId: { in: $productIds } } }
      pagination: { limit: $limit, start: $start }
    ) {
      documentId
      Title
      FeaturedImage {
        url
      }
      IngredientDisclosures {
        Sku
        Ingredients
        Contains
        ReviewStatus
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
        ChassidishShchita
        CHK
        RabbiWeissmandl
        OU
        StarK
        RabbiTeitelbaum
        CRC
        Lubavitch
        QualifiesForFreeDeliveryOffers
        FreeDeliveryExclusionReason
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
          QualifiesForFreeDeliveryOffers
          FreeDeliveryExclusionReason
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

const LegacyGetProductsByMedusaIdsQuery = legacyProductQuery(
  GetProductsByMedusaIdsQuery
)

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

    return compactCollectionProducts(result.products || [])
  } catch (error) {
    console.error("Error fetching products by Medusa IDs:", error)
  }

  try {
    const result = await client.request(LegacyGetProductsByMedusaIdsQuery, {
      productIds,
      limit: productIds.length,
      start: 0,
    })

    return compactCollectionProducts(result.products || [])
  } catch (error) {
    console.error("Error fetching legacy products by Medusa IDs:", error)
    return []
  }
}

// Fetch Strapi products by Medusa handle. Used by the homepage Bestsellers
// section (#38) which stores a list of curated handles and renders the same
// ProductCard the PDP related-products carousel uses.
export const GetProductsByHandlesQuery = gql`
  query GetProductsByHandles($handles: [String]!) {
    products(
      filters: { MedusaProduct: { Handle: { in: $handles } } }
      pagination: { limit: 50, start: 0 }
    ) {
      documentId
      Title
      FeaturedImage {
        url
      }
      GalleryImages {
        url
      }
      IngredientDisclosures {
        Sku
        Ingredients
        Contains
        ReviewStatus
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
        Organic
        KosherForPassover
        Pareve
        Meat
        Dairy
        CholovYisroel
        ChassidishShchita
        CHK
        RabbiWeissmandl
        OU
        StarK
        RabbiTeitelbaum
        CRC
        Lubavitch
        QualifiesForFreeDeliveryOffers
        FreeDeliveryExclusionReason
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
          QualifiesForFreeDeliveryOffers
          FreeDeliveryExclusionReason
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

const LegacyGetProductsByHandlesQuery = legacyProductQuery(
  GetProductsByHandlesQuery
)

function sortProductsByHandleOrder(
  products: StrapiCollectionProduct[],
  handles: string[]
) {
  const order = new Map(handles.map((h, i) => [h, i]))
  return products.sort((a, b) => {
    const ai = order.get(a.MedusaProduct?.Handle || "") ?? 999
    const bi = order.get(b.MedusaProduct?.Handle || "") ?? 999
    return ai - bi
  })
}

export async function getProductsByHandles(
  handles: string[],
  client: any
): Promise<StrapiCollectionProduct[]> {
  if (!handles.length) return []
  try {
    const result = await client.request(GetProductsByHandlesQuery, { handles })
    const products: StrapiCollectionProduct[] = result.products || []
    // Strapi doesn't preserve the input order — re-sort to match the curated
    // sequence so editors control the display order in Strapi.
    return compactCollectionProducts(
      sortProductsByHandleOrder(products, handles)
    )
  } catch (error) {
    console.error("Error fetching products by handles:", error)
  }

  try {
    const result = await client.request(LegacyGetProductsByHandlesQuery, {
      handles,
    })
    return compactCollectionProducts(
      sortProductsByHandleOrder(result.products || [], handles)
    )
  } catch (error) {
    console.error("Error fetching legacy products by handles:", error)
    return []
  }
}

// Query to fetch all products (image filtering done client-side since Strapi can't filter on media fields)
export const GetProductsWithImagesQuery = gql`
  query GetProductsWithImages($limit: Int, $start: Int) {
    products(pagination: { limit: $limit, start: $start }) {
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
        ChassidishShchita
        CHK
        RabbiWeissmandl
        OU
        StarK
        RabbiTeitelbaum
        CRC
        Lubavitch
        QualifiesForFreeDeliveryOffers
        FreeDeliveryExclusionReason
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
          QualifiesForFreeDeliveryOffers
          FreeDeliveryExclusionReason
          Price {
            CalculatedPriceNumber
          }
        }
      }
    }
  }
`

const LegacyGetProductsWithImagesQuery = legacyProductQuery(
  GetProductsWithImagesQuery
)

export const GetStoreProductsQuery = gql`
  query GetStoreProducts($limit: Int, $start: Int) {
    products(pagination: { limit: $limit, start: $start }) {
      documentId
      Title
      FeaturedImage {
        url
      }
      Metadata {
        AvgPackWeight
        Uncooked
        Cooked
        HeatAndServe
        GlutenFree
        MSG
        KosherForPassover
        GrassFed
      }
      MedusaProduct {
        ProductId
        Handle
        Description
        ShortDescription
        PricingMode
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

const LegacyGetStoreProductsQuery = legacyProductQuery(GetStoreProductsQuery)

export async function getStoreProducts(
  client: any
): Promise<StrapiCollectionProduct[]> {
  try {
    const products = await fetchPaginatedProducts(
      client,
      GetStoreProductsQuery,
      {},
      1000,
      1
    )

    return compactCollectionProducts(products)
  } catch (error) {
    console.error("Error fetching store products from Strapi:", error)
  }

  try {
    const products = await fetchPaginatedProducts(
      client,
      LegacyGetStoreProductsQuery,
      {},
      1000,
      1
    )

    return compactCollectionProducts(products)
  } catch (error) {
    console.error("Error fetching legacy store products from Strapi:", error)
    return []
  }
}

export async function getAllProductsWithImages(
  client: any
): Promise<StrapiCollectionProduct[]> {
  try {
    const products = await fetchPaginatedProducts(
      client,
      GetProductsWithImagesQuery,
      {},
      100
    )

    return compactCollectionProducts(products)
  } catch (error) {
    console.error("Error fetching all products from Strapi:", error)
  }

  try {
    const products = await fetchPaginatedProducts(
      client,
      LegacyGetProductsWithImagesQuery,
      {},
      100
    )

    return compactCollectionProducts(products)
  } catch (error) {
    console.error("Error fetching legacy all products from Strapi:", error)
    return []
  }
}

function normalizeLookupSku(value?: string | null) {
  return value?.trim().toLowerCase() || ""
}

function productMatchesMedusaLookup(
  product: StrapiCollectionProduct,
  refs: {
    productIds: Set<string>
    variantIds: Set<string>
    skus: Set<string>
  }
) {
  const medusaProduct = product.MedusaProduct
  if (!medusaProduct) return false

  if (medusaProduct.ProductId && refs.productIds.has(medusaProduct.ProductId)) {
    return true
  }

  return (medusaProduct.Variants || []).some((variant) => {
    return (
      (variant.VariantId && refs.variantIds.has(variant.VariantId)) ||
      (variant.Sku && refs.skus.has(normalizeLookupSku(variant.Sku)))
    )
  })
}

function uniqueProductsByDocumentId(products: StrapiCollectionProduct[]) {
  const seen = new Set<string>()
  return products.filter((product) => {
    const key = product.documentId || product.MedusaProduct?.ProductId
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function getProductsByMedusaLookupRefs(
  input: {
    productIds?: string[]
    variantIds?: string[]
    skus?: string[]
  },
  client: any
): Promise<StrapiCollectionProduct[]> {
  const productIds = Array.from(
    new Set((input.productIds || []).filter(Boolean))
  )
  const variantIds = Array.from(
    new Set((input.variantIds || []).filter(Boolean))
  )
  const skus = Array.from(
    new Set((input.skus || []).map(normalizeLookupSku).filter(Boolean))
  )

  if (!productIds.length && !variantIds.length && !skus.length) {
    return []
  }

  const refs = {
    productIds: new Set(productIds),
    variantIds: new Set(variantIds),
    skus: new Set(skus),
  }

  const directProducts = productIds.length
    ? await getProductsByMedusaIds(productIds, client)
    : []
  const directMatches = uniqueProductsByDocumentId(directProducts)

  const hasMissingVariantMatch = variantIds.some(
    (variantId) =>
      !directMatches.some((product) =>
        product.MedusaProduct?.Variants?.some(
          (variant) => variant.VariantId === variantId
        )
      )
  )
  const hasMissingSkuMatch = skus.some(
    (sku) =>
      !directMatches.some((product) =>
        product.MedusaProduct?.Variants?.some(
          (variant) => normalizeLookupSku(variant.Sku) === sku
        )
      )
  )

  if (!hasMissingVariantMatch && !hasMissingSkuMatch) {
    return compactCollectionProducts(directMatches)
  }

  try {
    const catalogProducts = await fetchPaginatedProducts(
      client,
      GetProductsWithImagesQuery,
      {},
      100
    )
    return compactCollectionProducts(
      uniqueProductsByDocumentId([
        ...directMatches,
        ...catalogProducts.filter((product) =>
          productMatchesMedusaLookup(product, refs)
        ),
      ])
    )
  } catch (error) {
    console.error("Error fetching products for Medusa lookup refs:", error)
  }

  try {
    const catalogProducts = await fetchPaginatedProducts(
      client,
      LegacyGetProductsWithImagesQuery,
      {},
      100
    )
    return compactCollectionProducts(
      uniqueProductsByDocumentId([
        ...directMatches,
        ...catalogProducts.filter((product) =>
          productMatchesMedusaLookup(product, refs)
        ),
      ])
    )
  } catch (error) {
    console.error(
      "Error fetching legacy products for Medusa lookup refs:",
      error
    )
    return compactCollectionProducts(directMatches)
  }
}

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
      let allProducts: StrapiCollectionProduct[]
      try {
        allProducts = await fetchPaginatedProducts(
          client,
          GetProductsWithImagesQuery,
          {},
          PAGE_SIZE
        )
      } catch (error) {
        console.error("Error building related products cache:", error)
        allProducts = await fetchPaginatedProducts(
          client,
          LegacyGetProductsWithImagesQuery,
          {},
          PAGE_SIZE
        )
      }

      // Filter to only those with both a FeaturedImage and at least one GalleryImage
      const eligible = allProducts.filter(
        (p) =>
          p.FeaturedImage?.url && p.GalleryImages && p.GalleryImages.length > 0
      )

      _cachedEligibleProducts = compactCollectionProducts(eligible)
      _cacheTimestamp = Date.now()
      return _cachedEligibleProducts
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
