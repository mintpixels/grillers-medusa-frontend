export interface StrapiImage {
  url: string
}

export interface Metadata {
  AvgPackSize?: string
  AvgPackWeight?: string
  Serves?: string
  Uncooked?: boolean
  PiecesPerPack?: number
  GlutenFree?: boolean
  // add additional metadata keys here as needed
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
