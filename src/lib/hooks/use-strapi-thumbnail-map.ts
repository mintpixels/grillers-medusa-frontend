import useSWR from "swr"
import strapiClient from "@lib/strapi"
import { GetProductsByMedusaIdsQuery } from "@lib/data/strapi/collections"

/**
 * Builds a Strapi thumbnail map keyed by Medusa product_id. Used by the orders
 * list (and other places where order/cart snapshots may lack a thumbnail) so
 * cards fall back to the Strapi `FeaturedImage` rather than a blank placeholder.
 */
export function useStrapiThumbnailMap(
  productIds: string[]
): Record<string, string> {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)))
  const cacheKey =
    uniqueIds.length > 0 ? ["strapi-thumbnail-map", ...uniqueIds.sort()] : null

  const { data } = useSWR<Record<string, string>>(cacheKey, async () => {
    try {
      const res = await strapiClient.request<{
        products: Array<{
          FeaturedImage?: { url: string | null } | null
          MedusaProduct?: { ProductId: string }
        }>
      }>(GetProductsByMedusaIdsQuery, {
        productIds: uniqueIds,
        limit: uniqueIds.length,
        start: 0,
      })

      const map: Record<string, string> = {}
      for (const p of res.products || []) {
        const id = p.MedusaProduct?.ProductId
        const url = p.FeaturedImage?.url
        if (id && url) map[id] = url
      }
      return map
    } catch {
      return {}
    }
  })

  return data || {}
}
