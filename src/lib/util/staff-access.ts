import type { HttpTypes } from "@medusajs/types"

type StaffMetadata = Record<string, unknown> | null | undefined
type StaffCustomerLike =
  | (Pick<HttpTypes.StoreCustomer, "metadata"> & { email?: string | null })
  | null
  | undefined

export type StaffAccessRole = "customer" | "staff" | "super_admin"

export const STAFF_ROLE_OPTIONS: Array<{
  value: StaffAccessRole
  label: string
  description: string
  confirmation: string
}> = [
  {
    value: "customer",
    label: "Customer",
    description: "No staff console access.",
    confirmation: "REMOVE STAFF",
  },
  {
    value: "staff",
    label: "Staff",
    description: "Can enter customer context, place phone orders, and support orders.",
    confirmation: "STAFF",
  },
  {
    value: "super_admin",
    label: "Super admin",
    description: "All staff powers plus team access management.",
    confirmation: "SUPER ADMIN",
  },
]

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

const FALSE_VALUES = new Set(["0", "false", "no", "n", "customer", "none"])

const STAFF_ROLES = new Set([
  "staff",
  "admin",
  "ops",
  "operator",
  "customer_service",
  "customer-service",
  "phone_orders",
  "phone-orders",
  "super_admin",
  "super-admin",
  "owner",
])

const SUPER_ADMIN_EMAILS = new Set([
  "aviswerdlow@gmail.com",
  "peter@grillerspride.com",
])

function truthyStaffValue(value: unknown): boolean {
  if (value === true) return true
  if (typeof value === "number") return value === 1
  if (typeof value !== "string") return false
  return TRUE_VALUES.has(value.trim().toLowerCase())
}

function falseyStaffValue(value: unknown): boolean {
  if (value === false) return true
  if (typeof value === "number") return value === 0
  if (typeof value !== "string") return false
  return FALSE_VALUES.has(value.trim().toLowerCase())
}

function normalizedEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase()
}

export function isBootstrapSuperAdminEmail(email: unknown): boolean {
  return SUPER_ADMIN_EMAILS.has(normalizedEmail(email))
}

function normalizeRole(value: unknown): string {
  return String(value || "").trim().toLowerCase()
}

export function staffMetadataRole(metadata: StaffMetadata): StaffAccessRole {
  if (!metadata) return "customer"

  if (truthyStaffValue(metadata.staff_access_revoked)) {
    return "customer"
  }

  const role = normalizeRole(
    metadata.gp_staff_role ||
      metadata.staff_role ||
      metadata.role ||
      metadata.account_role ||
      ""
  )

  if (role === "super_admin" || role === "super-admin" || role === "owner") {
    return "super_admin"
  }

  if (STAFF_ROLES.has(role)) {
    return "staff"
  }

  const directFlags = [
    metadata.is_staff,
    metadata.staff,
    metadata.gp_staff,
    metadata.staff_access,
    metadata.phone_order_staff,
  ]

  if (directFlags.some(truthyStaffValue)) return "staff"

  return "customer"
}

export function isStaffMetadata(metadata: StaffMetadata): boolean {
  return staffMetadataRole(metadata) !== "customer"
}

export function isStaffCustomer(
  customer: StaffCustomerLike
): boolean {
  return staffAccessRole(customer) !== "customer"
}

export function staffAccessRole(customer: StaffCustomerLike): StaffAccessRole {
  if (isBootstrapSuperAdminEmail(customer?.email)) {
    return "super_admin"
  }

  return staffMetadataRole(customer?.metadata as StaffMetadata)
}

export function isSuperAdminCustomer(customer: StaffCustomerLike): boolean {
  return staffAccessRole(customer) === "super_admin"
}

export function isExplicitStaffDeny(value: unknown): boolean {
  return falseyStaffValue(value)
}

export function staffRoleLabel(role: StaffAccessRole): string {
  return STAFF_ROLE_OPTIONS.find((option) => option.value === role)?.label || role
}

export function staffRoleConfirmation(role: StaffAccessRole): string {
  return (
    STAFF_ROLE_OPTIONS.find((option) => option.value === role)?.confirmation || ""
  )
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
