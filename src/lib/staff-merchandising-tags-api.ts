import { getProductMerchandisingTags } from "@lib/data/staff/product-merchandising"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { emitSlowStaffMerchandisingDataAlert } from "@lib/staff-merchandising-ops-alerts"
import { NextResponse } from "next/server"

function errorMessage(
  value: unknown,
  fallback = "Could not load merchandising data."
) {
  if (value instanceof Error) return value.message
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const record = value as Record<string, any>
    return (
      String(record.message || "").trim() ||
      String(record.error?.message || "").trim() ||
      String(record.error || "").trim() ||
      fallback
    )
  }
  return fallback
}

export async function handleStaffMerchandisingTagsRequest(input: {
  routePath: string
}) {
  const startedAt = Date.now()

  try {
    const tags = await getProductMerchandisingTags()
    void emitSlowStaffMerchandisingDataAlert({
      startedAt,
      tags,
      path: input.routePath,
    }).catch(() => {
      // Fail-open: alerting should not delay the staff response.
    })
    return NextResponse.json({ tags })
  } catch (error) {
    const message = errorMessage(error)
    const status = /access required/i.test(message) ? 403 : 500
    if (status >= 500) {
      void emitStorefrontOpsAlert({
        alertKind: "staff_module_load_failed",
        severity: "warn",
        title: `Staff merchandising data failed to load: ${message}`.slice(
          0,
          500
        ),
        path: input.routePath,
        source: "medusa-server",
        meta: {
          staff_module: "merchandising",
          status,
        },
      }).catch(() => {
        // Fail-open: alerting should not delay the staff error response.
      })
    }
    return NextResponse.json({ error: message }, { status })
  }
}
