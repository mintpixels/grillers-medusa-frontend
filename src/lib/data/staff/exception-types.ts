type AnyRecord = Record<string, any>

export const STAFF_EXCEPTION_ACTIONS = [
  {
    value: "record_note",
    label: "Add internal note",
    moneyMovement: false,
    requiresConsent: false,
  },
  {
    value: "refund_payment",
    label: "Refund payment",
    moneyMovement: true,
    requiresConsent: true,
  },
  {
    value: "capture_payment",
    label: "Capture authorized payment",
    moneyMovement: true,
    requiresConsent: true,
  },
  {
    value: "record_offline_payment",
    label: "Record offline payment",
    moneyMovement: true,
    requiresConsent: true,
  },
  {
    value: "shipping_override",
    label: "Shipping override",
    moneyMovement: false,
    requiresConsent: true,
  },
  {
    value: "credit_memo",
    label: "Credit or adjustment",
    moneyMovement: true,
    requiresConsent: true,
  },
  {
    value: "cancel_order",
    label: "Cancel order",
    moneyMovement: false,
    requiresConsent: true,
  },
] as const

export type StaffExceptionActionType =
  (typeof STAFF_EXCEPTION_ACTIONS)[number]["value"]

export const STAFF_EXCEPTION_REASON_CODES = [
  { value: "customer_request", label: "Customer request" },
  { value: "staff_entry_error", label: "Staff entry error" },
  { value: "fulfillment_constraint", label: "Fulfillment constraint" },
  { value: "product_unavailable", label: "Product unavailable" },
  { value: "payment_reconciliation", label: "Payment reconciliation" },
  { value: "goodwill", label: "Goodwill" },
  { value: "other", label: "Other" },
] as const

export type StaffExceptionReasonCode =
  (typeof STAFF_EXCEPTION_REASON_CODES)[number]["value"]

export type StaffConsentMethod =
  | "phone"
  | "email"
  | "sms"
  | "in_person"
  | "not_applicable"

export type StaffOrderOperationalState =
  | "canceled"
  | "completed_or_shipped"
  | "fulfillment_locked"
  | "confirmed"
  | "open"

export type StaffAuditEntry = {
  at?: string
  action?: string
  staff_actor_customer_id?: string
  staff_actor_email?: string
  staff_actor_name?: string
  status?: string
  reason_code?: string
  staff_note?: string
  customer_visible_note?: string
  [key: string]: any
}

export function parseStaffAuditLog(
  metadata: AnyRecord | null | undefined
): StaffAuditEntry[] {
  const raw = metadata?.staff_audit_log

  if (Array.isArray(raw)) {
    return raw.filter((entry) => entry && typeof entry === "object")
  }

  if (typeof raw !== "string" || !raw.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry && typeof entry === "object")
      : []
  } catch {
    return []
  }
}

export function staffOrderOperationalState(
  order: AnyRecord | null | undefined
): StaffOrderOperationalState {
  if (!order) return "open"

  const status = String(order.status || "").toLowerCase()
  if (order.canceled_at || status === "canceled") {
    return "canceled"
  }

  const fulfillmentStatus = String(order.fulfillment_status || "").toLowerCase()
  const fulfillments = Array.isArray(order.fulfillments) ? order.fulfillments : []
  const hasShipment = fulfillments.some(
    (fulfillment: AnyRecord) =>
      fulfillment?.shipped_at ||
      fulfillment?.delivered_at ||
      Array.isArray(fulfillment?.labels)
  )

  if (
    hasShipment ||
    fulfillmentStatus.includes("shipped") ||
    fulfillmentStatus.includes("delivered")
  ) {
    return "completed_or_shipped"
  }

  if (
    fulfillments.length > 0 ||
    fulfillmentStatus.includes("fulfilled") ||
    fulfillmentStatus.includes("partially")
  ) {
    return "fulfillment_locked"
  }

  if (["pending", "authorized", "captured", "partially_refunded"].includes(
    String(order.payment_status || "").toLowerCase()
  )) {
    return "confirmed"
  }

  return "open"
}

export function staffExceptionActionConfig(action: StaffExceptionActionType) {
  return STAFF_EXCEPTION_ACTIONS.find((item) => item.value === action)
}

export function actionRequiresCustomerConsent(
  action: StaffExceptionActionType
): boolean {
  return staffExceptionActionConfig(action)?.requiresConsent ?? false
}

export function actionMovesMoney(action: StaffExceptionActionType): boolean {
  return staffExceptionActionConfig(action)?.moneyMovement ?? false
}

export function actionIsBlockedByOperationalState(
  action: StaffExceptionActionType,
  state: StaffOrderOperationalState
): boolean {
  if (state === "canceled") {
    return action !== "record_note"
  }

  if (state === "completed_or_shipped") {
    return action === "cancel_order" || action === "capture_payment"
  }

  return false
}
