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
export interface Metadata {
  AvgPackSize?: string
  AvgPackWeight?: string
  Serves?: string
  Uncooked?: boolean
  Cooked?: boolean
  PiecesPerPack?: number
  GlutenFree?: boolean
}

export interface MedusaProductVariant {
  VariantId: string
  Title: string
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
