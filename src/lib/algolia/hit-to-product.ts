import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

/**
 * Adapter from an Algolia hit to the StrapiCollectionProduct shape the
 * Strapi-side templates expect. Shared by /us/search and /us/store (and
 * any future Algolia-backed surface).
 *
 * Older index records may shape MedusaProduct differently — `Id` vs
 * `ProductId`, missing Handle, missing GalleryImages — so we normalize
 * to a single shape before downstream code touches it. (#116)
 */
export function hitToProduct(hit: any): StrapiCollectionProduct {
  const mp = hit.MedusaProduct
  const normalizedMp = mp
    ? {
        ...mp,
        ProductId: mp.ProductId || mp.Id || "",
        Handle: mp.Handle || "",
      }
    : undefined
  return {
    documentId: hit.documentId || String(hit.objectID || ""),
    Title: hit.Title || "",
    FeaturedImage: hit.FeaturedImage,
    GalleryImages: Array.isArray(hit.GalleryImages) ? hit.GalleryImages : [],
    Metadata: hit.Metadata,
    Categorization: hit.Categorization,
    MedusaProduct: normalizedMp,
  } as StrapiCollectionProduct
}
