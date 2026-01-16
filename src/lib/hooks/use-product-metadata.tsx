import useSWR from "swr"

import strapiClient from "@lib/strapi"
import { GetProductMetadataQuery, ProductMetadata } from "@lib/data/strapi/pdp"

export function useProductMetadata(
  medusaProductId?: string
): ProductMetadata | null {
  const shouldFetch = Boolean(medusaProductId)

  const { data } = useSWR<ProductMetadata | null>(
    shouldFetch ? ["product-metadata", medusaProductId] : null,
    async () => {
      try {
        const res = await strapiClient.request<{
          products: Array<{ Metadata: ProductMetadata | null }>
        }>(GetProductMetadataQuery, {
          medusa_product_id: medusaProductId!,
        })
        return res.products?.[0]?.Metadata ?? null
      } catch (err) {
        console.error("Failed to load product metadata:", err)
        return null
      }
    }
  )

  return data ?? null
}


