type AnyRecord = Record<string, any>

export const STAFF_CUSTOMER_ACCOUNT_REASON_OPTIONS = [
  { value: "goodwill", label: "Goodwill" },
  { value: "product_issue", label: "Product issue" },
  { value: "delivery_issue", label: "Delivery issue" },
  { value: "refund_alternative", label: "Refund alternative" },
  { value: "legacy_balance", label: "Legacy balance" },
  { value: "other", label: "Other" },
] as const

export type StaffCustomerAccountReasonCode =
  (typeof STAFF_CUSTOMER_ACCOUNT_REASON_OPTIONS)[number]["value"]

export type StaffCustomerAccountCredit = {
  id: string
  amount: number
  amountMinor: number
  currencyCode: string
  reasonCode: StaffCustomerAccountReasonCode
  staffNote: string
  customerVisibleNote?: string
  relatedOrderId?: string
  relatedOrderDisplayId?: string
  status: "pending_qbd" | "posted" | "void"
  qbdPostingStatus?: string
  qbdPostingAction?: string
  qbdPostingRequestKey?: string
  createdAt: string
  createdByStaffCustomerId?: string
  createdByStaffEmail?: string
  createdByStaffName?: string
}

export type StaffCustomerAccountNote = {
  id: string
  note: string
  reasonCode: StaffCustomerAccountReasonCode
  relatedOrderId?: string
  relatedOrderDisplayId?: string
  createdAt: string
  createdByStaffCustomerId?: string
  createdByStaffEmail?: string
  createdByStaffName?: string
}

function parseJsonArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.filter(Boolean) as AnyRecord[]

  if (typeof value !== "string") return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function validReasonCode(value: unknown): StaffCustomerAccountReasonCode {
  const code = String(value || "").trim()
  return STAFF_CUSTOMER_ACCOUNT_REASON_OPTIONS.some(
    (option) => option.value === code
  )
    ? (code as StaffCustomerAccountReasonCode)
    : "other"
}

function moneyAmountFromMinor(amountMinor: number): number {
  return Math.round(amountMinor) / 100
}

export function parseStaffCustomerAccountCredits(
  metadata: AnyRecord | null | undefined
): StaffCustomerAccountCredit[] {
  return parseJsonArray(metadata?.customer_account_credits)
    .map((entry) => {
      const amountMinor = Number(entry.amountMinor ?? entry.amount_minor ?? 0)
      const id = String(entry.id || "").trim()
      if (!id || !Number.isFinite(amountMinor)) return null

      return {
        id,
        amount: Number.isFinite(Number(entry.amount))
          ? Number(entry.amount)
          : moneyAmountFromMinor(amountMinor),
        amountMinor: Math.round(amountMinor),
        currencyCode: String(
          entry.currencyCode || entry.currency_code || "usd"
        ),
        reasonCode: validReasonCode(entry.reasonCode || entry.reason_code),
        staffNote: String(entry.staffNote || entry.staff_note || ""),
        customerVisibleNote: String(
          entry.customerVisibleNote || entry.customer_visible_note || ""
        ).trim(),
        relatedOrderId: String(
          entry.relatedOrderId || entry.related_order_id || ""
        ).trim(),
        relatedOrderDisplayId: String(
          entry.relatedOrderDisplayId || entry.related_order_display_id || ""
        ).trim(),
        status:
          entry.status === "posted" || entry.status === "void"
            ? entry.status
            : "pending_qbd",
        qbdPostingStatus: String(
          entry.qbdPostingStatus || entry.qbd_posting_status || ""
        ).trim(),
        qbdPostingAction: String(
          entry.qbdPostingAction || entry.qbd_posting_action || ""
        ).trim(),
        qbdPostingRequestKey: String(
          entry.qbdPostingRequestKey || entry.qbd_posting_request_key || ""
        ).trim(),
        createdAt: String(entry.createdAt || entry.created_at || ""),
        createdByStaffCustomerId: String(
          entry.createdByStaffCustomerId ||
            entry.created_by_staff_customer_id ||
            ""
        ).trim(),
        createdByStaffEmail: String(
          entry.createdByStaffEmail || entry.created_by_staff_email || ""
        ).trim(),
        createdByStaffName: String(
          entry.createdByStaffName || entry.created_by_staff_name || ""
        ).trim(),
      } satisfies StaffCustomerAccountCredit
    })
    .filter(Boolean) as StaffCustomerAccountCredit[]
}

export function parseStaffCustomerAccountNotes(
  metadata: AnyRecord | null | undefined
): StaffCustomerAccountNote[] {
  return parseJsonArray(metadata?.customer_account_notes)
    .map((entry) => {
      const id = String(entry.id || "").trim()
      const note = String(entry.note || "").trim()
      if (!id || !note) return null

      return {
        id,
        note,
        reasonCode: validReasonCode(entry.reasonCode || entry.reason_code),
        relatedOrderId: String(
          entry.relatedOrderId || entry.related_order_id || ""
        ).trim(),
        relatedOrderDisplayId: String(
          entry.relatedOrderDisplayId || entry.related_order_display_id || ""
        ).trim(),
        createdAt: String(entry.createdAt || entry.created_at || ""),
        createdByStaffCustomerId: String(
          entry.createdByStaffCustomerId ||
            entry.created_by_staff_customer_id ||
            ""
        ).trim(),
        createdByStaffEmail: String(
          entry.createdByStaffEmail || entry.created_by_staff_email || ""
        ).trim(),
        createdByStaffName: String(
          entry.createdByStaffName || entry.created_by_staff_name || ""
        ).trim(),
      } satisfies StaffCustomerAccountNote
    })
    .filter(Boolean) as StaffCustomerAccountNote[]
}

export function staffCustomerAccountCreditBalanceMinor(
  metadata: AnyRecord | null | undefined
): number {
  const explicit = Number(metadata?.customer_account_credit_balance_minor)
  if (Number.isFinite(explicit)) return Math.round(explicit)

  return parseStaffCustomerAccountCredits(metadata).reduce((sum, credit) => {
    if (credit.status === "void") return sum
    return sum + credit.amountMinor
  }, 0)
}

export function staffCustomerAccountCreditBalance(
  metadata: AnyRecord | null | undefined
): number {
  return moneyAmountFromMinor(staffCustomerAccountCreditBalanceMinor(metadata))
}

export function staffCustomerAccountReasonLabel(
  reasonCode: string | null | undefined
): string {
  return (
    STAFF_CUSTOMER_ACCOUNT_REASON_OPTIONS.find(
      (option) => option.value === reasonCode
    )?.label || "Other"
  )
}
