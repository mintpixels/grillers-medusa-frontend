import { gql } from "graphql-request"
import strapiClient from "@lib/strapi"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import type { StrapiSEO, StrapiSocialMeta } from "./seo"
import type { StrapiCollectionProduct } from "./collections"

export type CuratedCollectionItem = {
  id?: string | number
  Quantity: number
  Required?: boolean
  Role?: string | null
  Notes?: string | null
  ProductHandle?: string | null
  Product?: StrapiCollectionProduct | null
}

export type CuratedCurationSlot = {
  id?: string | number
  Label: string
  CategoryRule: string
  MinWeightLb?: number | null
  MaxWeightLb?: number | null
  MinPricePerLb?: number | null
  MaxPricePerLb?: number | null
  Required?: boolean
  Notes?: string | null
}

export type CuratedRecommendationRule = {
  Surface: "homepage" | "pdp" | "cart" | "checkout" | "email" | "sms" | "agent"
  Trigger:
    | "default"
    | "product_keyword"
    | "cart_keyword"
    | "customer_state"
    | "seasonal_window"
    | "category_gap"
    | "free_shipping_gap"
  MatchKeywords?: string[] | null
  CustomerState?: "all" | "guest_or_no_orders" | "returning" | "lapsed" | "high_value"
  Priority?: number | null
  Notes?: string | null
}

export type CuratedCollection = {
  documentId: string
  Name: string
  Slug: string
  Eyebrow?: string | null
  ShortDescription: string
  CollectionType: "sku_backed" | "curation_profile"
  Occasion:
    | "starter"
    | "shabbos"
    | "weeknight"
    | "holiday"
    | "grilling"
    | "premium"
    | "heritage"
    | "prepared"
    | "stock_up"
    | "cart_upsell"
    | "other"
  CustomerStateFilter?: "all" | "guest_or_no_orders" | "returning" | "lapsed" | "high_value"
  VisibilityStart?: string | null
  VisibilityEnd?: string | null
  HeroImage?: { url: string } | null
  HeroImageAlt?: string | null
  Items?: CuratedCollectionItem[] | null
  CurationSlots?: CuratedCurationSlot[] | null
  RecommendationRules?: CuratedRecommendationRule[] | null
  TargetPriceCents?: number | null
  TargetMinWeightLb?: number | null
  TargetMaxWeightLb?: number | null
  SortOrder?: number | null
  IsFeatured?: boolean | null
  IsActive?: boolean | null
  SurfacePlacements?: string[] | null
  PdpMatchKeywords?: string[] | null
  StrategySignals?: string[] | null
  SEO?: StrapiSEO | null
  SocialMeta?: StrapiSocialMeta | null
}

const CuratedProductFields = gql`
  fragment CuratedProductFields on Product {
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
`

const CuratedCollectionFields = gql`
  ${CuratedProductFields}
  fragment CuratedCollectionFields on CuratedCollection {
    documentId
    Name
    Slug
    Eyebrow
    ShortDescription
    CollectionType
    Occasion
    CustomerStateFilter
    VisibilityStart
    VisibilityEnd
    HeroImage {
      url
    }
    HeroImageAlt
    Items {
      Quantity
      Required
      Role
      Notes
      ProductHandle
      Product {
        ...CuratedProductFields
      }
    }
    CurationSlots {
      Label
      CategoryRule
      MinWeightLb
      MaxWeightLb
      MinPricePerLb
      MaxPricePerLb
      Required
      Notes
    }
    RecommendationRules {
      Surface
      Trigger
      MatchKeywords
      CustomerState
      Priority
      Notes
    }
    TargetPriceCents
    TargetMinWeightLb
    TargetMaxWeightLb
    SortOrder
    IsFeatured
    IsActive
    SurfacePlacements
    PdpMatchKeywords
    StrategySignals
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
`

export const GetCuratedCollectionsQuery = gql`
  ${CuratedCollectionFields}
  query GetCuratedCollections($limit: Int = 50) {
    curatedCollections(
      filters: { IsActive: { eq: true } }
      sort: ["SortOrder:asc", "Name:asc"]
      pagination: { limit: $limit, start: 0 }
    ) {
      ...CuratedCollectionFields
    }
  }
`

export const GetCuratedCollectionBySlugQuery = gql`
  ${CuratedCollectionFields}
  query GetCuratedCollectionBySlug($slug: String!) {
    curatedCollections(
      filters: { Slug: { eq: $slug }, IsActive: { eq: true } }
      pagination: { limit: 1, start: 0 }
    ) {
      ...CuratedCollectionFields
    }
  }
`

function isVisibleNow(collection: CuratedCollection, now = new Date()) {
  if (collection.IsActive === false) return false
  const start = collection.VisibilityStart
    ? new Date(`${collection.VisibilityStart}T00:00:00`)
    : null
  const end = collection.VisibilityEnd
    ? new Date(`${collection.VisibilityEnd}T23:59:59`)
    : null
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

function matchesSurface(collection: CuratedCollection, surface: string) {
  const placements = collection.SurfacePlacements || []
  return placements.length === 0 || placements.includes(surface)
}

function matchesCustomerState(
  collection: CuratedCollection,
  customerState: "guest_or_no_orders" | "returning" | "all"
) {
  const filter = collection.CustomerStateFilter || "all"
  return filter === "all" || filter === customerState
}

function uniqueProducts(collections: CuratedCollection[]) {
  const seen = new Set<string>()
  const products: StrapiCollectionProduct[] = []
  for (const collection of collections) {
    for (const item of collection.Items || []) {
      const product = item.Product
      const id = product?.MedusaProduct?.ProductId || product?.documentId
      if (!product || !id || seen.has(id)) continue
      seen.add(id)
      products.push(product)
    }
  }
  return products
}

function replaceProducts(
  collections: CuratedCollection[],
  enriched: StrapiCollectionProduct[]
) {
  const byId = new Map(
    enriched.map((product) => [
      product.MedusaProduct?.ProductId || product.documentId,
      product,
    ])
  )

  return collections.map((collection) => ({
    ...collection,
    Items: (collection.Items || []).map((item) => {
      const id = item.Product?.MedusaProduct?.ProductId || item.Product?.documentId
      return id && byId.has(id) ? { ...item, Product: byId.get(id)! } : item
    }),
  }))
}

async function enrichCollections(
  collections: CuratedCollection[],
  countryCode: string
) {
  const products = uniqueProducts(collections)
  if (!products.length) return collections
  const enriched = await enrichStrapiProductsWithMedusaPrices(products, countryCode)
  return replaceProducts(collections, enriched)
}

export async function getCuratedCollections({
  countryCode,
  surface,
  customerState = "all",
  limit = 50,
}: {
  countryCode: string
  surface?: string
  customerState?: "guest_or_no_orders" | "returning" | "all"
  limit?: number
}): Promise<CuratedCollection[]> {
  try {
    const data = await strapiClient.request<{
      curatedCollections: CuratedCollection[]
    }>(GetCuratedCollectionsQuery, { limit })

    const filtered = (data.curatedCollections || [])
      .filter((collection) => isVisibleNow(collection))
      .filter((collection) => !surface || matchesSurface(collection, surface))
      .filter((collection) => matchesCustomerState(collection, customerState))

    return enrichCollections(filtered, countryCode)
  } catch (error) {
    console.error("Error fetching curated collections:", error)
    return []
  }
}

export async function getCuratedCollectionBySlug(
  slug: string,
  countryCode: string
): Promise<CuratedCollection | null> {
  try {
    const data = await strapiClient.request<{
      curatedCollections: CuratedCollection[]
    }>(GetCuratedCollectionBySlugQuery, { slug })
    const collection = data.curatedCollections?.[0]
    if (!collection || !isVisibleNow(collection)) return null
    const [enriched] = await enrichCollections([collection], countryCode)
    return enriched || null
  } catch (error) {
    console.error("Error fetching curated collection:", error)
    return null
  }
}

export function getCollectionProducts(collection: CuratedCollection) {
  return (collection.Items || []).filter(
    (
      item
    ): item is CuratedCollectionItem & { Product: StrapiCollectionProduct } =>
      Boolean(item.Product?.MedusaProduct?.Handle)
  )
}
