"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DatabaseZap,
  RefreshCw,
  Search,
} from "lucide-react"
import {
  getStaffQuickBooksSyncStatus,
  type StaffQuickBooksSyncOrder,
  type StaffQuickBooksSyncStatus,
  type StaffQuickBooksSyncStatusFilter,
} from "@lib/data/staff/quickbooks-sync"

const STATUS_FILTERS: Array<{
  key: StaffQuickBooksSyncStatusFilter
  label: string
}> = [
  { key: "open", label: "Open" },
  { key: "stuck", label: "Stuck" },
  { key: "waiting", label: "Waiting" },
  { key: "error", label: "Errors" },
  { key: "synced", label: "Synced" },
  { key: "all", label: "All" },
]

function labelClass() {
  return "text-xs font-maison-neue-mono uppercase text-Charcoal/55"
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatMoney(value?: number | string | null, currencyCode = "usd") {
  if (value === null || value === undefined || value === "") return ""
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return ""

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(numeric)
}

function humanStatus(status: string) {
  const normalized = status.replace(/_/g, " ")
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusClass(status: string) {
  if (status === "synced") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (status === "waiting_for_web_connector" || status === "pending") {
    return "border-blue-200 bg-blue-50 text-blue-800"
  }
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-800"
  if (status === "canceled_before_qb") return "border-gray-200 bg-gray-50 text-Charcoal/60"
  return "border-red-200 bg-red-50 text-red-800"
}

function statusIcon(status: string) {
  if (status === "synced") return CheckCircle2
  if (status === "waiting_for_web_connector" || status === "pending") {
    return Clock3
  }
  return AlertTriangle
}

function fulfillmentLabel(value?: string | null) {
  if (!value) return "Fulfillment unknown"
  return humanStatus(value)
}

function taxSummary(order: StaffQuickBooksSyncOrder) {
  const parts = [
    order.qbd_tax_county,
    order.qbd_tax_rate ? `${order.qbd_tax_rate}%` : "",
    order.qbd_tax_item_full_name ? `QBD ${order.qbd_tax_item_full_name}` : "",
  ].filter(Boolean)

  return parts.length ? parts.join(" | ") : "Tax mapping not recorded"
}

function orderTitle(order: StaffQuickBooksSyncOrder) {
  if (order.display_id) return `#${order.display_id}`
  if (order.medusa_id) return order.medusa_id
  return `Sync row ${order.id}`
}

function orderSubtext(order: StaffQuickBooksSyncOrder) {
  const customer = order.customer_name || order.email || "Customer unknown"
  const email = order.customer_name && order.email ? ` | ${order.email}` : ""
  return `${customer}${email}`
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number
  tone?: "neutral" | "danger" | "warning" | "success"
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-gray-200 bg-white text-Charcoal"

  return (
    <div className={`rounded-md border px-3 py-3 ${toneClass}`}>
      <p className="text-[11px] font-maison-neue-mono uppercase opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-maison-neue font-semibold">{value}</p>
    </div>
  )
}

function OrderRow({ order }: { order: StaffQuickBooksSyncOrder }) {
  const Icon = statusIcon(order.status)
  const amount = formatMoney(order.total, order.currency_code || "usd")

  return (
    <article className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 large:flex-row large:items-start large:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-maison-neue text-lg font-semibold text-Charcoal">
              {orderTitle(order)}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-maison-neue-mono uppercase ${statusClass(
                order.status
              )}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {humanStatus(order.status)}
            </span>
          </div>
          <p className="mt-1 break-words text-sm font-maison-neue text-Charcoal/65">
            {orderSubtext(order)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-maison-neue text-Charcoal/65">
            <span>{order.item_count || 0} items</span>
            {amount && <span>{amount}</span>}
            <span>{fulfillmentLabel(order.fulfillment_type)}</span>
            {order.scheduled_date && <span>{order.scheduled_date}</span>}
            {order.fulfillment_zip && <span>ZIP {order.fulfillment_zip}</span>}
          </div>
        </div>
        <div className="min-w-[180px] rounded-md border border-gray-200 bg-SilverPlate/25 px-3 py-2">
          <p className={labelClass()}>QuickBooks</p>
          <p className="mt-1 text-sm font-maison-neue text-Charcoal">
            {order.qb_txn_number
              ? `Txn ${order.qb_txn_number}`
              : order.qb_txn_id
              ? "Txn ID recorded"
              : "Not in QuickBooks yet"}
          </p>
          <p className="mt-1 text-xs font-maison-neue text-Charcoal/55">
            Updated {formatDateTime(order.updated_at)}
          </p>
        </div>
      </div>

      {order.item_titles?.length ? (
        <p className="mt-3 truncate text-sm font-maison-neue text-Charcoal/75">
          {order.item_titles.join(", ")}
        </p>
      ) : null}

      <div className="mt-3 rounded-md bg-SilverPlate/30 px-3 py-2 text-xs font-maison-neue text-Charcoal/65">
        {taxSummary(order)}
      </div>

      {order.error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-maison-neue text-red-800">
          {order.error}
        </div>
      )}
    </article>
  )
}

export default function StaffQuickBooksSyncStatusConsole() {
  const [filter, setFilter] = useState<StaffQuickBooksSyncStatusFilter>("open")
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<StaffQuickBooksSyncStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const requestIdRef = useRef(0)
  const perPage = 20

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [query])

  function load() {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setError(null)

    startTransition(async () => {
      try {
        const next = await getStaffQuickBooksSyncStatus({
          status: filter,
          search: debouncedQuery,
          page,
          perPage,
        })
        if (requestId !== requestIdRef.current) return
        setData(next)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedQuery, page])

  const orders = data?.orders.data || []
  const syncStatus = data?.sync_status
  const activeSummary = useMemo(() => data?.summary, [data])

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <div className="flex flex-col gap-4 large:flex-row large:items-start large:justify-between">
          <div>
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Admin tools
            </p>
            <h2 className="mt-1 text-2xl font-gyst font-bold text-Charcoal">
              Synchronization status
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-maison-neue text-Charcoal/60">
              View website orders waiting for QuickBooks, stuck errors, recent
              Web Connector activity, and the reason a row needs attention.
            </p>
          </div>
          <button
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-Charcoal px-4 text-sm font-maison-neue font-semibold text-Charcoal transition hover:bg-Charcoal hover:text-white disabled:cursor-wait disabled:opacity-50"
            disabled={isPending}
            onClick={load}
            type="button"
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 large:grid-cols-5">
          <SummaryTile label="Open" value={activeSummary?.open || 0} />
          <SummaryTile
            label="Waiting"
            value={activeSummary?.waiting || 0}
            tone="neutral"
          />
          <SummaryTile
            label="Stuck"
            value={
              (activeSummary?.blocked || 0) +
              (activeSummary?.error || 0) +
              (activeSummary?.warning || 0) +
              (activeSummary?.stale_pending || 0)
            }
            tone="danger"
          />
          <SummaryTile
            label="Skipped"
            value={activeSummary?.skipped || 0}
            tone="warning"
          />
          <SummaryTile
            label="Synced"
            value={activeSummary?.synced || 0}
            tone="success"
          />
        </div>

        <div className="mt-4 rounded-md border border-gray-200 bg-SilverPlate/25 px-4 py-3">
          <div className="flex flex-col gap-2 small:flex-row small:items-center small:justify-between">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-Charcoal/55" aria-hidden />
              <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                Web Connector{" "}
                {syncStatus?.active ? "is currently active" : "is not active"}
              </p>
            </div>
            <p className="text-xs font-maison-neue text-Charcoal/55">
              Last session {formatDateTime(syncStatus?.last_web_connector_session_at)} |{" "}
              {syncStatus?.last_web_connector_status || "unknown"}
            </p>
          </div>
          {syncStatus?.current_step && (
            <p className="mt-1 text-xs font-maison-neue text-Charcoal/55">
              Current step: {humanStatus(syncStatus.current_step)}
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-gray-100 p-5">
        <div className="grid gap-3 large:grid-cols-[minmax(0,1fr)_auto] large:items-end">
          <label className="flex flex-col gap-1">
            <span className={labelClass()}>Order, email, or error</span>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Charcoal/45"
                aria-hidden
              />
              <input
                className="min-h-[44px] w-full rounded-md border border-gray-200 bg-white px-10 py-2 text-sm font-maison-neue text-Charcoal outline-none transition focus:border-Gold focus:ring-1 focus:ring-Gold"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order #, email, customer, ZIP, tax item, or error"
                type="search"
                value={query}
              />
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => {
              const active = item.key === filter
              return (
                <button
                  className={`min-h-[40px] rounded-md border px-3 text-xs font-maison-neue-mono uppercase transition ${
                    active
                      ? "border-Charcoal bg-Charcoal text-white"
                      : "border-gray-200 bg-white text-Charcoal hover:border-Charcoal"
                  }`}
                  key={item.key}
                  onClick={() => {
                    setFilter(item.key)
                    setPage(1)
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-maison-neue text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-3 p-5">
        {orders.length ? (
          orders.map((order) => <OrderRow key={order.id} order={order} />)
        ) : (
          <div className="rounded-md border border-dashed border-gray-200 bg-SilverPlate/20 px-4 py-10 text-center">
            <DatabaseZap
              className="mx-auto h-8 w-8 text-Charcoal/35"
              aria-hidden
            />
            <h3 className="mt-3 font-maison-neue text-lg font-semibold text-Charcoal">
              No orders in this view
            </h3>
            <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
              Change the filter or search text to inspect another part of the
              QuickBooks queue.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 small:flex-row small:items-center small:justify-between">
        <p className="text-sm font-maison-neue text-Charcoal/60">
          Showing page {data?.orders.current_page || page} of{" "}
          {Math.max(data?.orders.last_page || 1, 1)} |{" "}
          {data?.orders.total || 0} rows
        </p>
        <div className="flex gap-2">
          <button
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-gray-200 px-3 text-sm font-maison-neue font-semibold text-Charcoal transition hover:border-Charcoal disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page <= 1 || isPending}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <button
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-gray-200 px-3 text-sm font-maison-neue font-semibold text-Charcoal transition hover:border-Charcoal disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!data?.orders.has_more_pages || isPending}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}
