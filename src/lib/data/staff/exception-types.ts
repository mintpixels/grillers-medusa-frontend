type AnyRecord = Record<string, any>

export const STAFF_EXCEPTION_ACTIONS = [
  {
    value: "record_note",
    label: "Add internal note",
    moneyMovement: false,
    requiresConsent: false,
    visibleInOrderSupport: true,
  },
  {
    value: "refund_payment",
    label: "Refund card through Stripe",
    moneyMovement: true,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
  {
    value: "capture_payment",
    label: "Capture authorized payment",
    moneyMovement: true,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
  {
    value: "record_offline_payment",
    label: "Record offline payment",
    moneyMovement: true,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
  {
    value: "shipping_override",
    label: "Shipping override",
    moneyMovement: false,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
  {
    value: "edit_order_items",
    label: "Edit order items",
    moneyMovement: false,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
  {
    value: "credit_memo",
    label: "Issue account credit",
    moneyMovement: true,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
  {
    value: "record_check_refund",
    label: "Record pending check refund",
    moneyMovement: true,
    requiresConsent: true,
    visibleInOrderSupport: false,
  },
  {
    value: "retry_qbd_posting",
    label: "Retry QuickBooks posting",
    moneyMovement: false,
    requiresConsent: false,
    visibleInOrderSupport: true,
  },
  {
    value: "cancel_order",
    label: "Cancel order",
    moneyMovement: false,
    requiresConsent: true,
    visibleInOrderSupport: true,
  },
] as const

export type StaffExceptionActionType =
  (typeof STAFF_EXCEPTION_ACTIONS)[number]["value"]

export const VISIBLE_STAFF_EXCEPTION_ACTIONS =
  STAFF_EXCEPTION_ACTIONS.filter((action) => action.visibleInOrderSupport)

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

export type StaffOrderItemEditEligibility = {
  canEdit: boolean
  status: string
  label: string
  reason: string
}

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
  const fulfillments = Array.isArray(order.fulfillments)
    ? order.fulfillments
    : []
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
    fulfillmentStatus === "fulfilled" ||
    fulfillmentStatus.includes("partially")
  ) {
    return "fulfillment_locked"
  }

  if (
    ["pending", "authorized", "captured", "partially_refunded"].includes(
      String(order.payment_status || "").toLowerCase()
    )
  ) {
    return "confirmed"
  }

  return "open"
}

export function staffOrderPickPackStatus(
  order: AnyRecord | null | undefined
): string {
  const metadata = order?.metadata || {}
  return String(
    metadata.finalization_status ||
      metadata.catch_weight_status ||
      metadata.pick_pack_status ||
      ""
  )
    .trim()
    .toLowerCase()
}

export function staffOrderItemEditEligibility(
  order: AnyRecord | null | undefined
): StaffOrderItemEditEligibility {
  if (!order) {
    return {
      canEdit: false,
      status: "unknown",
      label: "No order",
      reason: "Choose an order before editing items.",
    }
  }

  const operationalState = staffOrderOperationalState(order)
  if (operationalState === "canceled") {
    return {
      canEdit: false,
      status: "canceled",
      label: "Canceled",
      reason: "Canceled orders cannot be edited from Order Support.",
    }
  }
  if (
    operationalState === "completed_or_shipped" ||
    operationalState === "fulfillment_locked"
  ) {
    return {
      canEdit: false,
      status: operationalState,
      label: "Fulfillment locked",
      reason:
        "Order items cannot be edited after fulfillment has started. Use a note, refund, credit, or cancellation workflow instead.",
    }
  }

  const status = staffOrderPickPackStatus(order)
  if (!status || status === "pending_pick" || status === "pending_pack") {
    return {
      canEdit: true,
      status: status || "not_started",
      label: status ? status.replace(/_/g, " ") : "Not started",
      reason:
        "This order has not been claimed by a picker, or the picker put it back.",
    }
  }

  if (status === "picking") {
    return {
      canEdit: false,
      status,
      label: "Picker claimed",
      reason:
        "A picker has claimed this order. Ask the picker to put the pick back before changing items.",
    }
  }

  return {
    canEdit: false,
    status,
    label: status.replace(/_/g, " "),
    reason:
      "This order is already in packing, charging, shipping, or release. Item edits must happen before picking starts.",
  }
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

export function actionRequiredConfirmation(
  action: StaffExceptionActionType
): string | null {
  switch (action) {
    case "refund_payment":
      return "REFUND"
    case "capture_payment":
      return "CAPTURE"
    case "cancel_order":
      return "CANCEL"
    default:
      return null
  }
}

export function actionMutatesMedusa(action: StaffExceptionActionType): boolean {
  return (
    action === "refund_payment" ||
    action === "capture_payment" ||
    action === "edit_order_items" ||
    action === "cancel_order"
  )
}

export function actionRequiresQuickBooksPosting(
  action: StaffExceptionActionType
): boolean {
  return (
    action === "record_note" ||
    action === "edit_order_items" ||
    action === "cancel_order" ||
    action === "record_offline_payment" ||
    action === "credit_memo" ||
    action === "record_check_refund" ||
    action === "refund_payment" ||
    action === "capture_payment"
  )
}

export function actionIsAuditOnly(action: StaffExceptionActionType): boolean {
  return !actionMutatesMedusa(action)
}

export function actionIsBlockedByOperationalState(
  action: StaffExceptionActionType,
  state: StaffOrderOperationalState
): boolean {
  if (state === "canceled") {
    return action !== "record_note"
  }

  if (state === "completed_or_shipped") {
    return (
      action === "cancel_order" ||
      action === "capture_payment" ||
      action === "edit_order_items"
    )
  }

  if (state === "fulfillment_locked") {
    return action === "edit_order_items"
  }

  return false
}
