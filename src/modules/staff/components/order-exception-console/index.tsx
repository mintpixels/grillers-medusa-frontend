"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  ClipboardList,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import Button from "@modules/common/components/button"
import {
  applyStaffOrderException,
  getStaffExceptionOrderDetail,
  previewStaffOrderException,
  searchStaffExceptionOrders,
  type StaffExceptionFulfillmentFilter,
  type StaffExceptionActionInput,
  type StaffExceptionActionPreview,
  type StaffExceptionOrderDetail,
  type StaffExceptionOrderQueueFilter,
  type StaffExceptionOrderSummary,
  type StaffExceptionPaymentFilter,
} from "@lib/data/staff/order-exceptions"
import {
  STAFF_EXCEPTION_ACTIONS,
  STAFF_EXCEPTION_REASON_CODES,
  actionIsAuditOnly,
  actionMovesMoney,
  actionMutatesMedusa,
  actionRequiredConfirmation,
  actionRequiresCustomerConsent,
  type StaffConsentMethod,
  type StaffExceptionActionType,
  type StaffExceptionReasonCode,
} from "@lib/data/staff/exception-types"
import { formatStaffMoney as formatMoney } from "@lib/data/staff/money"

function fieldClass() {
  return "min-h-[44px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-maison-neue text-Charcoal outline-none transition focus:border-Gold focus:ring-1 focus:ring-Gold"
}

function labelClass() {
  return "text-xs font-maison-neue-mono uppercase text-Charcoal/55"
}

function formatOrderDate(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString()
}

function statusChip(
  value: string,
  tone: "neutral" | "gold" | "red" = "neutral"
) {
  const toneClass =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "gold"
      ? "border-Gold/35 bg-Gold/10 text-Charcoal"
      : "border-gray-200 bg-white text-Charcoal/65"

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-maison-neue-mono uppercase ${toneClass}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  )
}

function isStripePayment(
  payment: StaffExceptionOrderDetail["payments"][number]
) {
  return String(payment.providerId || "")
    .toLowerCase()
    .includes("stripe")
}

function actionUnavailableReason(
  action: StaffExceptionActionType,
  order: StaffExceptionOrderDetail | null
): string {
  if (!order || order.source === "legacy") return ""

  if (action === "refund_payment") {
    const refundable = order.payments.some(
      (payment) => isStripePayment(payment) && payment.refundableAmount > 0
    )
    return refundable
      ? ""
      : "No refundable Stripe card payment is available for this order."
  }

  if (action === "capture_payment" && order.payments.length === 0) {
    return "No payment is available to capture for this order."
  }

  if (
    action === "retry_qbd_posting" &&
    order.metadata?.qbd_posting_status !== "failed"
  ) {
    return "QuickBooks retry is available only after a failed QBD posting."
  }

  return ""
}

function emptyAction(orderId = ""): StaffExceptionActionInput {
  return {
    orderId,
    action: "record_note",
    reasonCode: "customer_request",
    staffNote: "",
    customerVisibleNote: "",
    customerConsentMethod: "not_applicable",
    amount: undefined,
    paymentId: "",
    offlinePaymentMethod: "",
    offlinePaymentReference: "",
    shippingChangeSummary: "",
    notifyCustomer: false,
  }
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <dt className={labelClass()}>{label}</dt>
      <dd className="mt-1 text-sm font-maison-neue text-Charcoal">{value}</dd>
    </div>
  )
}

export default function StaffOrderExceptionConsole() {
  const [query, setQuery] = useState("")
  const [queueFilter, setQueueFilter] =
    useState<StaffExceptionOrderQueueFilter>("open")
  const [fulfillmentFilter, setFulfillmentFilter] =
    useState<StaffExceptionFulfillmentFilter>("all")
  const [paymentFilter, setPaymentFilter] =
    useState<StaffExceptionPaymentFilter>("all")
  const [orders, setOrders] = useState<StaffExceptionOrderSummary[]>([])
  const [selectedOrder, setSelectedOrder] =
    useState<StaffExceptionOrderDetail | null>(null)
  const [actionDraft, setActionDraft] = useState<StaffExceptionActionInput>(
    emptyAction()
  )
  const [preview, setPreview] = useState<StaffExceptionActionPreview | null>(
    null
  )
  const [typedConfirmation, setTypedConfirmation] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedAction = actionDraft.action
  const selectedIsLegacy = selectedOrder?.source === "legacy"
  const requiresConsent = actionRequiresCustomerConsent(selectedAction)
  const movesMoney = actionMovesMoney(selectedAction)
  const needsAmount =
    movesMoney ||
    selectedAction === "record_offline_payment" ||
    selectedAction === "refund_payment" ||
    selectedAction === "capture_payment"
  const destructiveConfirmation = preview?.requiredConfirmation
  const typedConfirmationMatches =
    !destructiveConfirmation ||
    typedConfirmation.trim().toUpperCase() === destructiveConfirmation

  const canSubmit = useMemo(() => {
    if (selectedIsLegacy) return false
    if (!selectedOrder || !acknowledged) return false
    if (!preview?.ok) return false
    if (!typedConfirmationMatches) return false
    if (!actionDraft.staffNote.trim()) return false
    if (!actionDraft.reasonCode) return false
    if (
      requiresConsent &&
      (!actionDraft.customerConsentMethod ||
        actionDraft.customerConsentMethod === "not_applicable")
    ) {
      return false
    }
    if (needsAmount && !Number(actionDraft.amount)) return false
    if (
      selectedAction === "record_offline_payment" &&
      !actionDraft.offlinePaymentMethod?.trim()
    ) {
      return false
    }
    if (
      selectedAction === "shipping_override" &&
      !actionDraft.shippingChangeSummary?.trim()
    ) {
      return false
    }
    return true
  }, [
    acknowledged,
    actionDraft,
    needsAmount,
    preview,
    requiresConsent,
    selectedAction,
    selectedIsLegacy,
    selectedOrder,
    typedConfirmationMatches,
  ])

  useEffect(() => {
    startTransition(async () => {
      try {
        const results = await searchStaffExceptionOrders({
          queue: "open",
          fulfillmentStatus: "all",
          paymentStatus: "all",
          limit: 100,
        })
        setOrders(results)
        if (!results.length) {
          setStatus("No open orders found.")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }, [])

  function updateActionDraft(patch: Partial<StaffExceptionActionInput>) {
    setPreview(null)
    setTypedConfirmation("")
    setAcknowledged(false)
    setActionDraft((current) => ({ ...current, ...patch }))
  }

  function runOrderSearch(
    overrides: Partial<{
      query: string
      queue: StaffExceptionOrderQueueFilter
      fulfillmentStatus: StaffExceptionFulfillmentFilter
      paymentStatus: StaffExceptionPaymentFilter
    }> = {}
  ) {
    setError(null)
    setStatus(null)
    const nextQuery = overrides.query ?? query
    const nextQueue = overrides.queue ?? queueFilter
    const nextFulfillment = overrides.fulfillmentStatus ?? fulfillmentFilter
    const nextPayment = overrides.paymentStatus ?? paymentFilter
    startTransition(async () => {
      try {
        const results = await searchStaffExceptionOrders({
          query: nextQuery,
          queue: nextQuery.trim() ? "all" : nextQueue,
          fulfillmentStatus: nextFulfillment,
          paymentStatus: nextPayment,
          limit: 100,
        })
        setOrders(results)
        if (!results.length) {
          setStatus(
            nextQuery.trim()
              ? "No matching current or historical orders found."
              : nextQueue === "open"
              ? "No open orders found."
              : "No orders found."
          )
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function selectOrder(orderId: string) {
    setError(null)
    setStatus(null)
    setAcknowledged(false)
    setPreview(null)
    setTypedConfirmation("")
    startTransition(async () => {
      try {
        const detail = await getStaffExceptionOrderDetail(orderId)
        setSelectedOrder(detail)
        setActionDraft(emptyAction(detail.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function reviewAction() {
    if (!selectedOrder) return
    setError(null)
    setStatus(null)
    setAcknowledged(false)
    setTypedConfirmation("")
    startTransition(async () => {
      const result = await previewStaffOrderException({
        ...actionDraft,
        orderId: selectedOrder.id,
      })
      setPreview(result)
      if (!result.ok) {
        setError(result.error || "Review found a blocking issue.")
      } else {
        setStatus("Review complete. Confirm the action before applying it.")
      }
    })
  }

  function applyAction() {
    if (!selectedOrder) return
    setError(null)
    setStatus(null)
    startTransition(async () => {
      const result = await applyStaffOrderException({
        ...actionDraft,
        orderId: selectedOrder.id,
        typedConfirmation,
      })
      if (!result.ok || !result.order) {
        setError(result.error || "Could not apply staff action.")
        return
      }
      setSelectedOrder(result.order)
      setActionDraft(emptyAction(result.order.id))
      setAcknowledged(false)
      setPreview(null)
      setTypedConfirmation("")
      setStatus("Staff action recorded and audited.")
    })
  }

  function chooseAction(action: StaffExceptionActionType) {
    if (!selectedOrder) return
    setAcknowledged(false)
    setPreview(null)
    setTypedConfirmation("")
    setActionDraft({
      ...emptyAction(selectedOrder.id),
      action,
      customerConsentMethod: actionRequiresCustomerConsent(action)
        ? "phone"
        : "not_applicable",
    })
  }

  return (
    <div
      className={`grid gap-6 ${
        selectedOrder ? "xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start" : ""
      }`}
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-col gap-3 large:flex-row large:items-start large:justify-between">
              <div>
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Existing order support
                </p>
                <h2 className="mt-1 text-xl font-maison-neue font-semibold text-Charcoal">
                  Order lookup
                </h2>
                <p className="mt-1 max-w-3xl text-sm font-maison-neue text-Charcoal/55">
                  Search current and historical orders for customer questions,
                  payment state, cancellations, refunds, notes, and audited
                  exceptions. Pack & Finalize is the fulfillment queue.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-maison-neue-mono uppercase text-Charcoal/60">
                <span className="inline-flex min-h-[32px] items-center rounded-full border border-Gold/35 bg-Gold/10 px-3">
                  {orders.length}{" "}
                  {query.trim()
                    ? "matching"
                    : queueFilter === "open"
                    ? "unfulfilled"
                    : "current"}
                </span>
                <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-gray-200 bg-SilverPlate/40 px-3">
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                  Review state
                </span>
                <span className="inline-flex min-h-[32px] items-center rounded-full border border-gray-200 bg-SilverPlate/40 px-3">
                  Audited
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-4">
            <label className="flex flex-col gap-1">
              <span className={labelClass()}>Order, email, or customer</span>
              <input
                className={fieldClass()}
                placeholder="Order #, invoice, email, name, or phone"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runOrderSearch()
                }}
                type="search"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex min-w-[145px] flex-1 flex-col gap-1">
                <span className={labelClass()}>Queue</span>
                <select
                  className={fieldClass()}
                  value={queueFilter}
                  onChange={(event) => {
                    const value = event.target
                      .value as StaffExceptionOrderQueueFilter
                    setQueueFilter(value)
                    const nextFulfillment =
                      value === "open" && fulfillmentFilter === "fulfilled"
                        ? "all"
                        : fulfillmentFilter
                    if (nextFulfillment !== fulfillmentFilter) {
                      setFulfillmentFilter(nextFulfillment)
                    }
                    runOrderSearch({
                      queue: value,
                      fulfillmentStatus: nextFulfillment,
                    })
                  }}
                >
                  <option value="open">Open only</option>
                  <option value="all">All current</option>
                </select>
              </label>
              <label className="flex min-w-[170px] flex-1 flex-col gap-1">
                <span className={labelClass()}>Fulfillment</span>
                <select
                  className={fieldClass()}
                  value={fulfillmentFilter}
                  onChange={(event) => {
                    const value = event.target
                      .value as StaffExceptionFulfillmentFilter
                    setFulfillmentFilter(value)
                    const nextQueue =
                      value === "fulfilled" && queueFilter === "open"
                        ? "all"
                        : queueFilter
                    if (nextQueue !== queueFilter) {
                      setQueueFilter(nextQueue)
                    }
                    runOrderSearch({
                      queue: nextQueue,
                      fulfillmentStatus: value,
                    })
                  }}
                >
                  <option value="all">All fulfillment</option>
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="partially_fulfilled">
                    Partially fulfilled
                  </option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </label>
              <label className="flex min-w-[145px] flex-1 flex-col gap-1">
                <span className={labelClass()}>Payment</span>
                <select
                  className={fieldClass()}
                  value={paymentFilter}
                  onChange={(event) => {
                    const value = event.target
                      .value as StaffExceptionPaymentFilter
                    setPaymentFilter(value)
                    runOrderSearch({ paymentStatus: value })
                  }}
                >
                  <option value="all">All payment</option>
                  <option value="awaiting_payment">Awaiting</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
              <p className="flex items-center gap-2 text-xs font-maison-neue text-Charcoal/50">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                Blank search returns the filtered open queue.
              </p>
              <div className="flex flex-col gap-2 small:flex-row">
                <Button
                  className="inline-flex min-h-[40px] min-w-[112px] items-center justify-center gap-2 rounded-md border border-Charcoal bg-white px-3.5 text-sm font-maison-neue font-semibold text-Charcoal"
                  disabled={isPending}
                  onClick={() => {
                    setQuery("")
                    runOrderSearch({ query: "" })
                  }}
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Refresh
                </Button>
                <Button
                  className="inline-flex min-h-[40px] min-w-[132px] items-center justify-center gap-2 rounded-md bg-Charcoal px-3.5 text-sm font-maison-neue font-semibold text-white"
                  isLoading={isPending}
                  onClick={() => runOrderSearch()}
                  type="button"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Find orders
                </Button>
              </div>
            </div>
          </div>

          {(error || status) && (
            <div
              className={`mx-5 mb-4 rounded-md border px-4 py-3 text-sm font-maison-neue ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {error || status}
            </div>
          )}

          {orders.length > 0 && (
            <div className="mx-5 mb-5 overflow-hidden rounded-md border border-gray-200 bg-white">
              <div className="hidden grid-cols-[104px_minmax(0,1.4fr)_72px_104px_minmax(190px,0.9fr)] gap-3 bg-SilverPlate/40 px-4 py-2 text-[11px] font-maison-neue-mono uppercase text-Charcoal/45 md:grid">
                <span>Order</span>
                <span>Customer</span>
                <span>Items</span>
                <span className="text-right">Total</span>
                <span className="text-right">State</span>
              </div>
              {orders.map((order) => (
                <button
                  className={`grid w-full gap-3 border-t border-gray-100 px-4 py-3 text-left transition first:border-t-0 hover:bg-SilverPlate/35 md:grid-cols-[104px_minmax(0,1.4fr)_72px_104px_minmax(190px,0.9fr)] md:items-center ${
                    selectedOrder?.id === order.id
                      ? "bg-Gold/10 shadow-[inset_0_0_0_1px_rgba(228,174,83,0.35)]"
                      : ""
                  }`}
                  key={order.id}
                  onClick={() => selectOrder(order.id)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-maison-neue font-semibold text-Charcoal">
                      {order.displayId}
                    </span>
                    <span className="block text-xs font-maison-neue text-Charcoal/45">
                      {formatOrderDate(order.createdAt) || "No date"}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-maison-neue font-semibold text-Charcoal">
                      {order.customerName}
                    </span>
                    <span className="block truncate text-xs font-maison-neue text-Charcoal/55">
                      {order.email || "No email"}
                    </span>
                  </span>
                  <span className="text-xs font-maison-neue text-Charcoal/55 md:text-sm md:text-Charcoal/70">
                    {order.itemCount}
                  </span>
                  <span className="text-sm font-maison-neue font-semibold text-Charcoal md:text-right">
                    {formatMoney(order.total, order.currencyCode)}
                  </span>
                  <span className="space-y-2 md:text-right">
                    <span className="block text-xs font-maison-neue text-Charcoal/55 md:hidden">
                      {order.itemCount} items
                    </span>
                    <span className="flex flex-wrap gap-2 md:justify-end">
                      {order.source === "legacy" &&
                        statusChip("historical qbd", "gold")}
                      {statusChip(order.paymentStatus)}
                      {statusChip(order.fulfillmentStatus)}
                      {order.source === "medusa" &&
                        statusChip(order.operationalState, "gold")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedOrder && (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 small:flex-row small:items-start small:justify-between">
              <div>
                <p className={labelClass()}>Selected order</p>
                <h2 className="mt-1 text-2xl font-gyst font-bold text-Charcoal">
                  {selectedOrder.displayId}
                </h2>
                <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
                  {selectedOrder.customerName} | {selectedOrder.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.source === "legacy" &&
                  statusChip("historical qbd", "gold")}
                {statusChip(selectedOrder.status)}
                {statusChip(selectedOrder.paymentStatus)}
                {selectedOrder.source === "medusa" &&
                  statusChip(selectedOrder.operationalState, "gold")}
              </div>
            </div>

            {selectedIsLegacy ? (
              <div className="mt-4 rounded-md border border-Gold/35 bg-Gold/10 p-4 text-sm font-maison-neue text-Charcoal/75">
                This is imported QuickBooks history. It is available for lookup
                and customer context, but storefront staff actions are read-only
                here. Handle refunds, credits, and shipping exceptions in
                QuickBooks or the operations workflow.
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["record_note", "Add note"],
                  ["refund_payment", "Refund card"],
                  ["credit_memo", "Account credit"],
                  ["retry_qbd_posting", "Retry QBD"],
                  ["shipping_override", "Shipping"],
                  ["cancel_order", "Cancel"],
                ].map(([action, label]) => (
                  <button
                    className={`min-h-[40px] rounded-md border px-3 text-sm font-maison-neue font-semibold transition ${
                      selectedAction === action
                        ? "border-Charcoal bg-Charcoal text-white"
                        : actionUnavailableReason(
                            action as StaffExceptionActionType,
                            selectedOrder
                          )
                        ? "cursor-not-allowed border-gray-100 bg-SilverPlate/30 text-Charcoal/35"
                        : "border-gray-200 bg-white text-Charcoal hover:border-Gold/50"
                    }`}
                    disabled={Boolean(
                      actionUnavailableReason(
                        action as StaffExceptionActionType,
                        selectedOrder
                      )
                    )}
                    key={action}
                    onClick={() =>
                      chooseAction(action as StaffExceptionActionType)
                    }
                    title={actionUnavailableReason(
                      action as StaffExceptionActionType,
                      selectedOrder
                    )}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-6 py-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <h3 className="mb-3 text-sm font-maison-neue font-semibold text-Charcoal">
                  Items
                </h3>
                <div className="divide-y border-y border-gray-100">
                  {selectedOrder.items.map((item) => (
                    <div className="py-3" key={item.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                            {item.quantity} x {item.title}
                          </p>
                          <p className="text-xs font-maison-neue text-Charcoal/55">
                            {[item.subtitle, item.sku]
                              .filter(Boolean)
                              .join(" | ")}
                          </p>
                        </div>
                        <p className="text-sm font-maison-neue text-Charcoal">
                          {formatMoney(item.total, selectedOrder.currencyCode)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <dl className="space-y-3 rounded-md border border-gray-100 p-4">
                <DetailRow
                  label="Subtotal"
                  value={formatMoney(
                    selectedOrder.subtotal,
                    selectedOrder.currencyCode
                  )}
                />
                <DetailRow
                  label="Shipping"
                  value={formatMoney(
                    selectedOrder.shippingTotal,
                    selectedOrder.currencyCode
                  )}
                />
                <DetailRow
                  label="Tax"
                  value={formatMoney(
                    selectedOrder.taxTotal,
                    selectedOrder.currencyCode
                  )}
                />
                <DetailRow
                  label="Discounts"
                  value={formatMoney(
                    selectedOrder.discountTotal,
                    selectedOrder.currencyCode
                  )}
                />
                <DetailRow
                  label="Total"
                  value={formatMoney(
                    selectedOrder.total,
                    selectedOrder.currencyCode
                  )}
                />
              </dl>
            </div>

            <div className="grid gap-4 border-t border-gray-100 pt-5 md:grid-cols-2">
              <div className="rounded-md border border-gray-100 p-4">
                <h3 className="mb-3 text-sm font-maison-neue font-semibold text-Charcoal">
                  Payments
                </h3>
                {selectedOrder.payments.length ? (
                  <div className="space-y-3">
                    {selectedOrder.payments.map((payment) => (
                      <div
                        className="rounded-md border border-gray-100 px-3 py-2"
                        key={payment.id}
                      >
                        <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                          {formatMoney(payment.amount, payment.currencyCode)}
                        </p>
                        <p className="text-xs font-maison-neue text-Charcoal/55">
                          Captured{" "}
                          {formatMoney(
                            payment.capturedAmount,
                            payment.currencyCode
                          )}
                          {" | "}
                          Refunded{" "}
                          {formatMoney(
                            payment.refundedAmount,
                            payment.currencyCode
                          )}
                          {" | "}
                          Refundable{" "}
                          {formatMoney(
                            payment.refundableAmount,
                            payment.currencyCode
                          )}
                          {payment.providerId ? ` | ${payment.providerId}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-maison-neue text-Charcoal/55">
                    No payment records returned.
                  </p>
                )}
              </div>

              <div className="rounded-md border border-gray-100 p-4">
                <h3 className="mb-3 text-sm font-maison-neue font-semibold text-Charcoal">
                  Staff timeline
                </h3>
                {selectedOrder.auditLog.length ? (
                  <div className="space-y-3">
                    {selectedOrder.auditLog
                      .slice(-6)
                      .reverse()
                      .map((entry, index) => (
                        <div
                          className="border-l border-Gold pl-3"
                          key={`${entry.at}-${index}`}
                        >
                          <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                            {(
                              entry.action ||
                              entry.staff_action ||
                              "staff action"
                            ).replace(/_/g, " ")}
                          </p>
                          <p className="text-xs font-maison-neue text-Charcoal/55">
                            {[entry.status, entry.staff_actor_name, entry.at]
                              .filter(Boolean)
                              .join(" | ")}
                          </p>
                          {(entry.qbd_posting_status ||
                            entry.stripe_refund_status ||
                            entry.payment_capture_status) && (
                            <p className="mt-1 text-xs font-maison-neue text-Charcoal/55">
                              {[
                                entry.qbd_posting_status
                                  ? `QBD: ${entry.qbd_posting_status}`
                                  : "",
                                entry.stripe_refund_status
                                  ? `Stripe: ${entry.stripe_refund_status}`
                                  : "",
                                entry.payment_capture_status
                                  ? `Capture: ${entry.payment_capture_status}`
                                  : "",
                                entry.qbd_txn_id
                                  ? `Txn: ${entry.qbd_txn_id}`
                                  : "",
                                entry.qbd_ref_number
                                  ? `Ref: ${entry.qbd_ref_number}`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" | ")}
                            </p>
                          )}
                          {entry.qbd_posting_error && (
                            <p className="mt-1 text-xs font-maison-neue text-red-700">
                              {entry.qbd_posting_error}
                            </p>
                          )}
                          {(entry.stripe_refund_error ||
                            entry.payment_capture_error ||
                            entry.downstream_error) && (
                            <p className="mt-1 text-xs font-maison-neue text-red-700">
                              {entry.stripe_refund_error ||
                                entry.payment_capture_error ||
                                entry.downstream_error}
                            </p>
                          )}
                          {entry.staff_note && (
                            <p className="mt-1 text-xs font-maison-neue text-Charcoal/70">
                              {entry.staff_note}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm font-maison-neue text-Charcoal/55">
                    No staff actions recorded yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
            Apply Audited Action
          </h2>
          {!selectedOrder ? (
            <div className="rounded-md border border-gray-100 bg-SilverPlate/30 p-4">
              <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                No order selected
              </p>
              <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
                Use the search panel, then choose a common action from the order
                header. Required fields appear here.
              </p>
            </div>
          ) : selectedIsLegacy ? (
            <div className="rounded-md border border-Gold/35 bg-Gold/10 p-4">
              <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                Historical order selected
              </p>
              <p className="mt-1 text-sm font-maison-neue text-Charcoal/60">
                This QuickBooks-imported order is read-only in the storefront.
                Use it for customer context, then handle adjustments in
                QuickBooks or operations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className={labelClass()}>Action</span>
                <select
                  className={fieldClass()}
                  value={actionDraft.action}
                  onChange={(event) =>
                    updateActionDraft({
                      action: event.target.value as StaffExceptionActionType,
                      customerConsentMethod: actionRequiresCustomerConsent(
                        event.target.value as StaffExceptionActionType
                      )
                        ? "phone"
                        : "not_applicable",
                    })
                  }
                >
                  {STAFF_EXCEPTION_ACTIONS.map((action) => (
                    <option
                      disabled={Boolean(
                        actionUnavailableReason(action.value, selectedOrder)
                      )}
                      key={action.value}
                      value={action.value}
                    >
                      {action.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className={labelClass()}>Reason</span>
                <select
                  className={fieldClass()}
                  value={actionDraft.reasonCode}
                  onChange={(event) =>
                    updateActionDraft({
                      reasonCode: event.target
                        .value as StaffExceptionReasonCode,
                    })
                  }
                >
                  {STAFF_EXCEPTION_REASON_CODES.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>

              {requiresConsent && (
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Customer authorization</span>
                  <select
                    className={fieldClass()}
                    value={actionDraft.customerConsentMethod}
                    onChange={(event) =>
                      updateActionDraft({
                        customerConsentMethod: event.target
                          .value as StaffConsentMethod,
                      })
                    }
                  >
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="in_person">In person</option>
                  </select>
                </label>
              )}

              {needsAmount && (
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Amount</span>
                  <input
                    className={fieldClass()}
                    min="0"
                    step="0.01"
                    type="number"
                    value={actionDraft.amount ?? ""}
                    onChange={(event) =>
                      updateActionDraft({
                        amount: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
              )}

              {(selectedAction === "refund_payment" ||
                selectedAction === "capture_payment") &&
                selectedOrder.payments.length > 0 && (
                  <label className="flex flex-col gap-1">
                    <span className={labelClass()}>Payment</span>
                    <select
                      className={fieldClass()}
                      value={actionDraft.paymentId || ""}
                      onChange={(event) =>
                        updateActionDraft({ paymentId: event.target.value })
                      }
                    >
                      <option value="">Auto select</option>
                      {selectedOrder.payments.map((payment) => (
                        <option key={payment.id} value={payment.id}>
                          {payment.id} |{" "}
                          {formatMoney(payment.amount, payment.currencyCode)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

              {selectedAction === "record_offline_payment" && (
                <div className="space-y-3">
                  <label className="flex flex-col gap-1">
                    <span className={labelClass()}>Payment method</span>
                    <input
                      className={fieldClass()}
                      placeholder="Check, ACH, Zelle, cash"
                      value={actionDraft.offlinePaymentMethod || ""}
                      onChange={(event) =>
                        updateActionDraft({
                          offlinePaymentMethod: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass()}>Reference</span>
                    <input
                      className={fieldClass()}
                      value={actionDraft.offlinePaymentReference || ""}
                      onChange={(event) =>
                        updateActionDraft({
                          offlinePaymentReference: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              )}

              {selectedAction === "shipping_override" && (
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Shipping change</span>
                  <textarea
                    className={`${fieldClass()} min-h-[96px]`}
                    value={actionDraft.shippingChangeSummary || ""}
                    onChange={(event) =>
                      updateActionDraft({
                        shippingChangeSummary: event.target.value,
                      })
                    }
                  />
                </label>
              )}

              <label className="flex flex-col gap-1">
                <span className={labelClass()}>Internal staff note</span>
                <textarea
                  className={`${fieldClass()} min-h-[110px]`}
                  value={actionDraft.staffNote}
                  onChange={(event) =>
                    updateActionDraft({ staffNote: event.target.value })
                  }
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className={labelClass()}>Customer note</span>
                <textarea
                  className={`${fieldClass()} min-h-[88px]`}
                  value={actionDraft.customerVisibleNote || ""}
                  onChange={(event) =>
                    updateActionDraft({
                      customerVisibleNote: event.target.value,
                    })
                  }
                />
              </label>

              {actionIsAuditOnly(selectedAction) && (
                <div className="rounded-md border border-gray-200 bg-SilverPlate/40 p-3 text-sm font-maison-neue text-Charcoal/70">
                  This action records the request/status on the order for staff
                  follow-up. Money actions still require QuickBooks/QBD posting
                  before accounting is complete.
                </div>
              )}

              {actionMutatesMedusa(selectedAction) && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-maison-neue text-red-700">
                  This action can change Medusa order or payment state. Review
                  it first, then type the confirmation word before applying it.
                </div>
              )}

              {actionDraft.customerVisibleNote?.trim() && (
                <div className="rounded-md border border-Gold/35 bg-Gold/10 p-3 text-sm font-maison-neue text-Charcoal">
                  Customer messaging is not sent from this console yet. This
                  note is recorded for staff follow-up and audit context only.
                </div>
              )}

              {preview && (
                <div
                  className={`rounded-md border p-4 ${
                    preview.ok
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={labelClass()}>Review</p>
                      <h3 className="mt-1 text-base font-maison-neue font-semibold text-Charcoal">
                        {preview.actionLabel}
                      </h3>
                    </div>
                    {statusChip(
                      preview.willMutateMedusa
                        ? "external action"
                        : "audit only",
                      preview.willMutateMedusa ? "red" : "gold"
                    )}
                  </div>
                  <p className="mt-3 text-sm font-maison-neue text-Charcoal/75">
                    {preview.summary}
                  </p>
                  <dl className="mt-3 grid gap-2 text-xs font-maison-neue text-Charcoal/65">
                    <div className="flex justify-between gap-3">
                      <dt>Order</dt>
                      <dd className="font-semibold text-Charcoal">
                        {preview.orderDisplayId}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>State</dt>
                      <dd className="font-semibold text-Charcoal">
                        {preview.operationalState.replace(/_/g, " ")}
                      </dd>
                    </div>
                    {preview.amount !== undefined && (
                      <div className="flex justify-between gap-3">
                        <dt>Amount</dt>
                        <dd className="font-semibold text-Charcoal">
                          {formatMoney(
                            preview.amount,
                            selectedOrder.currencyCode
                          )}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt>QBD follow-up</dt>
                      <dd className="font-semibold text-Charcoal">
                        {preview.qbdReconciliationNeeded ? "Required" : "No"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Customer message</dt>
                      <dd className="font-semibold text-Charcoal">
                        {preview.customerNotificationStatus ===
                        "recorded_only_not_sent"
                          ? "Recorded only"
                          : "Not requested"}
                      </dd>
                    </div>
                  </dl>
                  {preview.blockingReasons.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm font-maison-neue text-red-700">
                      {preview.blockingReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                  {preview.warnings.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs font-maison-neue text-Charcoal/65">
                      {preview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {destructiveConfirmation && preview?.ok && (
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>
                    Type {destructiveConfirmation} to confirm
                  </span>
                  <input
                    className={fieldClass()}
                    value={typedConfirmation}
                    onChange={(event) =>
                      setTypedConfirmation(event.target.value)
                    }
                  />
                </label>
              )}

              <label className="flex items-start gap-3 rounded-md border border-Gold/35 bg-Gold/10 p-3 text-sm font-maison-neue text-Charcoal">
                <input
                  checked={acknowledged}
                  disabled={!preview?.ok}
                  className="mt-1"
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  type="checkbox"
                />
                I reviewed the action, the customer authorized it where
                required, and the audit trail should attribute it to me.
              </label>

              <Button
                className="min-h-[48px] w-full rounded-md border border-Charcoal bg-white px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                disabled={!selectedOrder}
                isLoading={isPending}
                onClick={reviewAction}
                type="button"
              >
                Review Action
              </Button>

              <Button
                className="min-h-[48px] w-full rounded-md bg-Gold px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                disabled={!canSubmit}
                isLoading={isPending}
                onClick={applyAction}
                type="button"
              >
                Apply Staff Action
              </Button>
            </div>
          )}
        </section>

        {selectedOrder && (
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
              Customer Context
            </h2>
            <div className="space-y-4">
              <dl className="space-y-3">
                <DetailRow label="Email" value={selectedOrder.email} />
                <DetailRow
                  label="Staff status"
                  value={String(
                    selectedOrder.metadata?.staff_exception_status || ""
                  ).replace(/_/g, " ")}
                />
                <DetailRow
                  label="Shipping"
                  value={[
                    selectedOrder.shippingAddress?.name,
                    selectedOrder.shippingAddress?.line1,
                    selectedOrder.shippingAddress?.line2,
                    selectedOrder.shippingAddress?.cityLine,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
                <DetailRow
                  label="Shipping methods"
                  value={selectedOrder.shippingMethods.join(", ")}
                />
              </dl>
              {selectedOrder.operationalState !== "confirmed" &&
                selectedOrder.operationalState !== "open" && (
                  <div className="rounded-md border border-Gold/35 bg-Gold/10 px-3 py-3 text-sm font-maison-neue text-Charcoal">
                    Fulfillment is locked or already shipped. Shipping changes
                    are recorded for operations review instead of silently
                    mutating the shipment.
                  </div>
                )}
            </div>
          </section>
        )}
      </aside>
    </div>
  )
}
