import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

export const COLLECTION_PRODUCT_METADATA_KEYS = [
  "AvgPackSize",
  "AvgPackWeight",
  "Serves",
  "PiecesPerPack",
  "Uncooked",
  "Cooked",
  "HeatAndServe",
  "GlutenFree",
  "MSG",
  "AntibioticFree",
  "HormoneFree",
  "NoSteroids",
  "NoNitrites",
  "NoNitrates",
  "Organic",
  "Brand",
  "Source",
  "Origin",
  "Breed",
  "Supplier",
  "Angus",
  "GrassFed",
  "FreeRange",
  "SouthAmerican",
  "GrainFree",
  "BoneIn",
  "Boneless",
  "SkinOn",
  "Skinless",
  "Trimmed",
  "Untrimmed",
  "Netted",
  "FirstCut",
  "DeckelOn",
  "WholePacker",
  "CowboyCut",
  "Thickness",
  "Pargiot",
  "Capon",
  "Schnitzel",
  "Strips",
  "Marrow",
  "Kebab",
  "Smoked",
  "Pickled",
  "Cured",
  "Marinated",
  "MarinadeFlavor",
  "CharGrilled",
  "Sliced",
  "Ground",
  "Bulk",
  "Offcut",
  "VacuumPacked",
  "BulkPack",
  "BoilablePouch",
  "AluminumPan",
  "IQF",
  "KosherForPassover",
  "Pareve",
  "Meat",
  "Dairy",
  "CholovYisroel",
  "ChassidishShchita",
  "CHK",
  "RabbiWeissmandl",
  "OU",
  "StarK",
  "RabbiTeitelbaum",
  "CRC",
  "Lubavitch",
  "QualifiesForFreeDeliveryOffers",
  "FreeDeliveryExclusionReason",
  "PricingMode",
] as const

function compactImage(image: any) {
  return image?.url ? { url: image.url } : undefined
}

function compactMetadata(metadata: any) {
  if (!metadata || typeof metadata !== "object") return undefined

  const compact: Record<string, unknown> = {}
  for (const key of COLLECTION_PRODUCT_METADATA_KEYS) {
    const value = metadata[key]
    if (value === undefined || value === null || value === "") continue
    if (value === false && key !== "QualifiesForFreeDeliveryOffers") continue
    compact[key] = value
  }

  return Object.keys(compact).length ? compact : undefined
}

function compactVariant(variant: any) {
  if (!variant || typeof variant !== "object") return null

  const compact: Record<string, unknown> = {
    VariantId: variant.VariantId || "",
  }

  if (variant.Sku) compact.Sku = variant.Sku
  if (variant.QualifiesForFreeDeliveryOffers !== undefined) {
    compact.QualifiesForFreeDeliveryOffers =
      variant.QualifiesForFreeDeliveryOffers
  }
  if (variant.FreeDeliveryExclusionReason) {
    compact.FreeDeliveryExclusionReason = variant.FreeDeliveryExclusionReason
  }

  const price = variant.Price?.CalculatedPriceNumber
  if (typeof price === "number") {
    compact.Price = { CalculatedPriceNumber: price }
  }

  return compact
}

export function compactCollectionProduct(
  product: any
): StrapiCollectionProduct {
  const medusaProduct = product?.MedusaProduct
  const variants = Array.isArray(medusaProduct?.Variants)
    ? medusaProduct.Variants.map(compactVariant).filter(Boolean)
    : []
  const tags = Array.isArray(product?.Categorization?.ProductTags)
    ? product.Categorization.ProductTags.map((tag: any) =>
        tag?.Name ? { Name: tag.Name } : null
      ).filter(Boolean)
    : []

  return {
    documentId: product?.documentId || String(product?.objectID || ""),
    Title: product?.Title || "",
    FeaturedImage: compactImage(product?.FeaturedImage),
    GalleryImages: Array.isArray(product?.GalleryImages)
      ? product.GalleryImages.map(compactImage).filter(Boolean)
      : [],
    Metadata: compactMetadata(product?.Metadata),
    Categorization: tags.length ? { ProductTags: tags } : undefined,
    MedusaProduct: medusaProduct
      ? {
          ProductId: medusaProduct.ProductId || medusaProduct.Id || "",
          Handle: medusaProduct.Handle || "",
          ShortDescription: medusaProduct.ShortDescription || null,
          PricingMode: medusaProduct.PricingMode || null,
          Variants: variants,
        }
      : undefined,
  } as StrapiCollectionProduct
}

export function compactCollectionProducts<T extends StrapiCollectionProduct>(
  products: T[]
): StrapiCollectionProduct[] {
  return products.map(compactCollectionProduct)
}

export const ALGOLIA_COLLECTION_PRODUCT_ATTRIBUTES = [
  "documentId",
  "Title",
  "FeaturedImage.url",
  "GalleryImages.url",
  ...COLLECTION_PRODUCT_METADATA_KEYS.map((key) => `Metadata.${key}`),
  "Categorization.ProductTags.Name",
  "MedusaProduct.ProductId",
  "MedusaProduct.Id",
  "MedusaProduct.Handle",
  "MedusaProduct.ShortDescription",
  "MedusaProduct.PricingMode",
  "MedusaProduct.Variants.VariantId",
  "MedusaProduct.Variants.Sku",
  "MedusaProduct.Variants.QualifiesForFreeDeliveryOffers",
  "MedusaProduct.Variants.FreeDeliveryExclusionReason",
  "MedusaProduct.Variants.Price.CalculatedPriceNumber",
]
