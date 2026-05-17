"use client"

import { useMemo, useState, useTransition } from "react"
import Button from "@modules/common/components/button"
import {
  applyStaffOrderException,
  getStaffExceptionOrderDetail,
  searchStaffExceptionOrders,
  type StaffExceptionActionInput,
  type StaffExceptionOrderDetail,
  type StaffExceptionOrderSummary,
} from "@lib/data/staff/order-exceptions"
import {
  STAFF_EXCEPTION_ACTIONS,
  STAFF_EXCEPTION_REASON_CODES,
  actionMovesMoney,
  actionRequiresCustomerConsent,
  type StaffConsentMethod,
  type StaffExceptionActionType,
  type StaffExceptionReasonCode,
} from "@lib/data/staff/exception-types"

function fieldClass() {
  return "min-h-[44px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-maison-neue text-Charcoal outline-none transition focus:border-Gold focus:ring-1 focus:ring-Gold"
}

function labelClass() {
  return "text-xs font-maison-neue-mono uppercase text-Charcoal/55"
}

function formatMoney(value?: number, currencyCode = "usd") {
  const amount = Number(value || 0) / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function statusChip(value: string, tone: "neutral" | "gold" | "red" = "neutral") {
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
  const [orders, setOrders] = useState<StaffExceptionOrderSummary[]>([])
  const [selectedOrder, setSelectedOrder] =
    useState<StaffExceptionOrderDetail | null>(null)
  const [actionDraft, setActionDraft] = useState<StaffExceptionActionInput>(
    emptyAction()
  )
  const [acknowledged, setAcknowledged] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedAction = actionDraft.action
  const requiresConsent = actionRequiresCustomerConsent(selectedAction)
  const movesMoney = actionMovesMoney(selectedAction)
  const needsAmount =
    movesMoney ||
    selectedAction === "record_offline_payment" ||
    selectedAction === "refund_payment" ||
    selectedAction === "capture_payment"

  const canSubmit = useMemo(() => {
    if (!selectedOrder || !acknowledged) return false
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
  }, [acknowledged, actionDraft, needsAmount, requiresConsent, selectedAction, selectedOrder])

  function updateActionDraft(patch: Partial<StaffExceptionActionInput>) {
    setActionDraft((current) => ({ ...current, ...patch }))
  }

  function runOrderSearch() {
    setError(null)
    setStatus(null)
    startTransition(async () => {
      try {
        const results = await searchStaffExceptionOrders(query)
        setOrders(results)
        if (!results.length) setStatus("No matching orders found.")
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function selectOrder(orderId: string) {
    setError(null)
    setStatus(null)
    setAcknowledged(false)
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

  function applyAction() {
    if (!selectedOrder) return
    setError(null)
    setStatus(null)
    startTransition(async () => {
      const result = await applyStaffOrderException({
        ...actionDraft,
        orderId: selectedOrder.id,
      })
      if (!result.ok || !result.order) {
        setError(result.error || "Could not apply staff action.")
        return
      }
      setSelectedOrder(result.order)
      setActionDraft(emptyAction(result.order.id))
      setAcknowledged(false)
      setStatus("Staff action recorded and audited.")
    })
  }

  function chooseAction(action: StaffExceptionActionType) {
    if (!selectedOrder) return
    setAcknowledged(false)
    setActionDraft({
      ...emptyAction(selectedOrder.id),
      action,
      customerConsentMethod: actionRequiresCustomerConsent(action)
        ? "phone"
        : "not_applicable",
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Existing order support
            </p>
            <h2 className="text-xl font-gyst font-bold text-Charcoal">
              Find an order
            </h2>
            <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
              Search first, then review the order state before applying any
              money, shipping, or cancellation action.
            </p>
          </div>

          <div className="mb-5 grid gap-2 text-sm font-maison-neue text-Charcoal/65 small:grid-cols-3">
            {["1. Find order", "2. Review state", "3. Apply action"].map(
              (step) => (
                <div
                  className="rounded-md border border-gray-100 bg-SilverPlate/30 px-3 py-2"
                  key={step}
                >
                  {step}
                </div>
              )
            )}
          </div>

          <div className="flex flex-col gap-3 small:flex-row small:items-end">
            <label className="flex flex-1 flex-col gap-1">
              <span className={labelClass()}>Order, email, or customer</span>
              <input
                className={fieldClass()}
                placeholder="Order #, email, name, or phone"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runOrderSearch()
                }}
                type="search"
              />
            </label>
            <Button
              className="min-h-[44px] rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
              isLoading={isPending}
              onClick={runOrderSearch}
              type="button"
            >
              Find Orders
            </Button>
          </div>

          {(error || status) && (
            <div
              className={`mt-4 rounded-md border px-4 py-3 text-sm font-maison-neue ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {error || status}
            </div>
          )}

          {orders.length > 0 && (
            <div className="mt-5 divide-y rounded-md border border-gray-100">
              {orders.map((order) => (
                <button
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-SilverPlate/40 small:flex-row small:items-center small:justify-between"
                  key={order.id}
                  onClick={() => selectOrder(order.id)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-maison-neue font-semibold text-Charcoal">
                      {order.displayId} | {order.customerName}
                    </span>
                    <span className="block text-xs font-maison-neue text-Charcoal/55">
                      {[order.email, new Date(order.createdAt).toLocaleDateString()]
                        .filter(Boolean)
                        .join(" | ")}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {statusChip(order.paymentStatus)}
                    {statusChip(order.fulfillmentStatus)}
                    {statusChip(order.operationalState, "gold")}
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
                {statusChip(selectedOrder.status)}
                {statusChip(selectedOrder.paymentStatus)}
                {statusChip(selectedOrder.operationalState, "gold")}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["record_note", "Add note"],
                ["refund_payment", "Refund"],
                ["shipping_override", "Shipping"],
                ["record_offline_payment", "Offline payment"],
                ["credit_memo", "Credit"],
                ["cancel_order", "Cancel"],
              ].map(([action, label]) => (
                <button
                  className={`min-h-[40px] rounded-md border px-3 text-sm font-maison-neue font-semibold transition ${
                    selectedAction === action
                      ? "border-Charcoal bg-Charcoal text-white"
                      : "border-gray-200 bg-white text-Charcoal hover:border-Gold/50"
                  }`}
                  key={action}
                  onClick={() => chooseAction(action as StaffExceptionActionType)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

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
                            {[item.subtitle, item.sku].filter(Boolean).join(" | ")}
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
                  value={formatMoney(selectedOrder.subtotal, selectedOrder.currencyCode)}
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
                  value={formatMoney(selectedOrder.taxTotal, selectedOrder.currencyCode)}
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
                  value={formatMoney(selectedOrder.total, selectedOrder.currencyCode)}
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
                          Captured {formatMoney(payment.capturedAmount, payment.currencyCode)}
                          {" | "}
                          Refunded {formatMoney(payment.refundedAmount, payment.currencyCode)}
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
                    {selectedOrder.auditLog.slice(-6).reverse().map((entry, index) => (
                      <div className="border-l border-Gold pl-3" key={`${entry.at}-${index}`}>
                        <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                          {(entry.action || entry.staff_action || "staff action").replace(
                            /_/g,
                            " "
                          )}
                        </p>
                        <p className="text-xs font-maison-neue text-Charcoal/55">
                          {[entry.status, entry.staff_actor_name, entry.at]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
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
                      customerConsentMethod:
                        actionRequiresCustomerConsent(
                          event.target.value as StaffExceptionActionType
                        )
                          ? "phone"
                          : "not_applicable",
                    })
                  }
                >
                  {STAFF_EXCEPTION_ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
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
                      reasonCode: event.target.value as StaffExceptionReasonCode,
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
                        customerConsentMethod: event.target.value as StaffConsentMethod,
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
                          {payment.id} | {formatMoney(payment.amount, payment.currencyCode)}
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
                        updateActionDraft({ offlinePaymentMethod: event.target.value })
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
                      updateActionDraft({ shippingChangeSummary: event.target.value })
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
                    updateActionDraft({ customerVisibleNote: event.target.value })
                  }
                />
              </label>

              <label className="flex items-start gap-3 rounded-md border border-Gold/35 bg-Gold/10 p-3 text-sm font-maison-neue text-Charcoal">
                <input
                  checked={acknowledged}
                  className="mt-1"
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  type="checkbox"
                />
                This staff action is correct, customer-authorized where required,
                and should be auditable back to me.
              </label>

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
                    Fulfillment is locked or already shipped. Shipping changes are
                    recorded for operations review instead of silently mutating the
                    shipment.
                  </div>
                )}
            </div>
          </section>
        )}
      </aside>
    </div>
  )
}
