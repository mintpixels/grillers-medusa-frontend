"use server"

import "server-only"

import { adminFetch } from "./admin"

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
