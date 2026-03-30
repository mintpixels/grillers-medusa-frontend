import useSWR from "swr"
import strapiClient from "@lib/strapi"
import { GetProductsByMedusaIdsQuery } from "@lib/data/strapi/collections"
import { HttpTypes } from "@medusajs/types"

/**
 * Builds a Strapi title map for all products in a cart's line items.
 * Maps product_id -> Strapi Title. Fetches once and caches via SWR.
 */
export function useCartTitleMap(
  items: HttpTypes.StoreCartLineItem[] | undefined
): Record<string, string> {
  const productIds = Array.from(
    new Set(
      (items || [])
        .map((i) => i.product_id)
        .filter(Boolean) as string[]
    )
  )

  const cacheKey = productIds.length > 0
    ? ["cart-title-map", ...productIds.sort()]
    : null

  const { data } = useSWR<Record<string, string>>(
    cacheKey,
    async () => {
      try {
        const res = await strapiClient.request<{
          products: Array<{
            Title: string | null
            MedusaProduct?: { ProductId: string }
          }>
        }>(GetProductsByMedusaIdsQuery, {
          productIds,
          limit: productIds.length,
          start: 0,
        })

        const map: Record<string, string> = {}
        for (const p of res.products || []) {
          if (p.MedusaProduct?.ProductId && p.Title) {
            map[p.MedusaProduct.ProductId] = p.Title
          }
        }
        return map
      } catch {
        return {}
      }
    }
  )

  return data || {}
}
