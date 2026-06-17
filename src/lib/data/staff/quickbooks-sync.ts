"use server"

import "server-only"

import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import {
  canManageOrderSupport,
  staffDisplayName,
} from "@lib/util/staff-access"
import { adminFetch } from "./admin"

async function requireOrderSupportStaff() {
  const staff = await retrieveAuthenticatedCustomerForStaffAccess()
  if (!staff || !canManageOrderSupport(staff)) {
    throw new Error("Order support access required.")
  }
  return staff
}

export type StaffQuickBooksSyncStatusFilter =
  | "open"
  | "stuck"
  | "waiting"
  | "pending"
  | "blocked"
  | "error"
  | "warning"
  | "skipped"
  | "synced"
  | "all"

export type StaffQuickBooksSyncOrder = {
  id: number
  display_id?: number | string | null
  medusa_id?: string | null
  qb_id?: string | null
  qb_txn_id?: string | null
  qb_txn_number?: string | null
  status: string
  error?: string | null
  blocked_at?: string | null
  medusa_synced_at?: string | null
  store_synced_at?: string | null
  qb_synced_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  customer_name?: string | null
  email?: string | null
  total?: number | string | null
  currency_code?: string | null
  item_count?: number
  item_titles?: string[]
  fulfillment_type?: string | null
  scheduled_date?: string | null
  fulfillment_zip?: string | null
  qbd_tax_item_full_name?: string | null
  qbd_tax_item_list_id?: string | null
  qbd_tax_rate?: number | string | null
  qbd_tax_county?: string | null
}

export type StaffQuickBooksSyncRecentLog = {
  id: number
  session_ticket?: string | null
  action: string
  entity_type?: string | null
  status: string
  records_processed?: number | null
  details?: Record<string, any> | null
  created_at?: string | null
}

export type StaffQuickBooksSyncStatus = {
  summary: {
    total_orders: number
    open: number
    waiting: number
    stale_pending: number
    blocked: number
    error: number
    warning: number
    skipped: number
    synced: number
  }
  sync_status: {
    active: boolean
    started_at?: string | null
    current_step?: string | null
    last_web_connector_session_at?: string | null
    last_web_connector_status?: string | null
    qbwc_configuration?: {
      configured: boolean
      username_configured: boolean
      password_configured: boolean
      username?: string | null
      warnings?: string[]
    }
  }
  orders: {
    data: StaffQuickBooksSyncOrder[]
    current_page: number
    per_page: number
    total: number
    last_page: number
    has_more_pages: boolean
  }
  recent_logs: StaffQuickBooksSyncRecentLog[]
}

export async function getStaffQuickBooksSyncStatus(input?: {
  status?: StaffQuickBooksSyncStatusFilter
  search?: string
  page?: number
  perPage?: number
}) {
  await requireOrderSupportStaff()
  return adminFetch<StaffQuickBooksSyncStatus>(
    "/admin/grillers/quickbooks-sync/status",
    {
      method: "GET",
      query: {
        status: input?.status || "open",
        search: input?.search?.trim() || undefined,
        page: input?.page || 1,
        per_page: input?.perPage || 25,
      },
    }
  )
}

export async function requeueStaffQuickBooksSyncOrder(
  orderId: number,
  reason = "Staff retry from Synchronization Status."
) {
  const staff = await requireOrderSupportStaff()

  const actor = `${staffDisplayName(staff)}${staff.email ? ` (${staff.email})` : ""}`
  return adminFetch<{ order: StaffQuickBooksSyncOrder }>(
    `/admin/grillers/quickbooks-sync/orders/${orderId}/requeue`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: `${reason} Staff: ${actor}`,
      }),
    }
  )
}
