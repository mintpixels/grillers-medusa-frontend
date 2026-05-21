"use server"

import "server-only"

import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { isStaffCustomer, staffDisplayName } from "@lib/util/staff-access"
import { adminFetch, appendStaffAuditLog } from "./admin"
import {
  actionIsBlockedByOperationalState,
  actionIsAuditOnly,
  actionMovesMoney,
  actionMutatesMedusa,
  actionRequiredConfirmation,
  actionRequiresQuickBooksPosting,
  actionRequiresCustomerConsent,
  parseStaffAuditLog,
  staffExceptionActionConfig,
  staffOrderOperationalState,
  type StaffAuditEntry,
  type StaffConsentMethod,
  type StaffExceptionActionType,
  type StaffExceptionReasonCode,
  type StaffOrderOperationalState,
} from "./exception-types"

type AnyRecord = Record<string, any>
type StaffActionStatus =
  | "requested"
  | "completed"
  | "recorded"
  | "pending_manual"
  | "failed"

type OrderListResponse = {
  orders?: AnyRecord[]
  count?: number | string
}

export type StaffExceptionOrderSummary = {
  id: string
  source: "medusa" | "legacy"
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

export type StaffExceptionOrderQueueFilter = "open" | "all"
export type StaffExceptionFulfillmentFilter =
  | "all"
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
export type StaffExceptionPaymentFilter =
  | "all"
  | "awaiting_payment"
  | "paid"
  | "refunded"

export type StaffExceptionOrderSearchInput = {
  query?: string
  queue?: StaffExceptionOrderQueueFilter
  fulfillmentStatus?: StaffExceptionFulfillmentFilter
  paymentStatus?: StaffExceptionPaymentFilter
  limit?: number
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
  refundableAmount: number
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
  typedConfirmation?: string
}

export type StaffExceptionActionResult = {
  ok: boolean
  error?: string
  order?: StaffExceptionOrderDetail
}

export type StaffExceptionActionPreview = {
  ok: boolean
  error?: string
  action: StaffExceptionActionType
  actionLabel: string
  operationalState: StaffOrderOperationalState
  orderDisplayId: string
  amount?: number
  paymentId?: string
  willWriteAuditLog: boolean
  willMutateMedusa: boolean
  qbdReconciliationNeeded: boolean
  customerNotificationStatus: "not_requested" | "recorded_only_not_sent"
  requiredConfirmation: string | null
  summary: string
  warnings: string[]
  blockingReasons: string[]
}

const ORDER_LIST_FIELDS =
  "id,display_id,email,status,fulfillment_status,payment_status,total,currency_code,created_at,updated_at,+metadata,*customer,*items"

const ORDER_DETAIL_FIELDS =
  "id,display_id,email,status,fulfillment_status,payment_status,total,subtotal,shipping_total,tax_total,discount_total,currency_code,created_at,updated_at,canceled_at,+metadata,*customer,*items,*items.variant,*items.product,*shipping_address,*billing_address,*shipping_methods,*fulfillments,*payment_collections,*payment_collections.payments"

function amount(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function dollarsToMinorUnits(value: unknown): number {
  return Math.round(amount(value) * 100)
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

function latestStaffAction(
  metadata: AnyRecord | null | undefined
): string | undefined {
  const latest = parseStaffAuditLog(metadata).slice(-1)[0]
  return latest?.action || latest?.staff_action
}

function summarizeOrder(order: AnyRecord): StaffExceptionOrderSummary {
  const items = Array.isArray(order.items) ? order.items : []
  return {
    id: order.id,
    source: "medusa",
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

function legacyDisplayId(order: AnyRecord): string {
  return (
    order.ref_number || order.qbd_txn_id || order.legacy_order_id || order.id
  )
}

function summarizeLegacyOrder(order: AnyRecord): StaffExceptionOrderSummary {
  const lines = Array.isArray(order.lines) ? order.lines : []
  return {
    id: order.id,
    source: "legacy",
    displayId: `Legacy ${legacyDisplayId(order)}`,
    email: order.email_lower || "",
    customerName: order.customer_name || order.email_lower || "Legacy customer",
    createdAt: order.placed_at || order.imported_at || "",
    updatedAt: order.imported_at || "",
    status: order.status || "imported",
    fulfillmentStatus: "historical",
    paymentStatus: "historical",
    total: dollarsToMinorUnits(order.total),
    currencyCode: order.currency_code || "usd",
    itemCount:
      Number(order.line_count || 0) ||
      lines.reduce(
        (sum: number, line: AnyRecord) => sum + amount(line.quantity),
        0
      ),
    operationalState: "completed_or_shipped",
  }
}

function normalizeSearchInput(
  input: string | StaffExceptionOrderSearchInput
): Required<StaffExceptionOrderSearchInput> {
  if (typeof input === "string") {
    return {
      query: input,
      queue: input.trim() ? "all" : "open",
      fulfillmentStatus: "all",
      paymentStatus: "all",
      limit: 30,
    }
  }

  const query = input.query || ""
  return {
    query,
    queue: input.queue || (query.trim() ? "all" : "open"),
    fulfillmentStatus: input.fulfillmentStatus || "all",
    paymentStatus: input.paymentStatus || "all",
    limit: input.limit || 30,
  }
}

function isCanceledOrder(order: StaffExceptionOrderSummary): boolean {
  const status = String(order.status || "").toLowerCase()
  const fulfillmentStatus = String(order.fulfillmentStatus || "").toLowerCase()
  return (
    status === "canceled" ||
    status === "cancelled" ||
    fulfillmentStatus === "canceled" ||
    fulfillmentStatus === "cancelled"
  )
}

function isFulfilledOrder(order: StaffExceptionOrderSummary): boolean {
  const value = String(order.fulfillmentStatus || "").toLowerCase()
  return ["fulfilled", "shipped", "delivered"].includes(value)
}

function isPartiallyFulfilledOrder(order: StaffExceptionOrderSummary): boolean {
  return String(order.fulfillmentStatus || "")
    .toLowerCase()
    .includes("partial")
}

function isOpenOrder(order: StaffExceptionOrderSummary): boolean {
  return (
    order.source === "medusa" &&
    !isCanceledOrder(order) &&
    !isFulfilledOrder(order)
  )
}

function orderMatchesFulfillmentFilter(
  order: StaffExceptionOrderSummary,
  filter: StaffExceptionFulfillmentFilter
): boolean {
  if (filter === "all") return true
  if (filter === "partially_fulfilled") return isPartiallyFulfilledOrder(order)
  if (filter === "fulfilled") return isFulfilledOrder(order)
  return (
    !isCanceledOrder(order) &&
    !isFulfilledOrder(order) &&
    !isPartiallyFulfilledOrder(order)
  )
}

function orderMatchesPaymentFilter(
  order: StaffExceptionOrderSummary,
  filter: StaffExceptionPaymentFilter
): boolean {
  if (filter === "all") return true
  const value = String(order.paymentStatus || "").toLowerCase()
  if (filter === "awaiting_payment") {
    return (
      value === "pending" ||
      value === "not_paid" ||
      value === "awaiting" ||
      value === "requires_action" ||
      value === "authorized"
    )
  }
  if (filter === "paid") {
    return (
      value === "paid" || value === "captured" || value === "partially_refunded"
    )
  }
  return value.includes("refund")
}

function applyOrderQueueFilters(
  orders: StaffExceptionOrderSummary[],
  input: Required<StaffExceptionOrderSearchInput>
): StaffExceptionOrderSummary[] {
  return orders
    .filter((order) => {
      if (input.queue === "open" && !isOpenOrder(order)) return false
      if (!orderMatchesFulfillmentFilter(order, input.fulfillmentStatus)) {
        return false
      }
      if (!orderMatchesPaymentFilter(order, input.paymentStatus)) return false
      return true
    })
    .slice(0, input.limit)
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function detailLegacyOrder(order: AnyRecord): StaffExceptionOrderDetail {
  const summary = summarizeLegacyOrder(order)
  const lines = Array.isArray(order.lines) ? order.lines : []

  return {
    ...summary,
    subtotal: dollarsToMinorUnits(order.subtotal),
    shippingTotal: dollarsToMinorUnits(order.shipping_total),
    taxTotal: dollarsToMinorUnits(order.tax_total),
    discountTotal: dollarsToMinorUnits(order.discount_total),
    items: lines.map((line: AnyRecord) => ({
      id: line.id,
      title:
        line.display_title ||
        line.medusa_variant_title ||
        line.medusa_product_title ||
        line.title ||
        line.description ||
        "Legacy item",
      subtitle:
        line.description && line.description !== line.title
          ? line.description
          : line.medusa_variant_title,
      sku: line.sku || undefined,
      quantity: amount(line.quantity),
      total: dollarsToMinorUnits(line.line_total),
    })),
    payments: [],
    shippingMethods: [],
    fulfillments: [],
    metadata: {
      legacy_order_id: order.id,
      legacy_ref_number: order.ref_number || "",
      qbd_txn_id: order.qbd_txn_id || "",
      staff_exception_status: "historical_quickbooks_order",
    },
    auditLog: [],
  }
}

function toAddress(
  address: AnyRecord | null | undefined
): StaffExceptionAddress | undefined {
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
    const payments = Array.isArray(collection.payments)
      ? collection.payments
      : []
    return payments.map((payment: AnyRecord) => {
      const refunds = Array.isArray(payment.refunds) ? payment.refunds : []
      const refundedAmount =
        amount(payment.refunded_amount) ||
        refunds.reduce(
          (sum: number, refund: AnyRecord) => sum + amount(refund.amount),
          0
        )

      return {
        id: payment.id,
        amount: amount(payment.amount),
        capturedAmount: amount(payment.captured_amount || payment.amount),
        refundedAmount,
        refundableAmount: Math.max(
          0,
          amount(payment.captured_amount || payment.amount) - refundedAmount
        ),
        currencyCode:
          payment.currency_code || collection.currency_code || "usd",
        providerId:
          payment.provider_id || payment.provider || collection.provider_id,
        status: payment.status,
      }
    })
  })
}

function staffTimeline(
  metadata: AnyRecord | null | undefined
): StaffAuditEntry[] {
  const auditLog = parseStaffAuditLog(metadata)
  const qbdStatus = metadata?.qbd_posting_status

  if (!qbdStatus) return auditLog

  const qbdWriteJobId = metadata?.qbd_write_job_id
  const alreadyRepresented = auditLog.some((entry) => {
    return (
      entry.qbd_posting_status === qbdStatus &&
      String(entry.qbd_write_job_id || "") === String(qbdWriteJobId || "")
    )
  })

  if (alreadyRepresented) return auditLog

  return [
    ...auditLog,
    {
      at:
        metadata?.qbd_posting_posted_at ||
        metadata?.qbd_posting_failed_at ||
        metadata?.qbd_posting_requested_at,
      action: "quickbooks_posting",
      status:
        qbdStatus === "posted"
          ? "completed"
          : qbdStatus === "failed"
          ? "failed"
          : "pending_manual",
      qbd_posting_status: qbdStatus,
      qbd_posting_action: metadata?.qbd_posting_action,
      qbd_posting_amount: metadata?.qbd_posting_amount,
      qbd_write_job_id: qbdWriteJobId,
      qbd_txn_id: metadata?.qbd_txn_id,
      qbd_ref_number: metadata?.qbd_ref_number,
      qbd_posting_error: metadata?.qbd_posting_error,
      staff_actor_name: "QuickBooks writer",
    },
  ]
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
      title:
        item.title ||
        item.product_title ||
        item.variant?.product?.title ||
        "Item",
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
    auditLog: staffTimeline(order.metadata || {}),
  }
}

async function requireStaffOperator() {
  const staff = await retrieveAuthenticatedCustomerForStaffAccess()
  if (!staff) {
    throw new Error("Sign in with a staff account to use staff exceptions.")
  }
  if (!isStaffCustomer(staff)) {
    throw new Error("Staff access required.")
  }
  return staff
}

async function retrieveOrder(orderId: string): Promise<AnyRecord> {
  const { order } = await adminFetch<{ order: AnyRecord }>(
    `/admin/orders/${orderId}`,
    {
      query: { fields: ORDER_DETAIL_FIELDS },
    }
  )
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
  status: StaffActionStatus
}): AnyRecord {
  return {
    action: input.action,
    status,
    reason_code: input.reasonCode,
    staff_note: input.staffNote.trim(),
    customer_visible_note: input.customerVisibleNote?.trim() || undefined,
    notify_customer: Boolean(input.notifyCustomer),
    customer_notification_status: input.notifyCustomer
      ? "recorded_only_not_sent"
      : "not_requested",
    medusa_mutation: actionMutatesMedusa(input.action),
    typed_confirmation_required:
      actionRequiredConfirmation(input.action) || undefined,
    typed_confirmation_received: actionRequiredConfirmation(input.action)
      ? true
      : undefined,
    customer_consent_method: input.customerConsentMethod || "not_applicable",
    staff_actor_customer_id: staff.id,
    staff_actor_email: staff.email,
    staff_actor_name: staffDisplayName(staff as any),
    order_id: order.id,
    order_display_id: displayId(order),
    order_operational_state: staffOrderOperationalState(order),
  }
}

function actionLabel(action: StaffExceptionActionType): string {
  return staffExceptionActionConfig(action)?.label || action.replace(/_/g, " ")
}

function qbdReconciliationNeeded(action: StaffExceptionActionType): boolean {
  return actionRequiresQuickBooksPosting(action)
}

function quickBooksAction(
  action: StaffExceptionActionType
): string | undefined {
  switch (action) {
    case "record_offline_payment":
      return "record_offline_payment"
    case "credit_memo":
      return "issue_account_credit"
    case "record_check_refund":
      return "pending_check_refund"
    case "refund_payment":
      return "card_refund_accounting_record"
    case "capture_payment":
      return "payment_capture_accounting_record"
    default:
      return undefined
  }
}

function qbdPendingFields(
  input: StaffExceptionActionInput,
  amountValue?: number,
  extra: AnyRecord = {}
): AnyRecord {
  const action = quickBooksAction(input.action)
  if (!action) return {}

  return {
    qbd_posting_required: true,
    qbd_posting_status: "pending_manual",
    qbd_posting_action: action,
    qbd_posting_amount: amountValue,
    qbd_posting_requested_at: new Date().toISOString(),
    ...extra,
  }
}

function stableRequestKey(parts: Array<string | number | undefined | null>) {
  const text = parts
    .map((part) =>
      String(part ?? "")
        .trim()
        .toLowerCase()
    )
    .join("|")
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash.toString(36)
}

function downstreamRequestKey(
  input: StaffExceptionActionInput,
  order: AnyRecord,
  amountValue?: number,
  paymentId?: string
) {
  return [
    "staff-exception",
    order.id,
    input.action,
    paymentId || "",
    amountValue || "",
    input.reasonCode,
    stableRequestKey([input.staffNote]),
  ].join("-")
}

function isStripeProvider(providerId?: string) {
  return String(providerId || "")
    .toLowerCase()
    .includes("stripe")
}

function latestRefundFromPayment(payment: AnyRecord | null | undefined) {
  const refunds = Array.isArray(payment?.refunds) ? payment.refunds : []
  return refunds[refunds.length - 1] || null
}

function previewSummary(input: StaffExceptionActionInput): string {
  switch (input.action) {
    case "record_note":
      return "This will append an internal staff note to the order audit trail."
    case "record_offline_payment":
      return "This records an offline payment and leaves a required QuickBooks posting task. It will not charge a card."
    case "shipping_override":
      return "This will record a shipping-change request for operations review. It will not silently change a shipment."
    case "credit_memo":
      return "This records an account credit request and leaves a required QuickBooks credit memo/accounting task. It will not refund a card."
    case "record_check_refund":
      return "This records a pending check refund and leaves a required QuickBooks/manual check task. It will not refund a card."
    case "retry_qbd_posting":
      return "This reopens the existing failed QuickBooks posting for the writer to retry. It does not create a new Stripe refund or a new accounting request."
    case "cancel_order":
      return "This will call Medusa's order cancellation endpoint after writing a staff audit entry."
    case "refund_payment":
      return "This writes a staff audit entry, submits the Stripe card refund through Medusa, and leaves a required QuickBooks refund record task."
    case "capture_payment":
      return "This writes a staff audit entry, captures the payment through Medusa, and leaves a required QuickBooks payment record task."
  }
}

function previewWarnings(
  input: StaffExceptionActionInput,
  order: AnyRecord
): string[] {
  const warnings: string[] = []

  if (actionRequiresQuickBooksPosting(input.action)) {
    warnings.push(
      "QuickBooks/QBD posting is required for this money action. Until an accounting sync confirms it, the order stays marked as pending/manual for QBD."
    )
  }

  if (actionIsAuditOnly(input.action)) {
    warnings.push(
      "Storefront-only action: this records the request/status on the order and does not move money by itself."
    )
  } else {
    warnings.push(
      "External action: this can change Medusa order/payment state after final confirmation."
    )
  }

  if (input.customerVisibleNote?.trim() || input.notifyCustomer) {
    warnings.push(
      "Customer messaging is not sent from this console yet. The customer note is recorded for staff follow-up only."
    )
  }

  if (
    staffOrderOperationalState(order) !== "open" &&
    staffOrderOperationalState(order) !== "confirmed"
  ) {
    warnings.push(
      "Fulfillment is no longer fully open. Shipping and cancellation actions may require operations review."
    )
  }

  return warnings
}

function previewAmount(input: StaffExceptionActionInput): number | undefined {
  if (
    !actionMovesMoney(input.action) &&
    input.action !== "record_offline_payment"
  ) {
    return undefined
  }

  try {
    return minorUnitsFromDollars(input.amount)
  } catch {
    return undefined
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

  if (
    actionMovesMoney(input.action) &&
    input.action !== "record_offline_payment"
  ) {
    minorUnitsFromDollars(input.amount)
  }

  if (input.action === "record_offline_payment") {
    minorUnitsFromDollars(input.amount)
    if (!input.offlinePaymentMethod?.trim()) {
      throw new Error("Choose or enter an offline payment method.")
    }
  }

  if (input.action === "refund_payment") {
    const selected = refundableStripePayment(order, input.paymentId)
    const refundAmount = minorUnitsFromDollars(input.amount)
    if (refundAmount > selected.refundableAmount) {
      throw new Error(
        `Refund amount exceeds the refundable card balance of ${(
          selected.refundableAmount / 100
        ).toFixed(2)}.`
      )
    }
  }

  if (input.action === "retry_qbd_posting") {
    if (order.metadata?.qbd_posting_status !== "failed") {
      throw new Error(
        "QuickBooks retry is only available after a failed QBD posting."
      )
    }
    if (!order.metadata?.qbd_posting_request_key) {
      throw new Error(
        "This order does not have a retryable QuickBooks request key."
      )
    }
  }

  if (
    input.action === "shipping_override" &&
    !input.shippingChangeSummary?.trim()
  ) {
    throw new Error("Summarize the shipping change.")
  }
}

function validateTypedConfirmation(input: StaffExceptionActionInput) {
  const required = actionRequiredConfirmation(input.action)
  if (!required) return

  if ((input.typedConfirmation || "").trim().toUpperCase() !== required) {
    throw new Error(`Type ${required} to confirm this action.`)
  }
}

function refundableStripePayment(
  order: AnyRecord,
  paymentId?: string
): StaffExceptionPayment {
  const payments = collectPayments(order)
  const selected = paymentId
    ? payments.find((payment) => payment.id === paymentId)
    : payments.find(
        (payment) =>
          isStripeProvider(payment.providerId) &&
          payment.capturedAmount > payment.refundedAmount
      )

  if (!selected) {
    throw new Error(
      "No refundable Stripe card payment was found for this order."
    )
  }
  if (!isStripeProvider(selected.providerId)) {
    throw new Error(
      "Card refunds are only available for refundable Stripe payments. Use account credit or pending check refund for non-card payments."
    )
  }
  if (selected.capturedAmount <= selected.refundedAmount) {
    throw new Error("No refundable captured payment was found for this order.")
  }

  return selected
}

function capturablePayment(
  order: AnyRecord,
  paymentId?: string
): StaffExceptionPayment {
  const payments = collectPayments(order)
  const selected = paymentId
    ? payments.find((payment) => payment.id === paymentId)
    : payments[0]

  if (!selected) {
    throw new Error("No payment was found for this order.")
  }

  return selected
}

export async function searchStaffExceptionOrders(
  input: string | StaffExceptionOrderSearchInput
): Promise<StaffExceptionOrderSummary[]> {
  await requireStaffOperator()
  const searchInput = normalizeSearchInput(input)
  const trimmed = searchInput.query.trim()
  const baseParams: Record<string, unknown> = {
    limit: trimmed ? 20 : 100,
    order: "-created_at",
    fields: ORDER_LIST_FIELDS,
  }

  if (!trimmed) {
    const pageSize = 100
    const maxScannedOrders = 500
    const orders: AnyRecord[] = []
    let offset = 0
    let total: number | null = null

    while (offset < maxScannedOrders) {
      const response = await adminFetch<OrderListResponse>("/admin/orders", {
        query: {
          ...baseParams,
          limit: pageSize,
          offset,
        },
      })
      const pageOrders = response.orders || []
      orders.push(...pageOrders)
      total = numericValue(response.count)
      offset += pageSize

      const filtered = applyOrderQueueFilters(
        orders.map(summarizeOrder),
        searchInput
      )
      if (filtered.length >= searchInput.limit) {
        return filtered
      }
      if (pageOrders.length < pageSize) break
      if (total !== null && offset >= total) break
    }

    return applyOrderQueueFilters(orders.map(summarizeOrder), searchInput)
  }

  const seenOrders = new Set<string>()
  const seenLegacyOrders = new Set<string>()
  const orders: AnyRecord[] = []
  const legacyOrders: AnyRecord[] = []
  const addOrders = (items: AnyRecord[] | undefined) => {
    ;(items || []).forEach((order) => {
      if (!order?.id || seenOrders.has(order.id)) return
      seenOrders.add(order.id)
      orders.push(order)
    })
  }
  const addLegacyOrders = (items: AnyRecord[] | undefined) => {
    ;(items || []).forEach((order) => {
      if (!order?.id || seenLegacyOrders.has(order.id)) return
      seenLegacyOrders.add(order.id)
      legacyOrders.push(order)
    })
  }

  const q = trimmed.replace(/^#/, "")
  let lastError: unknown = null

  try {
    const direct = await adminFetch<{ orders: AnyRecord[] }>("/admin/orders", {
      query: {
        ...baseParams,
        q,
      },
    })
    addOrders(direct.orders)
  } catch (err) {
    lastError = err
  }

  try {
    const legacy = await adminFetch<{ orders: AnyRecord[] }>(
      "/admin/legacy-orders",
      {
        query: {
          q,
          limit: 20,
        },
      }
    )
    addLegacyOrders(legacy.orders)
  } catch (err) {
    lastError = err
  }

  const customerAttempts: Array<Record<string, string | number>> = [
    { q, limit: 10 },
  ]
  if (q.includes("@")) customerAttempts.push({ email: q, limit: 10 })
  if (q.includes("+")) customerAttempts.push({ q: q.split("+")[0], limit: 10 })

  const seenCustomers = new Set<string>()
  for (const attempt of customerAttempts) {
    try {
      const { customers } = await adminFetch<{ customers: AnyRecord[] }>(
        "/admin/customers",
        {
          query: {
            ...attempt,
            fields: "id,email,first_name,last_name,phone",
          },
        }
      )

      for (const customer of customers || []) {
        if (!customer?.id || seenCustomers.has(customer.id)) continue
        seenCustomers.add(customer.id)
        try {
          const byCustomer = await adminFetch<{ orders: AnyRecord[] }>(
            "/admin/orders",
            {
              query: {
                ...baseParams,
                customer_id: customer.id,
                limit: 10,
              },
            }
          )
          addOrders(byCustomer.orders)
        } catch (err) {
          lastError = err
        }

        try {
          const legacyByCustomer = await adminFetch<{ orders: AnyRecord[] }>(
            "/admin/legacy-orders",
            {
              query: {
                customer_id: customer.id,
                limit: 10,
              },
            }
          )
          addLegacyOrders(legacyByCustomer.orders)
        } catch (err) {
          lastError = err
        }
      }
    } catch (err) {
      lastError = err
    }
  }

  if (!orders.length && !legacyOrders.length && lastError) {
    console.error("[staff-order-support] order search failed", lastError)
    throw new Error(
      "Order lookup failed. Try searching by order number, email, or customer name, then try again."
    )
  }

  const results = [
    ...orders.map(summarizeOrder),
    ...legacyOrders.map(summarizeLegacyOrder),
  ]

  return applyOrderQueueFilters(results, {
    ...searchInput,
    queue: searchInput.queue,
  })
}

export async function getStaffExceptionOrderDetail(
  orderId: string
): Promise<StaffExceptionOrderDetail> {
  await requireStaffOperator()

  if (orderId.startsWith("lgord_")) {
    const { order } = await adminFetch<{ order: AnyRecord }>(
      `/admin/legacy-orders/${orderId}`
    )
    if (!order) throw new Error("Historical order not found.")
    return detailLegacyOrder(order)
  }

  return detailOrder(await retrieveOrder(orderId))
}

export async function previewStaffOrderException(
  input: StaffExceptionActionInput
): Promise<StaffExceptionActionPreview> {
  const fallbackAction = input.action || "record_note"

  try {
    await requireStaffOperator()
    if (input.orderId.startsWith("lgord_")) {
      return {
        ok: false,
        error:
          "Historical QuickBooks orders are read-only in this console. Use this result for context, then handle money or shipping changes in QuickBooks/operations.",
        action: fallbackAction,
        actionLabel: actionLabel(fallbackAction),
        operationalState: "completed_or_shipped",
        orderDisplayId: input.orderId,
        willWriteAuditLog: false,
        willMutateMedusa: false,
        qbdReconciliationNeeded: false,
        customerNotificationStatus: "not_requested",
        requiredConfirmation: null,
        summary:
          "This is imported order history, not a live Medusa order. Staff actions cannot be applied here.",
        warnings: [
          "Use QuickBooks or operations workflows for historical order adjustments.",
        ],
        blockingReasons: ["Historical order is read-only."],
      }
    }

    const order = await retrieveOrder(input.orderId)
    const state = staffOrderOperationalState(order)
    const blockingReasons: string[] = []

    try {
      validateAction(input, order)
    } catch (err) {
      blockingReasons.push(err instanceof Error ? err.message : String(err))
    }

    return {
      ok: blockingReasons.length === 0,
      error: blockingReasons[0],
      action: fallbackAction,
      actionLabel: actionLabel(fallbackAction),
      operationalState: state,
      orderDisplayId: displayId(order),
      amount: previewAmount(input),
      paymentId: input.paymentId || undefined,
      willWriteAuditLog: true,
      willMutateMedusa: actionMutatesMedusa(fallbackAction),
      qbdReconciliationNeeded: qbdReconciliationNeeded(fallbackAction),
      customerNotificationStatus:
        input.customerVisibleNote?.trim() || input.notifyCustomer
          ? "recorded_only_not_sent"
          : "not_requested",
      requiredConfirmation: actionRequiredConfirmation(fallbackAction),
      summary: previewSummary(input),
      warnings: previewWarnings(input, order),
      blockingReasons,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      action: fallbackAction,
      actionLabel: actionLabel(fallbackAction),
      operationalState: "open",
      orderDisplayId: input.orderId || "Order",
      willWriteAuditLog: false,
      willMutateMedusa: false,
      qbdReconciliationNeeded: false,
      customerNotificationStatus: "not_requested",
      requiredConfirmation: actionRequiredConfirmation(fallbackAction),
      summary: previewSummary(input),
      warnings: [],
      blockingReasons: [err instanceof Error ? err.message : String(err)],
    }
  }
}

export async function applyStaffOrderException(
  input: StaffExceptionActionInput
): Promise<StaffExceptionActionResult> {
  try {
    const staff = await requireStaffOperator()
    if (input.orderId.startsWith("lgord_")) {
      throw new Error(
        "Historical QuickBooks orders are read-only in this console. Use QuickBooks or operations workflows for adjustments."
      )
    }

    const order = await retrieveOrder(input.orderId)
    validateAction(input, order)
    validateTypedConfirmation(input)

    const baseEntry = baseAuditEntry({
      staff,
      input,
      order,
      status:
        input.action === "record_note" ||
        input.action === "record_offline_payment" ||
        input.action === "shipping_override" ||
        input.action === "credit_memo" ||
        input.action === "record_check_refund" ||
        input.action === "retry_qbd_posting"
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
        const offlinePaymentAmount = minorUnitsFromDollars(input.amount)
        const requestKey = downstreamRequestKey(
          input,
          order,
          offlinePaymentAmount,
          input.offlinePaymentReference?.trim() ||
            input.offlinePaymentMethod?.trim()
        )
        const qbdFields = qbdPendingFields(input, offlinePaymentAmount, {
          qbd_posting_request_key: requestKey,
        })
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            amount: offlinePaymentAmount,
            offline_payment_method: input.offlinePaymentMethod?.trim(),
            offline_payment_reference:
              input.offlinePaymentReference?.trim() || undefined,
            ...qbdFields,
          },
          {
            staff_exception_status: "offline_payment_qbd_pending",
            ...qbdFields,
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
        const creditAmount = minorUnitsFromDollars(input.amount)
        const requestKey = downstreamRequestKey(input, order, creditAmount)
        const qbdFields = qbdPendingFields(input, creditAmount, {
          qbd_posting_request_key: requestKey,
        })
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            amount: creditAmount,
            ...qbdFields,
          },
          {
            staff_exception_status: "account_credit_qbd_pending",
            ...qbdFields,
          }
        )
        break
      }
      case "record_check_refund": {
        const checkRefundAmount = minorUnitsFromDollars(input.amount)
        const requestKey = downstreamRequestKey(input, order, checkRefundAmount)
        const qbdFields = qbdPendingFields(input, checkRefundAmount, {
          qbd_posting_request_key: requestKey,
        })
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            amount: checkRefundAmount,
            ...qbdFields,
          },
          {
            staff_exception_status: "check_refund_qbd_pending",
            ...qbdFields,
          }
        )
        break
      }
      case "retry_qbd_posting": {
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            qbd_posting_status: "pending_manual",
            qbd_posting_action: order.metadata?.qbd_posting_action,
            qbd_posting_amount: order.metadata?.qbd_posting_amount,
            qbd_posting_request_key: order.metadata?.qbd_posting_request_key,
            qbd_write_job_id: order.metadata?.qbd_write_job_id,
            previous_qbd_posting_status: order.metadata?.qbd_posting_status,
            previous_qbd_posting_error: order.metadata?.qbd_posting_error,
          },
          {
            staff_exception_status: "qbd_retry_requested",
            qbd_posting_required: true,
            qbd_posting_status: "pending_manual",
            qbd_posting_retry_requested_at: new Date().toISOString(),
            qbd_posting_error: "",
          }
        )
        break
      }
      case "cancel_order": {
        await appendOrderAudit(order.id, baseEntry, {
          staff_exception_status: "cancel_requested",
        })
        await adminFetch<{ order: AnyRecord }>(
          `/admin/orders/${order.id}/cancel`,
          {
            method: "POST",
          }
        )
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
        const payment = refundableStripePayment(order, input.paymentId)
        const refundAmount = minorUnitsFromDollars(input.amount)
        const requestKey = downstreamRequestKey(
          input,
          order,
          refundAmount,
          payment.id
        )
        const qbdFields = qbdPendingFields(input, refundAmount, {
          qbd_posting_request_key: requestKey,
        })
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            payment_id: payment.id,
            amount: refundAmount,
            ...qbdFields,
            stripe_refund_required: true,
            stripe_refund_status: "requested",
            downstream_request_key: requestKey,
          },
          {
            staff_exception_status: "refund_requested",
            ...qbdFields,
            stripe_refund_required: true,
            stripe_refund_status: "requested",
            downstream_request_key: requestKey,
          }
        )
        let refundResponse: { payment: AnyRecord }
        try {
          refundResponse = await adminFetch<{ payment: AnyRecord }>(
            `/admin/payments/${payment.id}/refund`,
            {
              method: "POST",
              headers: { "Idempotency-Key": requestKey },
              body: JSON.stringify({
                amount: refundAmount,
                note: input.staffNote.trim(),
              }),
            }
          )
        } catch (err) {
          await appendOrderAudit(
            order.id,
            {
              ...baseAuditEntry({ staff, input, order, status: "failed" }),
              payment_id: payment.id,
              amount: refundAmount,
              ...qbdFields,
              qbd_posting_required: false,
              stripe_refund_required: true,
              stripe_refund_status: "failed",
              stripe_refund_error:
                err instanceof Error ? err.message : String(err),
              downstream_request_key: requestKey,
              downstream_error:
                err instanceof Error ? err.message : String(err),
            },
            {
              staff_exception_status: "refund_stripe_failed",
              ...qbdFields,
              qbd_posting_required: false,
              qbd_posting_status: "blocked_by_stripe_failure",
              stripe_refund_required: true,
              stripe_refund_status: "failed",
              stripe_refund_error:
                err instanceof Error ? err.message : String(err),
              downstream_request_key: requestKey,
            }
          )
          throw err
        }
        const refund = latestRefundFromPayment(refundResponse.payment)
        await appendOrderAudit(
          order.id,
          {
            ...baseAuditEntry({
              staff,
              input,
              order,
              status: "pending_manual",
            }),
            payment_id: payment.id,
            amount: refundAmount,
            ...qbdFields,
            stripe_refund_required: true,
            stripe_refund_status: "submitted",
            stripe_refund_id: refund?.id,
            stripe_provider_refund_id:
              refund?.data?.id ||
              refund?.provider_refund_id ||
              refund?.external_id,
            downstream_request_key: requestKey,
          },
          {
            staff_exception_status: "refund_stripe_submitted_qbd_pending",
            ...qbdFields,
            stripe_refund_required: true,
            stripe_refund_status: "submitted",
            stripe_refund_id: refund?.id,
            stripe_provider_refund_id:
              refund?.data?.id ||
              refund?.provider_refund_id ||
              refund?.external_id,
            downstream_request_key: requestKey,
          }
        )
        break
      }
      case "capture_payment": {
        const payment = capturablePayment(order, input.paymentId)
        const captureAmount = minorUnitsFromDollars(input.amount)
        const requestKey = downstreamRequestKey(
          input,
          order,
          captureAmount,
          payment.id
        )
        const qbdFields = qbdPendingFields(input, captureAmount, {
          qbd_posting_request_key: requestKey,
        })
        await appendOrderAudit(
          order.id,
          {
            ...baseEntry,
            payment_id: payment.id,
            amount: captureAmount,
            ...qbdFields,
            payment_capture_status: "requested",
            downstream_request_key: requestKey,
          },
          {
            staff_exception_status: "capture_requested",
            ...qbdFields,
            payment_capture_status: "requested",
            downstream_request_key: requestKey,
          }
        )
        try {
          await adminFetch<{ payment: AnyRecord }>(
            `/admin/payments/${payment.id}/capture`,
            {
              method: "POST",
              headers: { "Idempotency-Key": requestKey },
              body: JSON.stringify({ amount: captureAmount }),
            }
          )
        } catch (err) {
          await appendOrderAudit(
            order.id,
            {
              ...baseAuditEntry({ staff, input, order, status: "failed" }),
              payment_id: payment.id,
              amount: captureAmount,
              ...qbdFields,
              qbd_posting_required: false,
              payment_capture_status: "failed",
              payment_capture_error:
                err instanceof Error ? err.message : String(err),
              downstream_request_key: requestKey,
              downstream_error:
                err instanceof Error ? err.message : String(err),
            },
            {
              staff_exception_status: "capture_failed",
              ...qbdFields,
              qbd_posting_required: false,
              qbd_posting_status: "blocked_by_capture_failure",
              payment_capture_status: "failed",
              payment_capture_error:
                err instanceof Error ? err.message : String(err),
              downstream_request_key: requestKey,
            }
          )
          throw err
        }
        await appendOrderAudit(
          order.id,
          {
            ...baseAuditEntry({
              staff,
              input,
              order,
              status: "pending_manual",
            }),
            payment_id: payment.id,
            amount: captureAmount,
            ...qbdFields,
            payment_capture_status: "submitted",
            downstream_request_key: requestKey,
          },
          {
            staff_exception_status: "capture_submitted_qbd_pending",
            ...qbdFields,
            payment_capture_status: "submitted",
            downstream_request_key: requestKey,
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
