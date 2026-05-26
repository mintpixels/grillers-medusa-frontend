import type { HttpTypes } from "@medusajs/types"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

const INTERNAL_RAW_MATERIAL_SKU = /^RM-/i

export function isInternalRawMaterialSku(sku: unknown): boolean {
  return (
    typeof sku === "string" && INTERNAL_RAW_MATERIAL_SKU.test(sku.trim())
  )
}

export function medusaProductHasInternalRawMaterialSku(
  product: Pick<HttpTypes.StoreProduct, "variants"> | null | undefined
): boolean {
  return Boolean(
    product?.variants?.some((variant) =>
      isInternalRawMaterialSku(variant?.sku)
    )
  )
}

export function strapiProductHasInternalRawMaterialSku(
  product: Pick<StrapiCollectionProduct, "MedusaProduct"> | null | undefined
): boolean {
  return Boolean(
    product?.MedusaProduct?.Variants?.some((variant) =>
      isInternalRawMaterialSku(variant?.Sku)
    )
  )
}
