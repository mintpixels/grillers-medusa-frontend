import type { HttpTypes } from "@medusajs/types"

import { getProductsByMedusaIds } from "@lib/data/strapi/collections"
import strapiClient from "@lib/strapi"

export type CartProductDetails = {
  title?: string
  image?: string
  metadata?: Record<string, unknown> | null
}

export type CartProductDetailsMap = Record<string, CartProductDetails>

export function getCartLineProductId(
  item:
    | HttpTypes.StoreCartLineItem
    | HttpTypes.StoreOrderLineItem
    | null
    | undefined
) {
  return (item as any)?.product_id || (item as any)?.product?.id || null
}

export function getUniqueCartProductIds(
  items:
    | Array<HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem>
    | null
    | undefined
) {
  return Array.from(
    new Set((items || []).map(getCartLineProductId).filter(Boolean))
  ) as string[]
}

export async function buildCartProductDetailsMap(
  itemsOrProductIds:
    | Array<HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem>
    | string[]
    | null
    | undefined
): Promise<CartProductDetailsMap> {
  const productIds =
    typeof itemsOrProductIds?.[0] === "string"
      ? Array.from(new Set((itemsOrProductIds as string[]).filter(Boolean)))
      : getUniqueCartProductIds(
          itemsOrProductIds as
            | Array<HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem>
            | null
            | undefined
        )

  if (!productIds.length) return {}

  try {
    const products = await getProductsByMedusaIds(productIds, strapiClient)
    const details: CartProductDetailsMap = {}

    for (const product of products) {
      const productId = product.MedusaProduct?.ProductId
      if (!productId) continue

      details[productId] = {
        title: product.Title || undefined,
        image: product.FeaturedImage?.url || undefined,
        metadata: product.Metadata || null,
      }
    }

    return details
  } catch {
    return {}
  }
}
