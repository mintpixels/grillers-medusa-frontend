import useSWR from "swr"

import strapiClient from "@lib/strapi"
import { GetProductFeaturedImageQuery } from "@lib/data/strapi/pdp"
export function useProductFeaturedImageSrc(
  medusaProductId?: string,
  placeholderUrl: string = "https://placehold.co/600x400"
): string {
  if (!medusaProductId) {
    return placeholderUrl
  }

  const shouldFetch = Boolean(medusaProductId)

  const { data: featuredUrl } = useSWR<string>(
    shouldFetch ? ["product-featured-image", medusaProductId] : null,
    async () => {
      try {
        const res = await strapiClient.request<{
          products: Array<{ FeaturedImage: { url: string } | null }>
        }>(GetProductFeaturedImageQuery, {
          medusa_product_id: medusaProductId!,
        })
        return res.products?.[0]?.FeaturedImage?.url ?? placeholderUrl
      } catch (err) {
        console.error("Failed to load featured image:", err)
        return placeholderUrl
      }
    }
  )

  return featuredUrl ?? placeholderUrl
}
