import strapiClient from "@lib/strapi"
import { getProductsByMedusaIds } from "@lib/data/strapi/collections"

/**
 * Build a map of Medusa product ID -> Strapi title for a batch of products.
 * Used by server components to display Strapi titles without N+1 client fetches.
 */
export async function buildStrapiTitleMap(
  medusaProductIds: string[]
): Promise<Record<string, string>> {
  if (medusaProductIds.length === 0) return {}

  try {
    const strapiProducts = await getProductsByMedusaIds(
      medusaProductIds,
      strapiClient
    )

    const titleMap: Record<string, string> = {}
    for (const sp of strapiProducts) {
      if (sp.MedusaProduct?.ProductId && sp.Title) {
        titleMap[sp.MedusaProduct.ProductId] = sp.Title
      }
    }
    return titleMap
  } catch {
    return {}
  }
}
