"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "./regions"

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,+metadata",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: "*items,+items.metadata,*items.variant,*items.product,+metadata",
        ...filters,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export async function listOrdersWithPrices(
  limit = 10,
  offset = 0,
  filters?: Record<string, any>
): Promise<HttpTypes.StoreOrder[]> {
  const headers = { ...(await getAuthHeaders()) }
  const ordersCache = { ...(await getCacheOptions("orders")) }
  const productsCache = { ...(await getCacheOptions("products")) }

  let region: HttpTypes.StoreRegion | undefined | null
  region = await getRegion("us")
  if (!region) throw new Error("Region not found")

  let orders: HttpTypes.StoreOrder[] = []
  try {
    const res = await sdk.client.fetch<HttpTypes.StoreOrderListResponse>(
      `/store/orders`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          order: "-created_at",
          fields: "*items,+items.metadata,*items.variant,*items.product,+metadata",
          ...filters,
        },
        headers,
        next: ordersCache,
        cache: "force-cache",
      }
    )
    orders = res.orders ?? []
  } catch (err) {
    throw medusaError(err)
  }

  // batch-fetch all products
  const productIds = Array.from(
    new Set(
      orders
        .flatMap((order) =>
          (order.items ?? []).map((item) => item.variant.product_id)
        )
        .filter((id): id is string => !!id)
    )
  )
  const { products } = await sdk.client.fetch<{
    products: HttpTypes.StoreProduct[]
  }>(`/store/products`, {
    method: "GET",
    query: {
      id: productIds,
      fields: "*variants.calculated_price,+variants.inventory_quantity",
      region_id: region.id,
    },
    headers,
    next: productsCache,
    cache: "force-cache",
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return orders.map((order) => {
    const items = order.items ?? []
    return {
      ...order,
      items: items.map((item) => {
        if (!item.variant) {
          return item
        }

        const prod = productMap.get(item.variant.product_id)
        const variant = prod?.variants?.find((v) => v.id === item.variant_id)

        return {
          ...item,
          product: {
            ...item.product,
            variants: prod?.variants ?? [],
          },
          variant: variant,
        }
      }),
    }
  })
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export type PurchaseHistoryItem = {
  variantId: string
  productId: string
  title: string
  productTitle: string
  thumbnail: string | null
  lastOrderedAt: string
  timesOrdered: number
  totalQuantity: number
  unitPrice: number
  currencyCode: string
  product?: any
  variant?: any
}

/**
 * Fetch all past orders and deduplicate items by variant_id.
 * Returns a list of unique products the customer has ordered, sorted by most recent.
 */
export async function listPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const orders = await listOrders(100, 0)

  if (!orders?.length) return []

  const variantMap = new Map<string, PurchaseHistoryItem>()

  for (const order of orders) {
    for (const item of order.items || []) {
      const variantId = item.variant_id
      if (!variantId) continue

      const existing = variantMap.get(variantId)
      const orderDate = order.created_at

      if (existing) {
        existing.timesOrdered += 1
        existing.totalQuantity += item.quantity
        if (orderDate > existing.lastOrderedAt) {
          existing.lastOrderedAt = orderDate
          existing.unitPrice = item.unit_price || existing.unitPrice
        }
      } else {
        variantMap.set(variantId, {
          variantId,
          productId: item.product_id || "",
          title: item.title || "",
          productTitle: item.product_title || "",
          thumbnail: item.thumbnail || null,
          lastOrderedAt: orderDate,
          timesOrdered: 1,
          totalQuantity: item.quantity,
          unitPrice: item.unit_price || 0,
          currencyCode: order.currency_code || "usd",
          product: item.product,
          variant: item.variant,
        })
      }
    }
  }

  return Array.from(variantMap.values()).sort(
    (a, b) => new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime()
  )
}
