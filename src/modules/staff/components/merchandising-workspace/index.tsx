"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { reportClientOpsAlert } from "@lib/client-error-reporter"
import type { ProductMerchandisingTagSummary } from "@lib/data/staff/product-merchandising"
import ProductMerchandisingTable from "@modules/staff/components/product-merchandising-table"

type LoadState = "loading" | "ready" | "error"

const TAGS_ENDPOINT = "/api/staff/catalog-review/groups"

function responseErrorMessage(
  value: unknown,
  fallback = "Could not load merchandising data."
) {
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

export default function StaffMerchandisingWorkspace() {
  const [tags, setTags] = useState<ProductMerchandisingTagSummary[]>([])
  const [state, setState] = useState<LoadState>("loading")
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Load via a plain fetch (NOT a Server Action). Clicking the workspace tile
  // triggers a client navigation on the force-dynamic staff console, and Next.js
  // serializes Server Actions behind in-flight navigations — a Server Action
  // here would be queued and never dispatch, hanging the spinner. A plain fetch
  // dispatches immediately and is unaffected by the pending navigation.
  useEffect(() => {
    const controller = new AbortController()
    setState("loading")
    setError(null)

    fetch(TAGS_ENDPOINT, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            responseErrorMessage(body?.error, `Request failed (${res.status}).`)
          )
        }
        setTags(Array.isArray(body?.tags) ? body.tags : [])
        setState("ready")
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : String(err)
        reportClientOpsAlert({
          kind: "staff_module_load_failed",
          severity: "warn",
          title: "Staff merchandising module failed to load",
          message,
          extra: {
            staff_module: "merchandising",
            endpoint: TAGS_ENDPOINT,
          },
        })
        setError(message)
        setState("error")
      })

    return () => controller.abort()
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 large:flex-row large:items-end large:justify-between">
        <div>
          <p className="text-xs font-maison-neue-mono uppercase text-Gold">
            Catalog
          </p>
          <h2 className="mt-2 text-2xl font-gyst font-bold text-Charcoal">
            Product merchandising
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-maison-neue text-Charcoal/60">
            L3 product tag groups with photo counts, review progress, and
            metadata signals pulled from Strapi.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={state === "loading"}
          className="inline-flex min-h-[40px] w-fit items-center justify-center gap-2 rounded-md border border-Charcoal px-3.5 text-sm font-maison-neue font-semibold text-Charcoal transition hover:bg-Charcoal hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      {state === "loading" && (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white text-Charcoal/55">
          <Loader2 className="h-6 w-6 animate-spin text-Gold" aria-hidden />
          <p className="text-sm font-maison-neue">
            Loading merchandising data…
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-maison-neue text-red-700">
          <p className="font-semibold">Could not load merchandising data.</p>
          {error && <p className="mt-1 text-red-700/80">{error}</p>}
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-3.5 text-sm font-rexton font-bold uppercase text-red-700 transition hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </button>
        </div>
      )}

      {state === "ready" && <ProductMerchandisingTable tags={tags} />}
    </div>
  )
}
