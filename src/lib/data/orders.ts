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
          (order.items ?? []).map(
            (item) => item.variant?.product_id || item.product_id
          )
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
        const productId = item.variant?.product_id || item.product_id
        if (!item.variant || !productId) {
          return item
        }

        const prod = productMap.get(productId)
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
  }) as HttpTypes.StoreOrder[]
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
  source?: "medusa" | "legacy" | "medusa+legacy"
  key?: string
  variantId: string
  productId: string
  legacyItemId?: string | null
  sku?: string | null
  title: string
  productTitle: string
  thumbnail: string | null
  lastOrderedAt: string
  timesOrdered: number
  totalQuantity: number
  unitPrice: number
  currencyCode: string
  reorderable?: boolean
  mappingStatus?: string | null
  lastOrderRef?: string | null
  orderCount?: number
  product?: any
  variant?: any
}

type LegacyPurchaseHistoryResponse = {
  purchase_history?: PurchaseHistoryItem[]
}

async function listLegacyPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers)) {
    return []
  }

  return sdk.client
    .fetch<LegacyPurchaseHistoryResponse>(
      `/store/legacy-order-history/purchase-history`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )
    .then(({ purchase_history }) => purchase_history ?? [])
    .catch(() => [])
}

function purchaseHistoryKey(item: PurchaseHistoryItem) {
  if (item.variantId) return `variant:${item.variantId}`
  if (item.legacyItemId) return `legacy-item:${item.legacyItemId}`
  if (item.sku) return `sku:${item.sku.toLowerCase()}`
  return item.key || `${item.title}:${item.lastOrderedAt}`
}

function mergePurchaseHistoryItem(
  map: Map<string, PurchaseHistoryItem>,
  item: PurchaseHistoryItem
) {
  const key = purchaseHistoryKey(item)
  const existing = map.get(key)

  if (!existing) {
    map.set(key, item)
    return
  }

  existing.timesOrdered += item.timesOrdered
  existing.totalQuantity += item.totalQuantity
  existing.orderCount = (existing.orderCount || 0) + (item.orderCount || 0)
  existing.source =
    existing.source === item.source ? existing.source : "medusa+legacy"

  if (new Date(item.lastOrderedAt) > new Date(existing.lastOrderedAt)) {
    existing.lastOrderedAt = item.lastOrderedAt
    existing.unitPrice = item.unitPrice || existing.unitPrice
    existing.lastOrderRef = item.lastOrderRef || existing.lastOrderRef
  }

  existing.productId ||= item.productId
  existing.variantId ||= item.variantId
  existing.productTitle ||= item.productTitle
  existing.title ||= item.title
  existing.thumbnail ||= item.thumbnail
  existing.product ||= item.product
  existing.variant ||= item.variant
  existing.reorderable = Boolean(existing.reorderable || item.reorderable)
  existing.mappingStatus =
    existing.mappingStatus === "mapped" || item.mappingStatus === "mapped"
      ? "mapped"
      : existing.mappingStatus || item.mappingStatus
}

/**
 * Fetch all past orders and deduplicate items by variant_id.
 * Returns a list of unique products the customer has ordered, sorted by most recent.
 */
export async function listPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const [orders, legacyHistory] = await Promise.all([
    listOrders(100, 0),
    listLegacyPurchaseHistory(),
  ])

  const variantMap = new Map<string, PurchaseHistoryItem>()

  for (const order of orders || []) {
    for (const item of order.items || []) {
      const variantId = item.variant_id
      if (!variantId) continue

      const existing = variantMap.get(`variant:${variantId}`)
      const orderDate =
        typeof order.created_at === "string"
          ? order.created_at
          : new Date(order.created_at).toISOString()

      if (existing) {
        existing.timesOrdered += 1
        existing.totalQuantity += item.quantity
        if (orderDate > existing.lastOrderedAt) {
          existing.lastOrderedAt = orderDate
          existing.unitPrice = item.unit_price || existing.unitPrice
        }
      } else {
        mergePurchaseHistoryItem(variantMap, {
          source: "medusa",
          key: `variant:${variantId}`,
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
          reorderable: true,
          mappingStatus: "mapped",
          orderCount: 1,
          product: item.product,
          variant: item.variant,
        })
      }
    }
  }

  for (const item of legacyHistory) {
    mergePurchaseHistoryItem(variantMap, {
      ...item,
      source: item.source || "legacy",
      variantId: item.variantId || "",
      productId: item.productId || "",
      title: item.title || item.productTitle || "Legacy item",
      productTitle: item.productTitle || item.title || "Legacy item",
      thumbnail: item.thumbnail || null,
      reorderable: Boolean(item.reorderable && item.variantId),
      mappingStatus:
        item.mappingStatus || (item.variantId ? "mapped" : "unmapped"),
      orderCount: item.orderCount || item.timesOrdered,
    })
  }

  return Array.from(variantMap.values()).sort(
    (a, b) => new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime()
  )
}
