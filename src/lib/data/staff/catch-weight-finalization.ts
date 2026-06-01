"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { adminFetch } from "./admin"

type AnyRecord = Record<string, any>

export type StaffCatchWeightFinalizationSummary = {
  id: string
  order_id: string
  display_id?: string | null
  customer_email?: string | null
  customer_id?: string | null
  currency_code: string
  status: string
  estimated_order_total?: number | string | null
  final_order_total?: number | string | null
  delta_total?: number | string | null
  blocked_reason?: string | null
  qbd_posting_status?: string | null
  created_at?: string
  updated_at?: string
}

export type StaffCatchWeightLine = {
  id: string
  line_item_id: string
  customer_title?: string | null
  title_snapshot?: string | null
  sku?: string | null
  qbd_list_id?: string | null
  pricing_mode: string
  ordered_quantity?: number | string | null
  estimated_weight_total?: number | string | null
  actual_quantity?: number | string | null
  actual_piece_count?: number | string | null
  actual_weight_total?: number | string | null
  actual_unit_price?: number | string | null
  final_line_total?: number | string | null
  delta_line_total?: number | string | null
  status: string
  note?: string | null
  errors?: Array<{ message?: string } | string>
  warnings?: Array<{ message?: string } | string>
}

export type StaffCatchWeightFinalizationDetail = {
  order: AnyRecord
  finalization: StaffCatchWeightFinalizationSummary & AnyRecord
  lines: StaffCatchWeightLine[]
  payment_setup?: AnyRecord | null
  charge_attempts?: AnyRecord[]
  errors?: Array<{ line_item_id?: string; message: string }>
  warnings?: Array<{ line_item_id?: string; message: string }>
  totals?: AnyRecord
}

const STAFF_ORDERS_PATH = "/us/account/staff/orders"

function revalidateStaffOrders() {
  revalidatePath(STAFF_ORDERS_PATH)
}

export async function listCatchWeightFinalizationQueue(input?: {
  status?: string
  limit?: number
}) {
  const data = await adminFetch<{
    finalizations: StaffCatchWeightFinalizationSummary[]
    count: number
  }>("/admin/grillers/finalization/queue", {
    method: "GET",
    query: {
      status: input?.status,
      limit: input?.limit || 75,
    },
  })

  return data.finalizations || []
}

export async function getCatchWeightFinalizationDetail(orderId: string) {
  return adminFetch<StaffCatchWeightFinalizationDetail>(
    `/admin/grillers/orders/${orderId}/finalization`,
    { method: "GET" }
  )
}

export async function startCatchWeightFinalization(orderId: string) {
  const result = await adminFetch<StaffCatchWeightFinalizationDetail>(
    `/admin/grillers/orders/${orderId}/finalization/start`,
    { method: "POST", body: JSON.stringify({}) }
  )
  revalidateStaffOrders()
  return result
}

export async function updateCatchWeightFinalizationLine(input: {
  orderId: string
  lineItemId: string
  actual_weight_total?: string
  actual_piece_count?: string
  actual_quantity?: string
  actual_unit_price?: string
  status?: string
  short_reason?: string
  note?: string
}) {
  const result = await adminFetch<{ line: StaffCatchWeightLine }>(
    `/admin/grillers/orders/${input.orderId}/finalization/lines/${input.lineItemId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        actual_weight_total: input.actual_weight_total || null,
        actual_piece_count: input.actual_piece_count || null,
        actual_quantity: input.actual_quantity || null,
        actual_unit_price: input.actual_unit_price || null,
        status: input.status || null,
        short_reason: input.short_reason || null,
        note: input.note || null,
      }),
    }
  )
  revalidateStaffOrders()
  return result.line
}

export async function previewCatchWeightFinalization(orderId: string) {
  return adminFetch<StaffCatchWeightFinalizationDetail>(
    `/admin/grillers/orders/${orderId}/finalization/preview`,
    { method: "POST", body: JSON.stringify({ persist: true }) }
  )
}

export async function approveCatchWeightFinalization(orderId: string) {
  const result = await adminFetch<StaffCatchWeightFinalizationDetail>(
    `/admin/grillers/orders/${orderId}/finalization/approve`,
    { method: "POST", body: JSON.stringify({}) }
  )
  revalidateStaffOrders()
  return result
}

export async function chargeAndReleaseCatchWeightOrder(orderId: string) {
  const result = await adminFetch<StaffCatchWeightFinalizationDetail>(
    `/admin/grillers/orders/${orderId}/finalization/charge-and-release`,
    {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `staff-final-charge:${orderId}:${Date.now()}`,
      }),
    }
  )
  revalidateStaffOrders()
  return result
}
