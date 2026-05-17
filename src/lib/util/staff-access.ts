import type { HttpTypes } from "@medusajs/types"

type StaffMetadata = Record<string, unknown> | null | undefined

const TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "y",
  "staff",
  "admin",
  "ops",
  "operator",
  "customer_service",
])

const STAFF_ROLES = new Set([
  "staff",
  "admin",
  "ops",
  "operator",
  "customer_service",
  "customer-service",
  "phone_orders",
  "phone-orders",
])

function truthyStaffValue(value: unknown): boolean {
  if (value === true) return true
  if (typeof value === "number") return value === 1
  if (typeof value !== "string") return false
  return TRUE_VALUES.has(value.trim().toLowerCase())
}

export function isStaffMetadata(metadata: StaffMetadata): boolean {
  if (!metadata) return false

  const directFlags = [
    metadata.is_staff,
    metadata.staff,
    metadata.gp_staff,
    metadata.staff_access,
    metadata.phone_order_staff,
  ]

  if (directFlags.some(truthyStaffValue)) return true

  const role = String(
    metadata.staff_role || metadata.role || metadata.account_role || ""
  )
    .trim()
    .toLowerCase()

  return STAFF_ROLES.has(role)
}

export function isStaffCustomer(
  customer:
    | Pick<HttpTypes.StoreCustomer, "metadata">
    | null
    | undefined
): boolean {
  return isStaffMetadata(customer?.metadata as StaffMetadata)
}

export function staffDisplayName(
  customer:
    | Pick<HttpTypes.StoreCustomer, "first_name" | "last_name" | "email">
    | null
    | undefined
): string {
  const name = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  return name || customer?.email || "Grillers Pride staff"
}
