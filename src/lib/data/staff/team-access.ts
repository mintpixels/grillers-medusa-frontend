"use server"

import "server-only"

import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import {
  canChargeFinalOrders,
  isBootstrapSuperAdminEmail,
  isSuperAdminCustomer,
  staffAccessRole,
  staffDisplayName,
  staffRoleConfirmation,
  type StaffAccessRole,
} from "@lib/util/staff-access"
import { revalidateTag } from "next/cache"
import { getCacheTag } from "../cookies"
import { adminFetch, appendStaffAuditLog } from "./admin"
import { parseStaffAuditLog, type StaffAuditEntry } from "./exception-types"

type AnyRecord = Record<string, any>

export type StaffTeamUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
  role: StaffAccessRole
  finalChargeEnabled: boolean
  isBootstrapSuperAdmin: boolean
  latestStaffAccessEvent?: StaffAuditEntry
  recentStaffAccessEvents: StaffAuditEntry[]
}

export type StaffRoleUpdateInput = {
  customerId: string
  role: StaffAccessRole
  finalChargeEnabled?: boolean
  reason: string
  confirmation: string
}

export type StaffTeamSearchResult = {
  ok: boolean
  users: StaffTeamUser[]
  error?: string
}

const VALID_ROLES = new Set<StaffAccessRole>([
  "customer",
  "staff",
  "office",
  "picker",
  "packer",
  "manager",
  "super_admin",
])
const LEGACY_STAFF_ROLES = new Set([
  "staff",
  "office",
  "picker",
  "packer",
  "manager",
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

async function requireSuperAdmin() {
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()
  if (!customer || !isSuperAdminCustomer(customer)) {
    throw new Error("Super admin access required.")
  }
  return customer
}

function formatCustomerName(customer: AnyRecord): string {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() ||
    customer.email ||
    "Customer"
  )
}

function staffAccessEvents(metadata: AnyRecord | null | undefined) {
  return parseStaffAuditLog(metadata)
    .filter((entry) => entry.action === "staff_role_change")
    .slice(-5)
    .reverse()
}

function summarizeCustomer(customer: AnyRecord): StaffTeamUser {
  const events = staffAccessEvents(customer.metadata)

  return {
    id: customer.id,
    email: customer.email || "",
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    phone: customer.phone || "",
    company: customer.company_name || "",
    role: staffAccessRole(customer),
    finalChargeEnabled: canChargeFinalOrders(customer),
    isBootstrapSuperAdmin: isBootstrapSuperAdminEmail(customer.email),
    latestStaffAccessEvent: events[0],
    recentStaffAccessEvents: events,
  }
}

function requiredConfirmation(role: StaffAccessRole): string {
  return staffRoleConfirmation(role)
}

function roleMetadata(
  current: AnyRecord | null | undefined,
  role: StaffAccessRole,
  options: { finalChargeEnabled?: boolean } = {}
): AnyRecord {
  const metadata = { ...(current || {}) }
  const hasStaffAccess = role !== "customer"
  const now = new Date().toISOString()

  metadata.gp_staff_role = role
  metadata.staff_role = role
  metadata.staff_access = hasStaffAccess
  metadata.is_staff = hasStaffAccess
  metadata.gp_staff = hasStaffAccess
  metadata.phone_order_staff = hasStaffAccess
  metadata.staff_super_admin = role === "super_admin"
  metadata.staff_access_revoked = role === "customer"
  metadata.staff_access_updated_at = now
  metadata.final_charge_enabled =
    role === "super_admin" ||
    (hasStaffAccess && Boolean(options.finalChargeEnabled))
  metadata.can_charge_final_orders = metadata.final_charge_enabled

  if (role === "customer") {
    const roleValue = String(metadata.role || "").trim().toLowerCase()
    const accountRoleValue = String(metadata.account_role || "").trim().toLowerCase()
    if (LEGACY_STAFF_ROLES.has(roleValue)) metadata.role = "customer"
    if (LEGACY_STAFF_ROLES.has(accountRoleValue)) metadata.account_role = "customer"
  }

  return metadata
}

export async function searchStaffTeamUsers(
  query: string
): Promise<StaffTeamSearchResult> {
  try {
    await requireSuperAdmin()

    const q = query.trim()
    if (q.length < 2) return { ok: true, users: [] }

    const attempts: Array<Record<string, string | number>> = [{ q }]
    if (q.includes("@")) attempts.push({ email: q })
    if (q.includes("+")) attempts.push({ q: q.split("+")[0] })

    const seen = new Set<string>()
    const users: StaffTeamUser[] = []
    let lastError: unknown = null

    for (const attempt of attempts) {
      try {
        const { customers } = await adminFetch<{ customers: AnyRecord[] }>(
          "/admin/customers",
          {
            query: {
              ...attempt,
              limit: 20,
              fields: "id,email,first_name,last_name,phone,company_name,metadata",
            },
          }
        )

        ;(customers || []).forEach((customer) => {
          if (!customer?.id || seen.has(customer.id)) return
          seen.add(customer.id)
          users.push(summarizeCustomer(customer))
        })
      } catch (err) {
        lastError = err
      }
    }

    if (!users.length && lastError) {
      throw lastError
    }

    return { ok: true, users }
  } catch (err) {
    console.error("[staff-team-access] customer search failed", err)
    return {
      ok: false,
      users: [],
      error:
        "Customer lookup failed. Try searching by name or the email before the plus sign, then try again.",
    }
  }
}

export async function updateStaffTeamRole(
  input: StaffRoleUpdateInput
): Promise<{ ok: boolean; user?: StaffTeamUser; error?: string }> {
  try {
    const actor = await requireSuperAdmin()
    const role = input.role
    if (!VALID_ROLES.has(role)) {
      throw new Error("Choose a valid staff role.")
    }

    const reason = input.reason.trim()
    if (reason.length < 8) {
      throw new Error("Add a short reason before changing staff access.")
    }

    const required = requiredConfirmation(role)
    if (input.confirmation.trim().toUpperCase() !== required) {
      throw new Error(`Type ${required} to confirm this staff access change.`)
    }

    const { customer } = await adminFetch<{ customer: AnyRecord }>(
      `/admin/customers/${input.customerId}`,
      {
        query: {
          fields: "id,email,first_name,last_name,phone,company_name,metadata",
        },
      }
    )

    if (!customer?.id) {
      throw new Error("Customer not found.")
    }

    const targetEmail = String(customer.email || "").trim().toLowerCase()
    const actorEmail = String(actor.email || "").trim().toLowerCase()
    const previousRole = staffAccessRole(customer)

    if (isBootstrapSuperAdminEmail(targetEmail) && role !== "super_admin") {
      throw new Error("Bootstrap super admins cannot be demoted in the UI.")
    }

    if (customer.id === actor.id && role !== "super_admin") {
      throw new Error("You cannot remove your own super admin access.")
    }

    const metadata = appendStaffAuditLog(
      roleMetadata(customer.metadata, role, {
        finalChargeEnabled: input.finalChargeEnabled,
      }),
      {
        action: "staff_role_change",
        staff_actor_customer_id: actor.id,
        staff_actor_email: actorEmail,
        staff_actor_name: staffDisplayName(actor),
        target_customer_id: customer.id,
        target_email: targetEmail,
        target_name: formatCustomerName(customer),
        previous_role: previousRole,
        role,
        final_charge_enabled:
          role === "super_admin" ||
          (role !== "customer" && Boolean(input.finalChargeEnabled)),
        reason,
      }
    )

    await adminFetch(`/admin/customers/${customer.id}`, {
      method: "POST",
      body: JSON.stringify({ metadata }),
    })

    const customersTag = await getCacheTag("customers")
    revalidateTag(customersTag)

    const updated = await adminFetch<{ customer: AnyRecord }>(
      `/admin/customers/${customer.id}`,
      {
        query: {
          fields: "id,email,first_name,last_name,phone,company_name,metadata",
        },
      }
    )

    return { ok: true, user: summarizeCustomer(updated.customer) }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Could not update staff access.",
    }
  }
}
