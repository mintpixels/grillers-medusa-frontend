"use server"

import "server-only"

import {
  getProductsByMedusaLookupRefs,
  type StrapiCollectionProduct,
} from "@lib/data/strapi/collections"
import type { PurchaseHistoryItem } from "@lib/data/orders"
import strapiClient from "@lib/strapi"

export type ReorderStrapiMap = Record<string, StrapiCollectionProduct>

function presentString(value: string | null | undefined): value is string {
  return Boolean(value)
}

export async function getReorderStrapiMap(
  purchaseHistory: PurchaseHistoryItem[]
): Promise<ReorderStrapiMap> {
  const reorderStrapiMap: ReorderStrapiMap = {}

  if (!purchaseHistory.length) {
    return reorderStrapiMap
  }

  const ids = Array.from(
    new Set(purchaseHistory.map((h) => h.productId).filter(presentString))
  )
  const variantIds = Array.from(
    new Set(purchaseHistory.map((h) => h.variantId).filter(presentString))
  )
  const skus = Array.from(
    new Set(purchaseHistory.map((h) => h.sku).filter(presentString))
  )

  if (!ids.length && !variantIds.length && !skus.length) {
    return reorderStrapiMap
  }

  const strapiProducts = await getProductsByMedusaLookupRefs(
    { productIds: ids, variantIds, skus },
    strapiClient
  )

  for (const sp of strapiProducts) {
    if (sp.MedusaProduct?.ProductId) {
      reorderStrapiMap[sp.MedusaProduct.ProductId] = sp
    }
    for (const variant of sp.MedusaProduct?.Variants || []) {
      if (variant.VariantId) {
        reorderStrapiMap[variant.VariantId] = sp
      }
      if (variant.Sku) {
        reorderStrapiMap[variant.Sku.trim().toLowerCase()] = sp
      }
    }
  }

  return reorderStrapiMap
}
