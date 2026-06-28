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
  responseFormat?: "html" | "json" | "text"
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
    return staffMerchandisingTagsResponse(
      { tags },
      { format: input.responseFormat }
    )
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
    return staffMerchandisingTagsResponse(
      { error: message },
      { format: input.responseFormat, status }
    )
  }
}

function staffMerchandisingTagsResponse(
  body: { tags?: unknown[]; error?: string },
  {
    format = "json",
    status = 200,
  }: {
    format?: "html" | "json" | "text"
    status?: number
  } = {}
) {
  if (format === "html") {
    const payload = JSON.stringify(body).replace(/</g, "\\u003c")

    return new Response(
      `<!doctype html><html><head><meta name="robots" content="noindex,nofollow"></head><body><script id="__gp_merchandising_tags" type="application/json">${payload}</script></body></html>`,
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    )
  }

  if (format === "text") {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  }

  return NextResponse.json(body, { status })
}
