"use server"

import { sdk } from "@lib/config"
import { getActiveStaffImpersonation } from "@lib/data/customer"
import { adminFetch } from "@lib/data/staff/admin"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "./regions"

export const retrieveOrder = async (id: string) => {
  const active = await getActiveStaffImpersonation()
  if (active) {
    const { order } = await adminFetch<{ order: HttpTypes.StoreOrder }>(
      `/admin/orders/${id}`,
      {
        query: {
          fields:
            "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,+metadata,*shipping_address,*billing_address",
        },
      }
    )

    const metadata = (order?.metadata || {}) as Record<string, unknown>
    if (
      order?.customer_id !== active.session.targetCustomerId &&
      metadata.staff_target_customer_id !== active.session.targetCustomerId &&
      metadata.staff_selected_customer_id !== active.session.targetCustomerId &&
      order?.email !== active.session.targetEmail
    ) {
      throw new Error("Order does not belong to the impersonated customer.")
    }

    return order
  }

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

type OrderListPageResponse = HttpTypes.StoreOrderListResponse & {
  count?: number | string
  limit?: number | string
  offset?: number | string
}

function numericPaginationValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

async function listOrdersPage(
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
): Promise<OrderListPageResponse> {
  const active = await getActiveStaffImpersonation()
  if (active) {
    return adminFetch<OrderListPageResponse>("/admin/orders", {
      query: {
        limit,
        offset,
        order: "-created_at",
        customer_id: active.session.targetCustomerId,
        fields:
          "*items,+items.metadata,*items.variant,*items.product,+metadata",
        ...filters,
      },
    }).then((response) => ({
      ...response,
      orders: response.orders || [],
    }))
  }

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
        fields:
          "*items,+items.metadata,*items.variant,*items.product,+metadata",
        ...filters,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then((response) => ({
      ...response,
      orders: response.orders || [],
    }))
    .catch((err) => medusaError(err))
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
) => {
  const { orders } = await listOrdersPage(limit, offset, filters)
  return orders || []
}

export async function listAllOrders(
  filters?: Record<string, any>,
  pageSize = 100
): Promise<HttpTypes.StoreOrder[]> {
  const limit = Math.min(Math.max(Number(pageSize) || 100, 1), 100)
  const orders: HttpTypes.StoreOrder[] = []
  let offset = 0
  let total: number | null = null

  for (let page = 0; page < 1000; page += 1) {
    const response = await listOrdersPage(limit, offset, filters)
    const pageOrders = response.orders || []

    if (!pageOrders.length) {
      break
    }

    orders.push(...pageOrders)

    const responseCount = numericPaginationValue(response.count)
    if (responseCount !== null) {
      total = responseCount
    }

    offset += pageOrders.length

    if ((total !== null && offset >= total) || pageOrders.length < limit) {
      break
    }
  }

  return orders
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
          fields:
            "*items,+items.metadata,*items.variant,*items.product,+metadata",
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

export type LegacyCustomerOrderLine = {
  id: string
  legacy_order_id: string
  purchase_history_key?: string | null
  qbd_txn_line_id?: string | null
  qbd_item_list_id?: string | null
  sku?: string | null
  title?: string | null
  description?: string | null
  quantity: number
  unit_price: number
  line_total: number
  currency_code: string
  medusa_product_id?: string | null
  medusa_variant_id?: string | null
  medusa_product_title?: string | null
  medusa_variant_title?: string | null
  mapping_status?: string | null
  line_kind?: string | null
  customer_visible?: boolean
  display_title?: string | null
}

export type LegacyCustomerOrder = {
  id: string
  source?: string | null
  source_order_id?: string | null
  qbd_txn_id?: string | null
  ref_number?: string | null
  legacy_order_id?: string | null
  legacy_customer_id?: string | null
  qbd_customer_list_id?: string | null
  medusa_customer_id?: string | null
  email_lower?: string | null
  customer_name?: string | null
  placed_at?: string | null
  ship_date?: string | null
  status?: string | null
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  total: number
  currency_code: string
  line_count: number
  customer_visible_line_count?: number
  imported_at?: string | null
  lines: LegacyCustomerOrderLine[]
}

type LegacyCustomerOrdersResponse = {
  orders?: LegacyCustomerOrder[]
  count?: number
  limit?: number
  offset?: number
}

export type LegacyReorderRequestResult = {
  success: boolean
  status?: string
  requestId?: string
  error?: string
}

export async function requestLegacyReorderAssistance(input: {
  key: string
}): Promise<LegacyReorderRequestResult> {
  const key = input.key?.trim()
  if (!key) {
    return { success: false, error: "Missing purchase history item." }
  }

  const active = await getActiveStaffImpersonation()
  if (active) {
    try {
      const response = await adminFetch<{
        ok?: boolean
        status?: string
        request_id?: string
        message?: string
      }>(`/admin/legacy-order-history/reorder-request`, {
        method: "POST",
        body: JSON.stringify({
          customer_id: active.session.targetCustomerId,
          key,
          staff_actor_customer_id: active.session.staffCustomerId,
          staff_actor_email: active.session.staffEmail,
          staff_actor_name: active.session.staffName,
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          requestId: response.request_id,
          error: response.message || "Could not send request.",
        }
      }

      return {
        success: true,
        status: response.status,
        requestId: response.request_id,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Could not send request.",
      }
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers)) {
    return { success: false, error: "Sign in to request this item." }
  }

  try {
    const response = await sdk.client.fetch<{
      ok?: boolean
      status?: string
      request_id?: string
      message?: string
    }>(`/store/legacy-order-history/reorder-request`, {
      method: "POST",
      headers,
      body: { key },
      cache: "no-store",
    })

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        requestId: response.request_id,
        error: response.message || "Could not send request.",
      }
    }

    return {
      success: true,
      status: response.status,
      requestId: response.request_id,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Could not send request.",
    }
  }
}

async function listLegacyPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const active = await getActiveStaffImpersonation()
  if (active) {
    return adminFetch<LegacyPurchaseHistoryResponse>(
      `/admin/legacy-order-history/purchase-history`,
      {
        query: {
          customer_id: active.session.targetCustomerId,
        },
      }
    )
      .then(({ purchase_history }) => purchase_history ?? [])
      .catch(() => [])
  }

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
  if (item.key) return item.key
  if (item.variantId) return `variant:${item.variantId}`
  if (item.legacyItemId) return `legacy-item:${item.legacyItemId}`
  if (item.sku) return `sku:${item.sku.toLowerCase()}`
  return `${item.title}:${item.lastOrderedAt}`
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

export async function listLegacyCustomerOrders(
  limit = 100,
  offset = 0
): Promise<LegacyCustomerOrdersResponse> {
  const active = await getActiveStaffImpersonation()
  if (active) {
    const response = await adminFetch<LegacyCustomerOrdersResponse>(
      `/admin/legacy-orders`,
      {
        query: {
          customer_id: active.session.targetCustomerId,
          limit,
          offset,
        },
      }
    ).catch(() => ({ orders: [], count: 0, limit, offset }))

    const detailedOrders = await Promise.all(
      (response.orders || []).map((order) =>
        adminFetch<{ order: LegacyCustomerOrder }>(
          `/admin/legacy-orders/${order.id}`
        )
          .then(({ order: detailed }) => detailed || order)
          .catch(() => order)
      )
    )

    return {
      ...response,
      orders: detailedOrders.map((order) => ({
        ...order,
        customer_visible_line_count:
          order.customer_visible_line_count ??
          (order.lines || []).filter((line) => line.customer_visible !== false)
            .length,
        lines: (order.lines || []).filter(
          (line) => line.customer_visible !== false
        ),
      })),
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers)) {
    return { orders: [], count: 0, limit, offset }
  }

  return sdk.client
    .fetch<LegacyCustomerOrdersResponse>(`/store/legacy-order-history/orders`, {
      method: "GET",
      headers,
      query: { limit, offset },
      cache: "no-store",
    })
    .then((response) => response)
    .catch(() => ({ orders: [], count: 0, limit, offset }))
}

export async function listAllLegacyCustomerOrders(
  pageSize = 100
): Promise<LegacyCustomerOrdersResponse> {
  const limit = Math.min(Math.max(Number(pageSize) || 100, 1), 100)
  const orders: LegacyCustomerOrder[] = []
  let offset = 0
  let total: number | null = null

  for (let page = 0; page < 1000; page += 1) {
    const response = await listLegacyCustomerOrders(limit, offset)
    const pageOrders = response.orders || []

    if (!pageOrders.length) {
      break
    }

    orders.push(...pageOrders)

    const responseCount = numericPaginationValue(response.count)
    if (responseCount !== null) {
      total = responseCount
    }

    offset += pageOrders.length

    if ((total !== null && offset >= total) || pageOrders.length < limit) {
      break
    }
  }

  return {
    orders,
    count: total ?? orders.length,
    limit: orders.length,
    offset: 0,
  }
}

/**
 * Fetch all past orders and deduplicate items by variant_id.
 * Returns a list of unique products the customer has ordered, sorted by most recent.
 */
export async function listPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const [orders, legacyHistory] = await Promise.all([
    listAllOrders().catch(() => []),
    listLegacyPurchaseHistory().catch(() => []),
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
    (a, b) =>
      new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime()
  )
}
