export interface StrapiImage {
  url: string
}

// SEO Types
export interface StrapiSEO {
  metaTitle: string
  metaDescription: string
  shareImage?: StrapiImage
}

export interface StrapiSocialMeta {
  ogTitle?: string
  ogDescription?: string
  ogImage?: StrapiImage
  ogImageAlt?: string
  ogType?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: StrapiImage
  twitterImageAlt?: string
  twitterCreator?: string
  twitterSite?: string
}

// Footer Types
export interface FooterLink {
  id: string
  Text: string
  Url: string
}

export interface FooterNavigationColumn {
  id: string
  Title: string
  Links: FooterLink[]
}

export interface FooterSocialLink {
  id: string
  Platform: string
  Url: string
  Icon?: StrapiImage
}

export interface FooterCertificationBadge {
  id: string
  Name: string
  Image?: StrapiImage
  Description?: string
}

export interface StrapiFooterData {
  footer: {
    NavigationColumns: FooterNavigationColumn[]
    SocialLinks: FooterSocialLink[]
    ContactEmail?: string
    ContactPhone?: string
    ContactAddress?: string
    LegalLinks: FooterLink[]
    CertificationBadges: FooterCertificationBadge[]
    CopyrightText?: string
    ShowNewsletterSection?: boolean
    NewsletterTitle?: string
    NewsletterDescription?: string
  }
}

// Product Types
//
// Mirrors the Strapi `api::product.product` `Metadata` shape. Most of
// the boolean flags ride along on every product but only a subset
// applies to a given SKU; the PDP renders chips conditionally.
export interface Metadata {
  // Sizing / pack semantics.
  AvgPackSize?: string
  AvgPackWeight?: string
  Serves?: string
  PiecesPerPack?: number

  // Prep state.
  Uncooked?: boolean
  Cooked?: boolean
  HeatAndServe?: boolean

  // Dietary / ingredient flags.
  GlutenFree?: boolean
  MSG?: boolean         // historical: `true` means "NO MSG" per existing card UI
  Pareve?: boolean
  Meat?: boolean
  Dairy?: boolean
  CholovYisroel?: boolean

  // Kashruth.
  KosherForPassover?: boolean
  ChassidishShchita?: boolean
  CHK?: boolean
  RabbiWeissmandl?: boolean
  OU?: boolean
  StarK?: boolean
  RabbiTeitelbaum?: boolean
  CRC?: boolean
  Lubavitch?: boolean

  // Shipping-offer eligibility.
  QualifiesForFreeDeliveryOffers?: boolean
  FreeDeliveryExclusionReason?: string

  // Sourcing.
  Source?: string
  Brand?: string
  Origin?: string
  Angus?: boolean
  GrassFed?: boolean
  Organic?: boolean
  FreeRange?: boolean
  AntibioticFree?: boolean
  HormoneFree?: boolean
  NoSteroids?: boolean
  NoNitrites?: boolean
  NoNitrates?: boolean
  SouthAmerican?: boolean

  // Cut characteristics.
  BoneIn?: boolean
  Boneless?: boolean
  SkinOn?: boolean
  Skinless?: boolean
  Trimmed?: boolean
  Untrimmed?: boolean

  // Preparation styles.
  Smoked?: boolean
  Pickled?: boolean
  Cured?: boolean
  Marinated?: boolean
  CharGrilled?: boolean
  Sliced?: boolean
  Ground?: boolean
  VacuumPacked?: boolean
}

export interface MedusaProductVariant {
  VariantId: string
  Title: string
  // GP internal SKU code (e.g. "1-03-15-1"). Used by the PDP for the
  // phone-order workflow (#110) and by Algolia indexing.
  Sku?: string | null
  QualifiesForFreeDeliveryOffers?: boolean | null
  FreeDeliveryExclusionReason?: string | null
  Price?: {
    CalculatedPriceNumber: number
    OriginalPriceNumber: number
  }
}

export interface MedusaProduct {
  ProductId: string
  Title: string
  Handle: string
  Description: string
  Variants?: MedusaProductVariant[]
}

export interface StrapiProductData {
  objectID: string
  Title: string
  Categorization: any
  Metadata: Metadata
  id: number
  FeaturedImage: StrapiImage
  GalleryImages: StrapiImage[]
  Certifications?: { icon: string; label: string }[]
  MedusaProduct: MedusaProduct
}

// Testimonial Types
export interface StrapiTestimonial {
  id: string
  documentId: string
  CustomerName: string
  CustomerTitle?: string
  CustomerCompany?: string
  CustomerLocation?: string
  CustomerPhoto?: StrapiImage
  TestimonialText: string
  Rating: number // 1-5
  Featured?: boolean
  Tags?: string[]
  PublishedDate?: string
}

export interface StrapiTestimonialSection {
  Title?: string
  Subtitle?: string
  DisplayMode: "carousel" | "grid" | "featured" | "list"
  MaxItems?: number
  FilterByTags?: string[]
  ShowRatings?: boolean
  AutoRotate?: boolean
  AutoRotateInterval?: number
}
