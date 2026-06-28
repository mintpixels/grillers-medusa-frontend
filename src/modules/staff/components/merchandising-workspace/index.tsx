"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { reportClientOpsAlert } from "@lib/client-error-reporter"
import type { ProductMerchandisingTagSummary } from "@lib/data/staff/product-merchandising"
import ProductMerchandisingTable from "@modules/staff/components/product-merchandising-table"

type LoadState = "loading" | "ready" | "error"

type Props = {
  countryCode: string
  initialError?: string | null
  initialTags?: ProductMerchandisingTagSummary[] | null
}

function catalogReviewGroupsEndpoints(countryCode: string) {
  const normalizedCountryCode = String(countryCode || "us")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
  const encodedCountryCode = encodeURIComponent(normalizedCountryCode || "us")

  return [
    `/${encodedCountryCode}/account/photo-groups/data`,
    `/${encodedCountryCode}/api/catalog-review/groups`,
    `/${encodedCountryCode}/api/staff/catalog-review/groups`,
  ]
}

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

async function responseBody(res: Response) {
  if (typeof res.text === "function") {
    const raw = await res.text().catch(() => "")
    if (raw) return parseResponseBody(raw)
  }

  if (typeof res.json === "function") {
    return res.json().catch(() => ({}))
  }

  return {}
}

function parseResponseBody(raw: string): Record<string, any> {
  const trimmed = raw.trim()
  if (!trimmed) return {}

  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(
      /<script[^>]*id=["']__gp_merchandising_tags["'][^>]*>([\s\S]*?)<\/script>/i
    )
    if (!match?.[1]) return {}
    try {
      return JSON.parse(match[1])
    } catch {
      return {}
    }
  }
}

export default function StaffMerchandisingWorkspace({
  countryCode,
  initialError = null,
  initialTags = null,
}: Props) {
  const router = useRouter()
  const [tags, setTags] = useState<ProductMerchandisingTagSummary[]>(
    () => initialTags || []
  )
  const [state, setState] = useState<LoadState>(() =>
    initialTags ? "ready" : "loading"
  )
  const [error, setError] = useState<string | null>(initialError)
  const [reloadKey, setReloadKey] = useState(0)

  // Prefer server-loaded tags from the staff page. Keep the plain fetch fallback
  // for direct client remounts without fresh server props; do not switch this to
  // a Server Action because actions can queue behind in-flight staff navigation.
  useEffect(() => {
    if (reloadKey === 0 && initialTags) {
      setTags(initialTags)
      setError(null)
      setState("ready")
      return
    }

    const controller = new AbortController()
    const endpoints = catalogReviewGroupsEndpoints(countryCode)
    setState("loading")
    setError(null)

    async function loadTags() {
      let lastError: unknown = null

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            signal: controller.signal,
            cache: "no-store",
            headers: { Accept: "application/json" },
          })
          const body = await responseBody(res)
          if (!res.ok) {
            throw new Error(
              responseErrorMessage(
                body?.error,
                `Request failed (${res.status}).`
              )
            )
          }

          return {
            endpoint,
            tags: Array.isArray(body?.tags) ? body.tags : [],
          }
        } catch (err) {
          if (controller.signal.aborted) throw err
          lastError = err
        }
      }

      throw lastError || new Error("Could not load merchandising data.")
    }

    loadTags()
      .then(({ tags }) => {
        setTags(tags)
        setState("ready")
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : String(err || initialError || "Could not load merchandising data.")
        reportClientOpsAlert({
          kind: "staff_module_load_failed",
          severity: "warn",
          title: "Staff merchandising module failed to load",
          message,
          extra: {
            staff_module: "merchandising",
            attempted_endpoints: endpoints,
          },
        })
        setError(message)
        setState("error")
      })

    return () => controller.abort()
  }, [countryCode, initialError, initialTags, reloadKey])

  const reload = useCallback(() => {
    if (initialTags) {
      setState("loading")
      setError(null)
      router.refresh()
      return
    }

    setReloadKey((key) => key + 1)
  }, [initialTags, router])

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
