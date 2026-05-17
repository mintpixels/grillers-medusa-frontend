"use server"

import "server-only"

import { retrieveAuthenticatedCustomer } from "@lib/data/customer"
import { isStaffCustomer, staffDisplayName } from "@lib/util/staff-access"
import { adminFetch, appendStaffAuditLog } from "./admin"
import {
  actionIsBlockedByOperationalState,
  actionMovesMoney,
  actionRequiresCustomerConsent,
  parseStaffAuditLog,
  staffOrderOperationalState,
  type StaffAuditEntry,
  type StaffConsentMethod,
  type StaffExceptionActionType,
  type StaffExceptionReasonCode,
  type StaffOrderOperationalState,
} from "./exception-types"

type AnyRecord = Record<string, any>

export type StaffExceptionOrderSummary = {
  id: string
  displayId: string
  email: string
  customerName: string
  createdAt: string
  updatedAt?: string
  status: string
  fulfillmentStatus: string
  paymentStatus: string
  total: number
  currencyCode: string
  itemCount: number
  operationalState: StaffOrderOperationalState
  latestStaffAction?: string
}

export type StaffExceptionOrderItem = {
  id: string
  title: string
  subtitle?: string
  sku?: string
  quantity: number
  total: number
}

export type StaffExceptionPayment = {
  id: string
  amount: number
  capturedAmount: number
  refundedAmount: number
  currencyCode: string
  providerId?: string
  status?: string
}

export type StaffExceptionAddress = {
  name: string
  company?: string
  line1?: string
  line2?: string
  cityLine?: string
  phone?: string
}

export type StaffExceptionOrderDetail = StaffExceptionOrderSummary & {
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  items: StaffExceptionOrderItem[]
  payments: StaffExceptionPayment[]
  shippingMethods: string[]
  fulfillments: {
    id: string
    status?: string
    shippedAt?: string
    deliveredAt?: string
  }[]
  shippingAddress?: StaffExceptionAddress
  billingAddress?: StaffExceptionAddress
  metadata: AnyRecord
  auditLog: StaffAuditEntry[]
}

export type StaffExceptionActionInput = {
  orderId: string
  action: StaffExceptionActionType
  reasonCode: StaffExceptionReasonCode
  staffNote: string
  customerVisibleNote?: string
  customerConsentMethod?: StaffConsentMethod
  amount?: number
  paymentId?: string
  offlinePaymentMethod?: string
  offlinePaymentReference?: string
  shippingChangeSummary?: string
  notifyCustomer?: boolean
}

export type StaffExceptionActionResult = {
  ok: boolean
  error?: string
  order?: StaffExceptionOrderDetail
}

const ORDER_LIST_FIELDS =
  "id,display_id,email,status,fulfillment_status,payment_status,total,currency_code,created_at,updated_at,+metadata,*customer,*items"

const ORDER_DETAIL_FIELDS =
  "id,display_id,email,status,fulfillment_status,payment_status,total,subtotal,shipping_total,tax_total,discount_total,currency_code,created_at,updated_at,canceled_at,+metadata,*customer,*items,*items.variant,*items.product,*shipping_address,*billing_address,*shipping_methods,*fulfillments,*payment_collections,*payment_collections.payments"

function amount(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function minorUnitsFromDollars(value: unknown): number {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error("Enter a positive amount.")
  }
  return Math.round(number * 100)
}

function displayId(order: AnyRecord): string {
  return order.display_id ? `#${order.display_id}` : order.id
}

function customerName(order: AnyRecord): string {
  const customer = order.customer || {}
  const fromCustomer = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  const fromShipping = [
    order.shipping_address?.first_name,
    order.shipping_address?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
  return fromCustomer || fromShipping || order.email || "Customer"
}

function latestStaffAction(metadata: AnyRecord | null | undefined): string | undefined {
  const latest = parseStaffAuditLog(metadata).slice(-1)[0]
  return latest?.action || latest?.staff_action
}

function summarizeOrder(order: AnyRecord): StaffExceptionOrderSummary {
  const items = Array.isArray(order.items) ? order.items : []
  return {
    id: order.id,
    displayId: displayId(order),
    email: order.email || order.customer?.email || "",
    customerName: customerName(order),
    createdAt: order.created_at || "",
    updatedAt: order.updated_at || "",
    status: order.status || "unknown",
    fulfillmentStatus: order.fulfillment_status || "unknown",
    paymentStatus: order.payment_status || "unknown",
    total: amount(order.total),
    currencyCode: order.currency_code || "usd",
    itemCount: items.reduce((sum: number, item: AnyRecord) => {
      return sum + amount(item.quantity)
    }, 0),
    operationalState: staffOrderOperationalState(order),
    latestStaffAction: latestStaffAction(order.metadata),
  }
}

function toAddress(address: AnyRecord | null | undefined): StaffExceptionAddress | undefined {
  if (!address) return undefined
  const cityLine = [
    address.city,
    address.province,
    address.postal_code,
    address.country_code?.toUpperCase?.(),
  ]
    .filter(Boolean)
    .join(", ")
  return {
    name: [address.first_name, address.last_name].filter(Boolean).join(" "),
    company: address.company || "",
    line1: address.address_1 || "",
    line2: address.address_2 || "",
    cityLine,
    phone: address.phone || "",
  }
}

function collectPayments(order: AnyRecord): StaffExceptionPayment[] {
  const collections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : []

  return collections.flatMap((collection: AnyRecord) => {
    const payments = Array.isArray(collection.payments) ? collection.payments : []
    return payments.map((payment: AnyRecord) => {
      const refunds = Array.isArray(payment.refunds) ? payment.refunds : []
      const refundedAmount =
        amount(payment.refunded_amount) ||
        refunds.reduce((sum: number, refund: AnyRecord) => sum + amount(refund.amount), 0)

      return {
        id: payment.id,
        amount: amount(payment.amount),
        capturedAmount: amount(payment.captured_amount || payment.amount),
        refundedAmount,
        currencyCode: payment.currency_code || collection.currency_code || "usd",
        providerId: payment.provider_id || payment.provider || collection.provider_id,
        status: payment.status,
      }
    })
  })
}

function detailOrder(order: AnyRecord): StaffExceptionOrderDetail {
  const summary = summarizeOrder(order)
  const items = Array.isArray(order.items) ? order.items : []
  const shippingMethods = Array.isArray(order.shipping_methods)
    ? order.shipping_methods
        .map((method: AnyRecord) => method.name || method.shipping_option?.name)
        .filter(Boolean)
    : []
  const fulfillments = Array.isArray(order.fulfillments)
    ? order.fulfillments.map((fulfillment: AnyRecord) => ({
        id: fulfillment.id,
        status: fulfillment.status,
        shippedAt: fulfillment.shipped_at,
        deliveredAt: fulfillment.delivered_at,
      }))
    : []

  return {
    ...summary,
    subtotal: amount(order.subtotal),
    shippingTotal: amount(order.shipping_total),
    taxTotal: amount(order.tax_total),
    discountTotal: amount(order.discount_total),
    items: items.map((item: AnyRecord) => ({
      id: item.id,
      title: item.title || item.product_title || item.variant?.product?.title || "Item",
      subtitle: item.subtitle || item.variant_title || item.variant?.title,
      sku: item.variant?.sku || item.sku,
      quantity: amount(item.quantity),
      total: amount(item.total),
    })),
    payments: collectPayments(order),
    shippingMethods,
    fulfillments,
    shippingAddress: toAddress(order.shipping_address),
    billingAddress: toAddress(order.billing_address),
    metadata: order.metadata || {},
    auditLog: parseStaffAuditLog(order.metadata),
  }
}

async function requireStaffOperator() {
  const staff = await retrieveAuthenticatedCustomer()
  if (!staff) {
    throw new Error("Sign in with a staff account to use staff exceptions.")
  }
  if (!isStaffCustomer(staff)) {
    throw new Error("Staff access required.")
  }
  return staff
}

async function retrieveOrder(orderId: string): Promise<AnyRecord> {
  const { order } = await adminFetch<{ order: AnyRecord }>(`/admin/orders/${orderId}`, {
    query: { fields: ORDER_DETAIL_FIELDS },
  })
  if (!order) throw new Error("Order not found.")
  return order
}

async function updateOrderMetadata(
  orderId: string,
  metadata: AnyRecord
): Promise<AnyRecord> {
  try {
    const { order } = await adminFetch<{ order: AnyRecord }>(
      `/admin/orders/${orderId}`,
      {
        method: "POST",
        body: JSON.stringify({ metadata }),
        query: { fields: ORDER_DETAIL_FIELDS },
      }
    )
    return order
  } catch {
    const { order } = await adminFetch<{ order: AnyRecord }>(
      `/admin/orders/${orderId}/metadata`,
      {
        method: "POST",
        body: JSON.stringify({ metadata }),
        query: { fields: ORDER_DETAIL_FIELDS },
      }
    )
    return order
  }
}

async function appendOrderAudit(
  orderId: string,
  entry: AnyRecord,
  patch: AnyRecord = {}
): Promise<AnyRecord> {
  const order = await retrieveOrder(orderId)
  const metadata = appendStaffAuditLog(order.metadata, entry)
  return updateOrderMetadata(orderId, {
    ...metadata,
    ...patch,
    staff_last_exception_action: entry.action,
    staff_last_exception_at: new Date().toISOString(),
  })
}

function baseAuditEntry({
  staff,
  input,
  order,
  status,
}: {
  staff: AnyRecord
  input: StaffExceptionActionInput
  order: AnyRecord
  status: "requested" | "completed" | "recorded"
}): AnyRecord {
  return {
    action: input.action,
    status,
    reason_code: input.reasonCode,
    staff_note: input.staffNote.trim(),
    customer_visible_note: input.customerVisibleNote?.trim() || undefined,
    notify_customer: Boolean(input.notifyCustomer),
    customer_consent_method: input.customerConsentMethod || "not_applicable",
    staff_actor_customer_id: staff.id,
    staff_actor_email: staff.email,
    staff_actor_name: staffDisplayName(staff as any),
    order_id: order.id,
    order_display_id: displayId(order),
    order_operational_state: staffOrderOperationalState(order),
  }
}

function validateAction(input: StaffExceptionActionInput, order: AnyRecord) {
  if (!input.orderId) throw new Error("Choose an order first.")
  if (!input.reasonCode) throw new Error("Choose a reason code.")
  if (!input.staffNote?.trim()) throw new Error("Add an internal staff note.")

  const state = staffOrderOperationalState(order)
  if (actionIsBlockedByOperationalState(input.action, state)) {
    throw new Error(
      "That action is blocked for the current fulfillment state. Record a note or credit follow-up instead."
    )
  }

  if (
    actionRequiresCustomerConsent(input.action) &&
    (!input.customerConsentMethod ||
      input.customerConsentMethod === "not_applicable")
  ) {
    throw new Error("Record how the customer authorized this action.")
  }

  if (actionMovesMoney(input.action) && input.action !== "record_offline_payment") {
    minorUnitsFromDollars(input.amount)
  }

  if (input.action === "record_offline_payment") {
    minorUnitsFromDollars(input.amount)
    if (!input.offlinePaymentMethod?.trim()) {
      throw new Error("Choose or enter an offline payment method.")
    }
  }

  if (input.action === "shipping_override" && !input.shippingChangeSummary?.trim()) {
    throw new Error("Summarize the shipping change.")
  }
}

function refundablePayment(
  order: AnyRecord,
  paymentId?: string
): StaffExceptionPayment {
  const payments = collectPayments(order)
  const selected = paymentId
    ? payments.find((payment) => payment.id === paymentId)
    : payments.find((payment) => payment.capturedAmount > payment.refundedAmount)

  if (!selected) {
    throw new Error("No refundable captured payment was found for this order.")
  }

  return selected
}

function capturablePayment(
  order: AnyRecord,
  paymentId?: string
): StaffExceptionPayment {
  const payments = collectPayments(order)
  const selected = paymentId ? payments.find((payment) => payment.id === paymentId) : payments[0]

  if (!selected) {
    throw new Error("No payment was found for this order.")
  }

  return selected
}

export async function searchStaffExceptionOrders(
  query: string
): Promise<StaffExceptionOrderSummary[]> {
  await requireStaffOperator()
  const trimmed = query.trim()
  const params: Record<string, unknown> = {
    limit: 20,
    order: "-created_at",
    fields: ORDER_LIST_FIELDS,
  }

  if (trimmed) {
    params.q = trimmed.replace(/^#/, "")
  }

  const { orders } = await adminFetch<{ orders: AnyRecord[] }>("/admin/orders", {
    query: params,
  })

  return (orders || []).map(summarizeOrder)
}

export async function getStaffExceptionOrderDetail(
  orderId: string
): Promise<StaffExceptionOrderDetail> {
  await requireStaffOperator()
  return detailOrder(await retrieveOrder(orderId))
}

export async function applyStaffOrderException(
  input: StaffExceptionActionInput
): Promise<StaffExceptionActionResult> {
  try {
    const staff = await requireStaffOperator()
    const order = await retrieveOrder(input.orderId)
    validateAction(input, order)

    const baseEntry = baseAuditEntry({
      staff,
      input,
      order,
      status:
        input.action === "record_note" ||
        input.action === "record_offline_payment" ||
        input.action === "shipping_override" ||
        input.action === "credit_memo"
          ? "recorded"
          : "requested",
    })

    switch (input.action) {
      case "record_note": {
        await appendOrderAudit(order.id, baseEntry, {
          staff_exception_status: "note_recorded",
        })
        break
      }
      case "record_offline_payment": {
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            amount: minorUnitsFromDollars(input.amount),
            offline_payment_method: input.offlinePaymentMethod?.trim(),
            offline_payment_reference: input.offlinePaymentReference?.trim() || undefined,
          },
          {
            staff_exception_status: "offline_payment_needs_qbd_reconcile",
          }
        )
        break
      }
      case "shipping_override": {
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            shipping_change_summary: input.shippingChangeSummary?.trim(),
          },
          {
            staff_exception_status:
              staffOrderOperationalState(order) === "confirmed"
                ? "shipping_override_recorded"
                : "shipping_override_needs_ops_review",
          }
        )
        break
      }
      case "credit_memo": {
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            amount: minorUnitsFromDollars(input.amount),
          },
          {
            staff_exception_status: "credit_memo_needs_qbd_reconcile",
          }
        )
        break
      }
      case "cancel_order": {
        await appendOrderAudit(order.id, baseEntry, {
          staff_exception_status: "cancel_requested",
        })
        await adminFetch<{ order: AnyRecord }>(`/admin/orders/${order.id}/cancel`, {
          method: "POST",
        })
        await appendOrderAudit(
          order.id,
          {
            ...baseAuditEntry({ staff, input, order, status: "completed" }),
          },
          {
            staff_exception_status: "cancel_completed",
          }
        )
        break
      }
      case "refund_payment": {
        const payment = refundablePayment(order, input.paymentId)
        const refundAmount = minorUnitsFromDollars(input.amount)
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            payment_id: payment.id,
            amount: refundAmount,
          },
          {
            staff_exception_status: "refund_requested",
          }
        )
        await adminFetch<{ payment: AnyRecord }>(
          `/admin/payments/${payment.id}/refund`,
          {
            method: "POST",
            body: JSON.stringify({
              amount: refundAmount,
              note: input.staffNote.trim(),
            }),
          }
        )
        await appendOrderAudit(
          order.id,
          {
            ...baseAuditEntry({ staff, input, order, status: "completed" }),
            payment_id: payment.id,
            amount: refundAmount,
          },
          {
            staff_exception_status: "refund_completed",
          }
        )
        break
      }
      case "capture_payment": {
        const payment = capturablePayment(order, input.paymentId)
        const captureAmount = minorUnitsFromDollars(input.amount)
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            payment_id: payment.id,
            amount: captureAmount,
          },
          {
            staff_exception_status: "capture_requested",
          }
        )
        await adminFetch<{ payment: AnyRecord }>(
          `/admin/payments/${payment.id}/capture`,
          {
            method: "POST",
            body: JSON.stringify({ amount: captureAmount }),
          }
        )
        await appendOrderAudit(
          order.id,
          {
            ...baseAuditEntry({ staff, input, order, status: "completed" }),
            payment_id: payment.id,
            amount: captureAmount,
          },
          {
            staff_exception_status: "capture_completed",
          }
        )
        break
      }
    }

    return {
      ok: true,
      order: await getStaffExceptionOrderDetail(order.id),
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
