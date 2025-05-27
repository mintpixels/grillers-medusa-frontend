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
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product",
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
        fields: "*items,+items.metadata,*items.variant,*items.product",
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
          fields: "*items,+items.metadata,*items.variant,*items.product",
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
