import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type OrderHistoryStage =
  | "medusa_purchase_history"
  | "legacy_purchase_history"
  | "legacy_customer_orders"
  | "legacy_customer_order_detail"

type OrderHistoryMode = "customer" | "staff_impersonation" | "unknown"

type OrderHistoryAlertInput = {
  stage: OrderHistoryStage
  mode?: OrderHistoryMode
  limit?: number | null
  offset?: number | null
  failureCount?: number | null
  error?: unknown
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export async function emitOrderHistoryDataFailureAlert({
  stage,
  mode = "unknown",
  limit = null,
  offset = null,
  failureCount = null,
  error,
}: OrderHistoryAlertInput) {
  const message = error === undefined ? null : errorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: "order_history_data_degraded",
    severity: "warn",
    title: `Order history ${stage} unavailable; using fallback`,
    path: "src/lib/data/orders.ts",
    source: "medusa-server",
    fingerprint: `order_history:${stage}:${mode}`,
    meta: {
      order_history_stage: stage,
      access_mode: mode,
      limit,
      offset,
      failure_count: failureCount,
      error_message: message ? message.slice(0, 300) : null,
    },
  })
}
