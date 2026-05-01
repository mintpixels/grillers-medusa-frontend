"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,*categories,*categories.parent_category,*categories.parent_category.parent_category",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

/**
 * Strapi is the source of truth for product copy/metadata, but Medusa is the
 * source of truth for live prices. The Strapi `MedusaProduct.Variants[*].Price`
 * is populated via a sync workflow that can lag or miss products. This helper
 * fetches live prices from Medusa for the given Strapi products and patches
 * `Variants[i].Price.CalculatedPriceNumber` so cards render the live price
 * regardless of Strapi sync state.
 */
export const enrichStrapiProductsWithMedusaPrices = async <T extends StrapiCollectionProduct>(
  products: T[],
  countryCode: string
): Promise<T[]> => {
  const productIds = Array.from(
    new Set(
      products
        .map((p) => p.MedusaProduct?.ProductId)
        .filter((id): id is string => Boolean(id))
    )
  )
  if (productIds.length === 0) return products

  let medusaProducts: HttpTypes.StoreProduct[] = []
  try {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        id: productIds,
        limit: productIds.length,
      } as HttpTypes.FindParams & HttpTypes.StoreProductParams,
    })
    medusaProducts = response.products
  } catch (err) {
    console.error("enrichStrapiProductsWithMedusaPrices: Medusa fetch failed", err)
    return products
  }

  const priceByVariantId = new Map<string, number>()
  const priceByProductFirstVariant = new Map<string, number>()
  for (const mp of medusaProducts) {
    const variants = mp.variants ?? []
    let firstAmount: number | null = null
    for (const v of variants) {
      const amount = (v as any).calculated_price?.calculated_amount
      if (typeof amount === "number") {
        priceByVariantId.set(v.id, amount)
        if (firstAmount === null) firstAmount = amount
      }
    }
    if (firstAmount !== null) {
      priceByProductFirstVariant.set(mp.id, firstAmount)
    }
  }

  return products.map((p) => {
    if (!p.MedusaProduct) return p
    const variants = p.MedusaProduct.Variants ?? []
    if (variants.length === 0) {
      const fallback = priceByProductFirstVariant.get(p.MedusaProduct.ProductId)
      if (fallback == null) return p
      return {
        ...p,
        MedusaProduct: {
          ...p.MedusaProduct,
          Variants: [
            {
              VariantId: "",
              Price: { CalculatedPriceNumber: fallback },
            },
          ],
        },
      }
    }
    const enrichedVariants = variants.map((v) => {
      const amount =
        priceByVariantId.get(v.VariantId) ??
        priceByProductFirstVariant.get(p.MedusaProduct!.ProductId)
      if (amount == null) return v
      return {
        ...v,
        Price: { ...(v.Price ?? {}), CalculatedPriceNumber: amount },
      }
    })
    return {
      ...p,
      MedusaProduct: { ...p.MedusaProduct, Variants: enrichedVariants },
    }
  })
}
