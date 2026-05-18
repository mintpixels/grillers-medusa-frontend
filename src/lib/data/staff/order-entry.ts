"use server"

import "server-only"

import { sdk } from "@lib/config"
import { retrieveAuthenticatedCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { sendEmail } from "@lib/postmark"
import { staffDisplayName, isStaffCustomer } from "@lib/util/staff-access"
import { stripPhone } from "@lib/util/format-phone"
import medusaError from "@lib/util/medusa-error"
import type { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getCacheTag } from "../cookies"
import { signStaffCartHandoff } from "./order-token"

type AnyRecord = Record<string, any>

export type StaffCustomerSummary = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
  defaultAddress?: StaffAddressInput
  source: "customer" | "order" | "legacy_order"
  matchedLegacyOrderId?: string
  matchedLegacyOrderDisplayId?: string
}

export type StaffRecentOrder = {
  id: string
  displayId: string
  createdAt: string
  status: string
  total: number
  currencyCode: string
  items: StaffRecentOrderItem[]
  shippingAddress?: StaffAddressInput
}

export type StaffRecentOrderItem = {
  title: string
  quantity: number
  variantId?: string
  sku?: string
}

export type StaffLegacyOrderItem = {
  id: string
  title: string
  description?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  sku?: string
  mappingStatus?: string
  lineKind?: string
  variantId?: string
  purchaseHistoryKey?: string
  legacyOrderId?: string
}

export type StaffLegacyOrder = {
  id: string
  displayId: string
  placedAt: string
  status: string
  total: number
  currencyCode: string
  lineCount: number
  customerName: string
  email: string
  items: StaffLegacyOrderItem[]
}

export type StaffCustomerContext = StaffCustomerSummary & {
  recentOrders: StaffRecentOrder[]
  legacyOrders: StaffLegacyOrder[]
}

export type StaffProductSearchResult = {
  productId: string
  title: string
  handle: string
  thumbnail?: string
  variantId: string
  variantTitle: string
  sku: string
  inventoryQuantity?: number
  manageInventory?: boolean
  allowBackorder?: boolean
  calculatedAmount?: number
  currencyCode?: string
}

export type StaffAddressInput = {
  id?: string
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  province: string
  postalCode: string
  countryCode: string
  phone?: string
}

export type StaffOrderLineInput = {
  variantId: string
  quantity: number
  title: string
  sku?: string
  source?: "product_search" | "legacy_order_history"
  legacyPurchaseHistoryKey?: string
  legacyOrderId?: string
  legacyOrderLineId?: string
}

export type StaffPaymentMode = "send_checkout_link" | "collect_card_now"

export type StaffPrepareOrderInput = {
  countryCode: string
  customer: {
    id?: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    company?: string
  }
  shippingAddress: StaffAddressInput
  billingAddress?: StaffAddressInput
  sameAsShipping: boolean
  lines: StaffOrderLineInput[]
  fulfillmentType:
    | "plant_pickup"
    | "atlanta_delivery"
    | "ups_shipping"
    | "southeast_pickup"
  scheduledDate?: string
  scheduledTimeWindow?: string
  pickupLocationId?: string
  customerVerified: boolean
  paymentMode: StaffPaymentMode
  paymentConsent: boolean
  sendConfirmation: boolean
  orderNotes?: string
  substitutionPreference?: string
  deliveryInstructions?: string
  giftNotes?: string
}

export type StaffPrepareOrderResult = {
  ok: boolean
  cartId?: string
  checkoutUrl?: string
  cart?: HttpTypes.StoreCart
  paymentProviderId?: string
  paymentClientSecret?: string
  confirmationSent?: boolean
  confirmationMessage?: string
  error?: string
}

export type StaffCompleteOrderResult = {
  ok: boolean
  orderId?: string
  displayId?: string
  confirmationSent?: boolean
  confirmationMessage?: string
  error?: string
}

const MEDUSA_BACKEND_URL = (
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/+$/, "")

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

function adminToken(): string {
  const token =
    process.env.MEDUSA_ADMIN_API_TOKEN || process.env.MEDUSA_API_TOKEN || ""

  if (!token) {
    throw new Error(
      "MEDUSA_ADMIN_API_TOKEN missing. Staff order entry cannot access customer or inventory data."
    )
  }

  return token
}

function storeHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  }
}

function adminHeaders(): HeadersInit {
  const token = adminToken()
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
  }
}

function queryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(`${key}[]`, String(item)))
      return
    }
    search.set(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

async function adminFetch<T>(
  path: string,
  init: RequestInit & { query?: Record<string, unknown> } = {}
): Promise<T> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}${path}${queryString(init.query || {})}`,
    {
      ...init,
      headers: {
        ...adminHeaders(),
        ...(init.headers || {}),
      },
      cache: "no-store",
    }
  )

  const json = (await res.json().catch(() => ({}))) as AnyRecord
  if (!res.ok) {
    throw new Error(json.message || json.error || res.statusText)
  }
  return json as T
}

async function storeFetch<T>(
  path: string,
  init: RequestInit & { query?: Record<string, unknown> } = {}
): Promise<T> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}${path}${queryString(init.query || {})}`,
    {
      ...init,
      headers: {
        ...storeHeaders(),
        ...(init.headers || {}),
      },
      cache: "no-store",
    }
  )

  const json = (await res.json().catch(() => ({}))) as AnyRecord
  if (!res.ok) {
    throw new Error(json.message || json.error || res.statusText)
  }
  return json as T
}

async function requireStaff() {
  const customer = await retrieveAuthenticatedCustomer()
  if (!customer) {
    throw new Error("Sign in with a staff account to use phone order entry.")
  }
  if (!isStaffCustomer(customer)) {
    throw new Error("Staff access required.")
  }
  return customer
}

function toStaffAddress(
  address: AnyRecord | null | undefined
): StaffAddressInput | undefined {
  if (!address) return undefined
  return {
    id: address.id,
    firstName: address.first_name || "",
    lastName: address.last_name || "",
    company: address.company || "",
    address1: address.address_1 || "",
    address2: address.address_2 || "",
    city: address.city || "",
    province: address.province || "",
    postalCode: address.postal_code || "",
    countryCode: (address.country_code || "us").toLowerCase(),
    phone: address.phone || "",
  }
}

function appendAuditLog(
  metadata: AnyRecord | null | undefined,
  entry: AnyRecord
): AnyRecord {
  const existing = { ...(metadata || {}) }
  let audit: AnyRecord[] = []
  if (typeof existing.staff_audit_log === "string") {
    try {
      const parsed = JSON.parse(existing.staff_audit_log)
      if (Array.isArray(parsed)) audit = parsed
    } catch {
      audit = []
    }
  }

  audit.push({ at: new Date().toISOString(), ...entry })
  return {
    ...existing,
    staff_audit_log: JSON.stringify(audit.slice(-50)),
  }
}

function toStoreAddress(address: StaffAddressInput): AnyRecord {
  return {
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company || "",
    address_1: address.address1,
    address_2: address.address2 || "",
    city: address.city,
    province: address.province,
    postal_code: address.postalCode,
    country_code: (address.countryCode || "us").toLowerCase(),
    phone: address.phone ? stripPhone(address.phone) : "",
  }
}

function customerSummary(
  customer: AnyRecord,
  source: StaffCustomerSummary["source"]
): StaffCustomerSummary {
  const defaultAddress =
    customer.addresses?.find((addr: AnyRecord) => addr.is_default_shipping) ||
    customer.addresses?.[0] ||
    customer.shipping_address

  return {
    id: customer.id,
    email: customer.email || "",
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    phone: customer.phone || defaultAddress?.phone || "",
    company: customer.company_name || defaultAddress?.company || "",
    defaultAddress: toStaffAddress(defaultAddress),
    source,
  }
}

function splitLegacyCustomerName(name: string | null | undefined) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) {
    return { firstName: "", lastName: "" }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  }
}

function legacyOrderCustomerSummary(
  order: AnyRecord
): StaffCustomerSummary | null {
  const medusaCustomerId = String(order.medusa_customer_id || "").trim()
  const fallbackEmail = String(order.email_lower || "").trim()
  const fallbackName = splitLegacyCustomerName(order.customer_name)

  if (!medusaCustomerId && !fallbackEmail && !order.customer_name) {
    return null
  }

  return {
    id: medusaCustomerId || `legacy-order:${order.id}`,
    email: fallbackEmail,
    firstName: fallbackName.firstName,
    lastName: fallbackName.lastName,
    phone: "",
    company: "",
    source: "legacy_order",
    matchedLegacyOrderId: order.id,
    matchedLegacyOrderDisplayId:
      order.ref_number || order.qbd_txn_id || order.legacy_order_id || order.id,
  }
}

function lineKind(
  metadata: AnyRecord | null | undefined,
  mappingStatus?: string
) {
  return (
    metadata?.line_kind ||
    (mappingStatus === "non_product" ? "non_product" : "product")
  )
}

function legacyOrderSummary(order: AnyRecord): StaffLegacyOrder {
  return {
    id: order.id,
    displayId:
      order.ref_number || order.qbd_txn_id || order.legacy_order_id || order.id,
    placedAt: order.placed_at || "",
    status: order.status || "imported",
    total: currencyAmount(order.total),
    currencyCode: order.currency_code || "usd",
    lineCount: Number(order.line_count || order.lines?.length || 0),
    customerName: order.customer_name || "",
    email: order.email_lower || "",
    items: (order.lines || []).map((line: AnyRecord) => ({
      id: line.id,
      title:
        line.medusa_variant_title ||
        line.medusa_product_title ||
        line.title ||
        line.description ||
        "Legacy item",
      description:
        line.description && line.description !== line.title
          ? line.description
          : undefined,
      quantity: Number(line.quantity || 0),
      unitPrice: currencyAmount(line.unit_price),
      lineTotal: currencyAmount(line.line_total),
      sku: line.sku || undefined,
      mappingStatus: line.mapping_status || undefined,
      lineKind: lineKind(line.metadata, line.mapping_status),
      variantId: line.medusa_variant_id || undefined,
      purchaseHistoryKey: line.purchase_history_key || undefined,
      legacyOrderId: line.legacy_order_id || order.id,
    })),
  }
}

function currencyAmount(amount: number | null | undefined): number {
  if (!Number.isFinite(Number(amount))) return 0
  return Number(amount)
}

function shortName(address: StaffAddressInput): string {
  return [address.firstName, address.lastName].filter(Boolean).join(" ").trim()
}

function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("Enter a valid customer email before preparing the order.")
  }
  return trimmed
}

function validateAddress(address: StaffAddressInput, label: string) {
  if (!address.firstName.trim() || !address.lastName.trim()) {
    throw new Error(`${label} needs a first and last name.`)
  }
  if (!address.address1.trim()) {
    throw new Error(`${label} needs a street address.`)
  }
  if (
    !address.city.trim() ||
    !address.province.trim() ||
    !address.postalCode.trim()
  ) {
    throw new Error(`${label} needs city, state, and ZIP.`)
  }
}

function metadataText(value?: string): string | undefined {
  const trimmed = (value || "").trim()
  return trimmed ? trimmed : undefined
}

function serviceCodesForFulfillment(
  type: StaffPrepareOrderInput["fulfillmentType"]
) {
  switch (type) {
    case "plant_pickup":
      return ["PICKUP"]
    case "atlanta_delivery":
      return ["ATLANTA_DELIVERY", "LOCAL_DELIVERY"]
    case "southeast_pickup":
      return ["SCHEDULED_DELIVERY", "SOUTHEAST_PICKUP"]
    case "ups_shipping":
      return ["GROUND", "UPS_GROUND", "2ND_DAY_AIR", "OVERNIGHT"]
  }
}

async function findStaffShippingOption(
  cartId: string,
  type: StaffPrepareOrderInput["fulfillmentType"]
): Promise<AnyRecord> {
  const { shipping_options } = await storeFetch<{
    shipping_options: AnyRecord[]
  }>("/store/shipping-options", {
    query: {
      cart_id: cartId,
      fields:
        "*service_zone.fulfillment_set.*,*service_zone.fulfillment_set.location.*,*shipping_profile.*",
    },
  })

  const serviceCodes = serviceCodesForFulfillment(type)
  const byServiceCode = shipping_options.find((option) => {
    const serviceCode = option.data?.service_code || option.service_code
    return serviceCode && serviceCodes.includes(serviceCode)
  })
  if (byServiceCode) return byServiceCode

  const byName = shipping_options.find((option) => {
    const name = String(option.name || "").toLowerCase()
    if (type === "plant_pickup")
      return name.includes("pickup") || name.includes("plant")
    if (type === "atlanta_delivery")
      return name.includes("atlanta") || name.includes("local")
    if (type === "southeast_pickup")
      return name.includes("southeast") || name.includes("scheduled")
    return (
      name.includes("ground") || name.includes("ups") || name.includes("ship")
    )
  })
  if (byName) return byName

  if (type === "ups_shipping") {
    const nonPickup = shipping_options.find(
      (option) => option.service_zone?.fulfillment_set?.type !== "pickup"
    )
    if (nonPickup) return nonPickup
  }

  throw new Error(
    `No Medusa shipping option is available for ${type.replace(/_/g, " ")}.`
  )
}

async function retrieveStaffCart(cartId: string): Promise<HttpTypes.StoreCart> {
  const { cart } = await storeFetch<{ cart: HttpTypes.StoreCart }>(
    `/store/carts/${cartId}`,
    {
      query: {
        fields:
          "*items,*items.product,*items.variant,*items.metadata,*region,*shipping_address,*billing_address,*shipping_methods,+subtotal,+total,+shipping_total,+tax_total,+discount_total,*payment_collection,*payment_collection.payment_sessions,+metadata",
      },
    }
  )
  return cart
}

async function listPaymentProviders(regionId: string): Promise<AnyRecord[]> {
  const { payment_providers } = await storeFetch<{
    payment_providers: AnyRecord[]
  }>("/store/payment-providers", { query: { region_id: regionId } })
  return payment_providers || []
}

function buildCheckoutUrl(countryCode: string, token: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://grillers-medusa-frontend.vercel.app"
  const origin = base.startsWith("http") ? base : `https://${base}`
  return `${origin}/api/staff/phone-order/handoff?token=${encodeURIComponent(
    token
  )}`
}

function linesSummary(lines: StaffOrderLineInput[]) {
  return lines
    .map(
      (line) =>
        `${line.quantity} x ${line.title}${line.sku ? ` (${line.sku})` : ""}`
    )
    .join("\n")
}

async function sendReviewLinkEmail({
  to,
  checkoutUrl,
  staffName,
  lines,
  metadata,
}: {
  to: string
  checkoutUrl: string
  staffName: string
  lines: StaffOrderLineInput[]
  metadata: Record<string, string>
}) {
  return sendEmail({
    to,
    subject: "Review your Grillers Pride phone order",
    tag: "staff-phone-order",
    metadata,
    htmlBody: `
      <p>Grillers Pride entered this order on your behalf while speaking with you.</p>
      <p><strong>Staff representative:</strong> ${staffName}</p>
      <pre style="font-family:inherit;white-space:pre-wrap">${linesSummary(
        lines
      )}</pre>
      <p>Please review the items, quantities, fulfillment details, and estimated total before payment.</p>
      <p>Catch-weight items are authorized at the estimate and finalized after packing by actual weight.</p>
      <p><a href="${checkoutUrl}">Review and pay for your order</a></p>
      <p>If anything is wrong, call Grillers Pride before completing checkout.</p>
    `,
    textBody: [
      "Grillers Pride entered this order on your behalf while speaking with you.",
      `Staff representative: ${staffName}`,
      "",
      linesSummary(lines),
      "",
      "Please review the items, quantities, fulfillment details, and estimated total before payment.",
      "Catch-weight items are authorized at the estimate and finalized after packing by actual weight.",
      "",
      checkoutUrl,
      "",
      "If anything is wrong, call Grillers Pride before completing checkout.",
    ].join("\n"),
  })
}

async function sendStaffPaidConfirmation({
  order,
  staffName,
}: {
  order: AnyRecord
  staffName: string
}) {
  const orderId = order.display_id ? `#${order.display_id}` : order.id
  const lines = (order.items || [])
    .map((item: AnyRecord) => `${item.quantity} x ${item.title}`)
    .join("\n")

  return sendEmail({
    to: order.email,
    subject: `Your Grillers Pride order ${orderId}`,
    tag: "staff-phone-order-paid",
    metadata: {
      order_id: order.id,
      display_id: String(order.display_id || ""),
      staff_actor_customer_id: String(
        order.metadata?.staff_actor_customer_id || ""
      ),
      source: "staff_phone_order",
    },
    htmlBody: `
      <p>Grillers Pride processed this phone order on your behalf.</p>
      <p><strong>Staff representative:</strong> ${staffName}</p>
      <p><strong>Order:</strong> ${orderId}</p>
      <pre style="font-family:inherit;white-space:pre-wrap">${lines}</pre>
      <p>Your card was authorized for the estimated amount. Catch-weight items are finalized after packing by actual weight.</p>
      <p>Call Grillers Pride if anything looks wrong.</p>
    `,
    textBody: [
      "Grillers Pride processed this phone order on your behalf.",
      `Staff representative: ${staffName}`,
      `Order: ${orderId}`,
      "",
      lines,
      "",
      "Your card was authorized for the estimated amount. Catch-weight items are finalized after packing by actual weight.",
      "Call Grillers Pride if anything looks wrong.",
    ].join("\n"),
  })
}

export async function searchStaffCustomers(
  query: string
): Promise<StaffCustomerSummary[]> {
  await requireStaff()

  const q = query.trim()
  if (q.length < 2) return []

  const seen = new Set<string>()
  const results: StaffCustomerSummary[] = []

  const addSummary = (summary: StaffCustomerSummary) => {
    if (!summary.id || seen.has(summary.id)) return
    seen.add(summary.id)
    results.push(summary)
  }

  const add = (customer: AnyRecord, source: StaffCustomerSummary["source"]) => {
    if (!customer?.id || seen.has(customer.id)) return
    addSummary(customerSummary(customer, source))
  }

  const customerResp = await adminFetch<{ customers: AnyRecord[] }>(
    "/admin/customers",
    {
      query: {
        q,
        limit: 12,
        fields:
          "id,email,first_name,last_name,phone,company_name,metadata,*addresses",
      },
    }
  )
  customerResp.customers?.forEach((customer) => add(customer, "customer"))

  const orderResp = await adminFetch<{ orders: AnyRecord[] }>("/admin/orders", {
    query: {
      q,
      limit: 8,
      fields:
        "id,display_id,email,customer_id,*customer,*shipping_address,*billing_address",
    },
  }).catch(() => ({ orders: [] }))

  orderResp.orders?.forEach((order) => {
    if (order.customer) add(order.customer, "order")
    else if (order.customer_id || order.email) {
      add(
        {
          id: order.customer_id || `order:${order.id}`,
          email: order.email,
          shipping_address: order.shipping_address,
        },
        "order"
      )
    }
  })

  const legacyOrderResp = await adminFetch<{ orders: AnyRecord[] }>(
    "/admin/legacy-orders",
    {
      query: {
        q,
        limit: 8,
      },
    }
  ).catch(() => ({ orders: [] }))

  legacyOrderResp.orders?.forEach((order) => {
    const summary = legacyOrderCustomerSummary(order)
    if (summary) addSummary(summary)
  })

  return results.slice(0, 15)
}

export async function createStaffCustomer(input: {
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
}): Promise<StaffCustomerSummary> {
  const staff = await requireStaff()
  const email = validateEmail(input.email)

  const { customer } = await adminFetch<{ customer: AnyRecord }>(
    "/admin/customers",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone ? stripPhone(input.phone) : undefined,
        company_name: metadataText(input.company),
        metadata: {
          source: "staff_phone_order",
          created_by_staff_customer_id: staff.id,
          created_by_staff_email: staff.email,
          created_at: new Date().toISOString(),
        },
      }),
    }
  )

  return customerSummary(customer, "customer")
}

export async function getStaffCustomerContext(
  customerId: string,
  options: { includeLegacyOrderId?: string } = {}
): Promise<StaffCustomerContext> {
  await requireStaff()

  const { customer } = await adminFetch<{ customer: AnyRecord }>(
    `/admin/customers/${customerId}`,
    {
      query: {
        fields:
          "id,email,first_name,last_name,phone,company_name,metadata,*addresses",
      },
    }
  )

  const { orders } = await adminFetch<{ orders: AnyRecord[] }>(
    "/admin/orders",
    {
      query: {
        customer_id: customerId,
        limit: 5,
        order: "-created_at",
        fields:
          "id,display_id,email,total,currency_code,created_at,status,*shipping_address,*items,*items.variant",
      },
    }
  ).catch(() => ({ orders: [] }))

  const legacyOrderList = await adminFetch<{ orders: AnyRecord[] }>(
    "/admin/legacy-orders",
    {
      query: {
        customer_id: customerId,
        limit: 5,
        offset: 0,
      },
    }
  ).catch(() => ({ orders: [] }))

  const legacyOrderStubs = [...(legacyOrderList.orders || []).slice(0, 5)]
  const includeLegacyOrderId = options.includeLegacyOrderId?.trim()
  if (
    includeLegacyOrderId &&
    !legacyOrderStubs.some((order) => order.id === includeLegacyOrderId)
  ) {
    legacyOrderStubs.unshift({ id: includeLegacyOrderId })
  }

  const legacyOrders = await Promise.all(
    legacyOrderStubs.slice(0, 6).map(async (order) => {
      const id = String(order.id || "")
      if (!id) return order

      return adminFetch<{ order: AnyRecord }>(`/admin/legacy-orders/${id}`)
        .then((response) => response.order || order)
        .catch(() => order)
    })
  )

  return {
    ...customerSummary(customer, "customer"),
    recentOrders: (orders || []).map((order) => ({
      id: order.id,
      displayId: order.display_id ? `#${order.display_id}` : order.id,
      createdAt: order.created_at,
      status: order.status || "",
      total: currencyAmount(order.total),
      currencyCode: order.currency_code || "usd",
      shippingAddress: toStaffAddress(order.shipping_address),
      items: (order.items || []).map((item: AnyRecord) => ({
        title: item.title || item.product_title || "Item",
        quantity: Number(item.quantity || 1),
        variantId: item.variant_id || item.variant?.id,
        sku: item.variant?.sku || item.variant_sku,
      })),
    })),
    legacyOrders: legacyOrders.map(legacyOrderSummary),
  }
}

export async function getStaffLegacyOrderContext(
  legacyOrderId: string
): Promise<StaffCustomerContext> {
  await requireStaff()

  const id = legacyOrderId.trim()
  if (!id) {
    throw new Error("Missing legacy order ID.")
  }

  const { order } = await adminFetch<{ order: AnyRecord }>(
    `/admin/legacy-orders/${id}`
  )
  const summary = legacyOrderCustomerSummary(order)
  if (!summary) {
    throw new Error("Legacy order has no customer context.")
  }

  return {
    ...summary,
    recentOrders: [],
    legacyOrders: [legacyOrderSummary(order)],
  }
}

export async function updateStaffCustomerProfile(input: {
  customerId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
}): Promise<{ ok: boolean; customer?: StaffCustomerContext; error?: string }> {
  try {
    const staff = await requireStaff()
    if (!input.customerId) throw new Error("Missing customer ID.")
    const email = validateEmail(input.email)

    const current = await adminFetch<{ customer: AnyRecord }>(
      `/admin/customers/${input.customerId}`,
      { query: { fields: "id,email,metadata" } }
    )

    await adminFetch(`/admin/customers/${input.customerId}`, {
      method: "POST",
      body: JSON.stringify({
        email,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone ? stripPhone(input.phone) : "",
        company_name: metadataText(input.company) || "",
        metadata: appendAuditLog(current.customer?.metadata, {
          type: "staff_customer_profile_update",
          staffCustomerId: staff.id,
          staffEmail: staff.email,
          targetCustomerId: input.customerId,
        }),
      }),
    })

    return {
      ok: true,
      customer: await getStaffCustomerContext(input.customerId),
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Could not update customer profile.",
    }
  }
}

export async function saveStaffCustomerAddress(input: {
  customerId: string
  address: StaffAddressInput
}): Promise<{ ok: boolean; customer?: StaffCustomerContext; error?: string }> {
  try {
    const staff = await requireStaff()
    if (!input.customerId) throw new Error("Missing customer ID.")
    validateAddress(input.address, "Customer address")

    const current = await adminFetch<{ customer: AnyRecord }>(
      `/admin/customers/${input.customerId}`,
      { query: { fields: "id,email,metadata,*addresses" } }
    )

    const body = {
      ...toStoreAddress(input.address),
      is_default_shipping: true,
      is_default_billing: true,
    }

    const path = input.address.id
      ? `/admin/customers/${input.customerId}/addresses/${input.address.id}`
      : `/admin/customers/${input.customerId}/addresses`

    await adminFetch(path, {
      method: "POST",
      body: JSON.stringify(body),
    })

    await adminFetch(`/admin/customers/${input.customerId}`, {
      method: "POST",
      body: JSON.stringify({
        metadata: appendAuditLog(current.customer?.metadata, {
          type: input.address.id
            ? "staff_customer_address_update"
            : "staff_customer_address_create",
          staffCustomerId: staff.id,
          staffEmail: staff.email,
          targetCustomerId: input.customerId,
          addressId: input.address.id || null,
        }),
      }),
    })

    return {
      ok: true,
      customer: await getStaffCustomerContext(input.customerId),
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Could not save customer address.",
    }
  }
}

export async function searchStaffProducts(
  query: string,
  countryCode: string
): Promise<StaffProductSearchResult[]> {
  await requireStaff()
  const q = query.trim()
  if (q.length < 2) return []

  const region = await getRegion(countryCode || "us")
  if (!region) return []

  const { products } = await storeFetch<{ products: AnyRecord[] }>(
    "/store/products",
    {
      query: {
        q,
        region_id: region.id,
        limit: 16,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,thumbnail,handle,title",
      },
    }
  )

  return (products || []).flatMap((product) =>
    (product.variants || []).map((variant: AnyRecord) => ({
      productId: product.id,
      title: product.title || "",
      handle: product.handle || "",
      thumbnail: product.thumbnail || undefined,
      variantId: variant.id,
      variantTitle: variant.title || "Default",
      sku: variant.sku || "",
      inventoryQuantity:
        typeof variant.inventory_quantity === "number"
          ? variant.inventory_quantity
          : undefined,
      manageInventory: Boolean(variant.manage_inventory),
      allowBackorder: Boolean(variant.allow_backorder),
      calculatedAmount:
        typeof variant.calculated_price?.calculated_amount === "number"
          ? variant.calculated_price.calculated_amount
          : undefined,
      currencyCode:
        variant.calculated_price?.currency_code ||
        region.currency_code ||
        "usd",
    }))
  )
}

export async function prepareStaffPhoneOrder(
  input: StaffPrepareOrderInput
): Promise<StaffPrepareOrderResult> {
  try {
    const staff = await requireStaff()
    const email = validateEmail(input.customer.email)
    const countryCode = (input.countryCode || "us").toLowerCase()
    const region = await getRegion(countryCode)
    if (!region) throw new Error(`No Medusa region found for ${countryCode}.`)

    if (!input.customerVerified) {
      throw new Error(
        "Mark the customer as verified before preparing a staff order."
      )
    }
    if (input.paymentMode === "collect_card_now" && !input.paymentConsent) {
      throw new Error("Card collection requires explicit customer consent.")
    }
    if (!input.lines.length) {
      throw new Error("Add at least one product before preparing the order.")
    }
    input.lines.forEach((line) => {
      if (!line.variantId || line.quantity < 1) {
        throw new Error("Every order line needs a variant and quantity.")
      }
    })

    validateAddress(input.shippingAddress, "Shipping address")
    const billingAddress =
      input.sameAsShipping || !input.billingAddress
        ? input.shippingAddress
        : input.billingAddress
    validateAddress(billingAddress, "Billing address")

    const staffName = staffDisplayName(staff)
    const createdAt = new Date().toISOString()
    const metadata: AnyRecord = {
      source: "staff_phone_order",
      staff_phone_order: true,
      staff_actor_customer_id: staff.id,
      staff_actor_email: staff.email,
      staff_actor_name: staffName,
      staff_selected_customer_id: input.customer.id || "",
      staff_selected_customer_email: email,
      staff_customer_verified: true,
      staff_customer_verified_at: createdAt,
      staff_payment_mode: input.paymentMode,
      staff_payment_consent: input.paymentMode === "collect_card_now",
      staff_payment_policy:
        input.paymentMode === "collect_card_now"
          ? "staff_collect_card_by_phone"
          : "customer_checkout_link",
      staff_confirmation_status:
        input.paymentMode === "collect_card_now"
          ? "pending_order_complete"
          : "pending_review",
      staff_audit_log: JSON.stringify([
        {
          at: createdAt,
          type: "staff_cart_prepared",
          staffCustomerId: staff.id,
          staffEmail: staff.email,
          targetCustomerId: input.customer.id || null,
          targetCustomerEmail: email,
          paymentMode: input.paymentMode,
        },
      ]),
      fulfillmentType: input.fulfillmentType,
      fulfillmentZip: input.shippingAddress.postalCode,
      scheduledDate: metadataText(input.scheduledDate) || "",
      scheduledTimeWindow: metadataText(input.scheduledTimeWindow) || "",
      pickupLocationId: metadataText(input.pickupLocationId) || "",
      orderNotes: metadataText(input.orderNotes),
      substitutionPreference: metadataText(input.substitutionPreference),
      deliveryInstructions: metadataText(input.deliveryInstructions),
      giftNotes: metadataText(input.giftNotes),
    }

    const { cart } = await sdk.store.cart.create(
      {
        region_id: region.id,
        email,
        customer_id: input.customer.id || undefined,
        shipping_address: toStoreAddress(input.shippingAddress),
        billing_address: toStoreAddress(billingAddress),
        metadata,
      } as any,
      {},
      {}
    )

    for (const line of input.lines) {
      await sdk.store.cart.createLineItem(
        cart.id,
        {
          variant_id: line.variantId,
          quantity: line.quantity,
          metadata: {
            source: "staff_phone_order",
            staff_actor_customer_id: staff.id,
            staff_selected_customer_id: input.customer.id || "",
            staff_line_title: line.title,
            staff_line_sku: line.sku || "",
            staff_line_source: line.source || "product_search",
            legacy_purchase_history_key: line.legacyPurchaseHistoryKey || "",
            legacy_order_id: line.legacyOrderId || "",
            legacy_order_line_id: line.legacyOrderLineId || "",
          },
        },
        {},
        {}
      )
    }

    const shippingOption = await findStaffShippingOption(
      cart.id,
      input.fulfillmentType
    )
    await sdk.store.cart.addShippingMethod(
      cart.id,
      { option_id: shippingOption.id },
      {},
      {}
    )

    let preparedCart = await retrieveStaffCart(cart.id)
    let paymentClientSecret: string | undefined
    let paymentProviderId: string | undefined

    if (input.paymentMode === "collect_card_now") {
      const providers = await listPaymentProviders(region.id)
      const provider =
        providers.find((p) => String(p.id).startsWith("pp_stripe_")) ||
        providers.find((p) => !String(p.id).startsWith("pp_system_default"))

      if (!provider?.id) {
        throw new Error(
          "No card payment provider is configured for this region."
        )
      }

      paymentProviderId = provider.id
      await sdk.store.payment.initiatePaymentSession(
        preparedCart,
        {
          provider_id: provider.id,
          data: {
            setup_future_usage: "off_session",
            staff_phone_order: true,
          },
        },
        {},
        {}
      )
      preparedCart = await retrieveStaffCart(cart.id)
      const session = preparedCart.payment_collection?.payment_sessions?.find(
        (s: any) => s.status === "pending" && s.provider_id === provider.id
      )
      paymentClientSecret = session?.data?.client_secret as string | undefined
      if (!paymentClientSecret) {
        throw new Error("Stripe did not return a payment client secret.")
      }
    }

    let checkoutUrl: string | undefined
    let confirmationSent = false
    let confirmationMessage: string | undefined

    if (input.paymentMode === "send_checkout_link") {
      const token = signStaffCartHandoff({
        cartId: cart.id,
        countryCode,
        staffCustomerId: staff.id,
        targetCustomerId: input.customer.id,
        targetCustomerEmail: email,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
      })
      checkoutUrl = buildCheckoutUrl(countryCode, token)

      if (input.sendConfirmation) {
        const result = await sendReviewLinkEmail({
          to: email,
          checkoutUrl,
          staffName,
          lines: input.lines,
          metadata: {
            cart_id: cart.id,
            source: "staff_phone_order",
            staff_actor_customer_id: staff.id,
            target_customer_id: input.customer.id || "",
          },
        })
        confirmationSent = result.ok
        confirmationMessage = result.message || result.messageId
        await sdk.store.cart.update(
          cart.id,
          {
            metadata: {
              staff_confirmation_status: result.ok ? "sent" : "send_failed",
              staff_confirmation_channel: "email",
              staff_confirmation_sent_at: result.ok
                ? new Date().toISOString()
                : "",
              staff_confirmation_message_id: result.messageId || "",
              staff_confirmation_error: result.ok
                ? ""
                : result.message || "unknown",
            },
          } as any,
          {},
          {}
        )
        preparedCart = await retrieveStaffCart(cart.id)
      }
    }

    return {
      ok: true,
      cartId: cart.id,
      checkoutUrl,
      cart: preparedCart,
      paymentProviderId,
      paymentClientSecret,
      confirmationSent,
      confirmationMessage,
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Could not prepare staff order.",
    }
  }
}

export async function completeStaffPhoneOrder(
  cartId: string
): Promise<StaffCompleteOrderResult> {
  try {
    const staff = await requireStaff()
    const cart = await retrieveStaffCart(cartId)
    const metadata = (cart.metadata || {}) as AnyRecord

    if (metadata.source !== "staff_phone_order") {
      throw new Error("This cart is not a staff phone order.")
    }
    if (metadata.staff_actor_customer_id !== staff.id) {
      throw new Error(
        "Only the staff member who prepared this cart can complete it."
      )
    }

    await sdk.store.cart.update(
      cartId,
      {
        metadata: {
          staff_payment_completed_by_customer_id: staff.id,
          staff_payment_completed_at: new Date().toISOString(),
          staff_confirmation_status: "pending_email",
        },
      } as any,
      {},
      {}
    )

    const completeResult = await sdk.store.cart
      .complete(cartId, {}, {})
      .catch((err) => {
        throw medusaError(err)
      })

    if (completeResult?.type !== "order") {
      throw new Error("Medusa did not complete the cart into an order.")
    }

    const order = completeResult.order as AnyRecord
    const emailResult = await sendStaffPaidConfirmation({
      order,
      staffName: staffDisplayName(staff),
    })

    const orderTag = await getCacheTag("orders")
    if (orderTag) revalidateTag(orderTag)

    return {
      ok: true,
      orderId: order.id,
      displayId: order.display_id ? `#${order.display_id}` : undefined,
      confirmationSent: emailResult.ok,
      confirmationMessage: emailResult.message || emailResult.messageId,
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Could not complete staff order.",
    }
  }
}
