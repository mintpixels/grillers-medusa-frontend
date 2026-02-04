import useSWR from "swr"

import strapiClient from "@lib/strapi"
import { GetProductTitleQuery } from "@lib/data/strapi/pdp"

export function useProductTitle(
  medusaProductId?: string,
  fallbackTitle?: string
): string {
  const { data: strapiTitle } = useSWR<string | null>(
    medusaProductId ? ["product-title", medusaProductId] : null,
    async () => {
      try {
        const res = await strapiClient.request<{
          products: Array<{ Title: string | null }>
        }>(GetProductTitleQuery, {
          medusa_product_id: medusaProductId!,
        })
        return res.products?.[0]?.Title ?? null
      } catch (err) {
        console.error("Failed to load product title:", err)
        return null
      }
    }
  )

  // Return Strapi title if available, otherwise fallback
  return strapiTitle ?? fallbackTitle ?? ""
}
