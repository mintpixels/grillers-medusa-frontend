import useSWR from "swr"

import strapiClient from "@lib/strapi"
import { GetProductMetadataQuery, ProductMetadata } from "@lib/data/strapi/pdp"

export function useProductMetadata(
  medusaProductId?: string,
  prefetchedMetadata?: ProductMetadata | Record<string, unknown> | null
): ProductMetadata | null {
  const shouldFetch =
    Boolean(medusaProductId) && prefetchedMetadata === undefined

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

  return (
    (prefetchedMetadata as ProductMetadata | null | undefined) ?? data ?? null
  )
}
