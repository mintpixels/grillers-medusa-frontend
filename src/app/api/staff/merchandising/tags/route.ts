import { getProductMerchandisingTags } from "@lib/data/staff/product-merchandising"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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

// Plain GET endpoint for the staff merchandising workspace. The workspace lives
// inside the staff console (a force-dynamic page), and clicking its tile fires a
// client navigation. Next.js serializes Server Actions behind an in-flight
// navigation, so fetching the tags via a Server Action from the freshly-mounted
// workspace deadlocks (the action never dispatches and the spinner hangs). A
// plain fetch to this route is not serialized behind the navigation, so it
// dispatches immediately. Auth is enforced by getProductMerchandisingTags()
// itself (requires the merchandising-reviewer or super-admin capability).
export async function GET() {
  try {
    const tags = await getProductMerchandisingTags()
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
        path: "src/app/api/staff/merchandising/tags/route.ts",
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
