"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Button from "@modules/common/components/button"
import {
  approveCatchWeightFinalization,
  chargeAndReleaseCatchWeightOrder,
  getCatchWeightFinalizationDetail,
  listCatchWeightFinalizationQueue,
  previewCatchWeightFinalization,
  startCatchWeightFinalization,
  updateCatchWeightFinalizationLine,
  type StaffCatchWeightFinalizationDetail,
  type StaffCatchWeightFinalizationSummary,
  type StaffCatchWeightLine,
} from "@lib/data/staff/catch-weight-finalization"

const statusLabels: Record<string, string> = {
  pending_pack: "Needs pack",
  packing: "Packing",
  packed_pending_review: "Review",
  packed_pending_charge: "Ready charge",
  charge_attempting: "Charging",
  charge_failed_hold: "Charge hold",
  charged_ready_to_ship: "Ready ship",
  released_to_fulfillment: "Released",
}

const statusClass: Record<string, string> = {
  charge_failed_hold: "border-red-200 bg-red-50 text-red-800",
  packed_pending_charge: "border-emerald-200 bg-emerald-50 text-emerald-800",
  charged_ready_to_ship: "border-blue-200 bg-blue-50 text-blue-800",
  released_to_fulfillment: "border-blue-200 bg-blue-50 text-blue-800",
  packing: "border-amber-200 bg-amber-50 text-amber-800",
  packed_pending_review: "border-amber-200 bg-amber-50 text-amber-800",
}

function money(value?: number | string | null, currencyCode = "usd") {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "-"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function numberText(value?: number | string | null) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ""
  return String(amount)
}

function statusBadge(status?: string) {
  const safe = status || "pending_pack"
  return (
    <span
      className={`inline-flex min-h-[26px] items-center rounded-full border px-2.5 text-[11px] font-maison-neue-mono uppercase ${
        statusClass[safe] || "border-gray-200 bg-gray-50 text-Charcoal/65"
      }`}
    >
      {statusLabels[safe] || safe.replace(/_/g, " ")}
    </span>
  )
}

function lineMessage(value: StaffCatchWeightLine["errors"]) {
  if (!Array.isArray(value) || !value.length) return null
  return value
    .map((item) => (typeof item === "string" ? item : item.message))
    .filter(Boolean)
    .join(" ")
}

function LineEditor({
  orderId,
  line,
  currencyCode,
  onSaved,
}: {
  orderId: string
  line: StaffCatchWeightLine
  currencyCode: string
  onSaved: () => void
}) {
  const [draft, setDraft] = useState({
    actual_weight_total: numberText(line.actual_weight_total),
    actual_piece_count: numberText(line.actual_piece_count),
    actual_quantity: numberText(line.actual_quantity || line.ordered_quantity),
    actual_unit_price: numberText(line.actual_unit_price),
    status: line.status || "ready",
    short_reason: "",
    note: line.note || "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const isPerLb = line.pricing_mode === "per_lb"

  useEffect(() => {
    setDraft({
      actual_weight_total: numberText(line.actual_weight_total),
      actual_piece_count: numberText(line.actual_piece_count),
      actual_quantity: numberText(line.actual_quantity || line.ordered_quantity),
      actual_unit_price: numberText(line.actual_unit_price),
      status: line.status || "ready",
      short_reason: "",
      note: line.note || "",
    })
  }, [line])

  function update(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        await updateCatchWeightFinalizationLine({
          orderId,
          lineItemId: line.line_item_id,
          ...draft,
        })
        onSaved()
      } catch (err: any) {
        setError(err.message || "Could not save line.")
      }
    })
  }

  return (
    <div className="border-b border-gray-200 px-4 py-4 last:border-b-0">
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_110px_110px_110px_120px_128px] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-gyst text-lg font-bold text-Charcoal">
              {line.customer_title || line.title_snapshot || "Order line"}
            </h4>
            {statusBadge(line.status)}
          </div>
          <p className="mt-1 text-xs font-maison-neue-mono uppercase text-Charcoal/45">
            {[line.sku, line.qbd_list_id ? "QBD" : "Missing QBD"]
              .filter(Boolean)
              .join(" | ")}
          </p>
          <p className="mt-1 text-sm font-maison-neue text-Charcoal/60">
            Ordered {numberText(line.ordered_quantity) || "0"}
            {line.estimated_weight_total
              ? ` | est. ${numberText(line.estimated_weight_total)} lb`
              : ""}
            {line.final_line_total
              ? ` | final ${money(line.final_line_total, currencyCode)}`
              : ""}
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
            Weight lb
          </span>
          <input
            className="min-h-[42px] rounded-md border border-gray-200 px-3 text-sm"
            inputMode="decimal"
            value={draft.actual_weight_total}
            disabled={!isPerLb || draft.status === "removed"}
            onChange={(event) => update("actual_weight_total", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
            Pieces
          </span>
          <input
            className="min-h-[42px] rounded-md border border-gray-200 px-3 text-sm"
            inputMode="decimal"
            value={draft.actual_piece_count}
            onChange={(event) => update("actual_piece_count", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
            Quantity
          </span>
          <input
            className="min-h-[42px] rounded-md border border-gray-200 px-3 text-sm"
            inputMode="decimal"
            value={draft.actual_quantity}
            onChange={(event) => update("actual_quantity", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
            State
          </span>
          <select
            className="min-h-[42px] rounded-md border border-gray-200 px-3 text-sm"
            value={draft.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="ready">Ready</option>
            <option value="needs_weight">Needs weight</option>
            <option value="removed">Removed</option>
            <option value="substituted">Substituted</option>
          </select>
        </label>

        <Button
          className="min-h-[42px] rounded-md bg-Charcoal px-4 text-xs font-rexton font-bold uppercase text-white"
          isLoading={isPending}
          onClick={save}
          type="button"
        >
          Save Line
        </Button>
      </div>

      {draft.status === "removed" && (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
            Short reason
          </span>
          <input
            className="min-h-[42px] rounded-md border border-gray-200 px-3 text-sm"
            value={draft.short_reason}
            onChange={(event) => update("short_reason", event.target.value)}
          />
        </label>
      )}

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
          Note
        </span>
        <input
          className="min-h-[42px] rounded-md border border-gray-200 px-3 text-sm"
          value={draft.note}
          onChange={(event) => update("note", event.target.value)}
        />
      </label>

      {(lineMessage(line.errors) || lineMessage(line.warnings) || error) && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error || lineMessage(line.errors) || lineMessage(line.warnings)}
        </p>
      )}
    </div>
  )
}

export default function StaffCatchWeightFinalizationConsole() {
  const [queue, setQueue] = useState<StaffCatchWeightFinalizationSummary[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detail, setDetail] =
    useState<StaffCatchWeightFinalizationDetail | null>(null)
  const [filter, setFilter] = useState("pending_pack,packing,packed_pending_review,packed_pending_charge,charge_failed_hold")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedSummary = useMemo(
    () => queue.find((item) => item.order_id === selectedOrderId),
    [queue, selectedOrderId]
  )
  const currencyCode =
    detail?.finalization?.currency_code ||
    selectedSummary?.currency_code ||
    "usd"

  function loadQueue(nextSelectedOrderId?: string | null) {
    startTransition(async () => {
      try {
        const rows = await listCatchWeightFinalizationQueue({
          status: filter,
          limit: 100,
        })
        setQueue(rows)
        const nextId =
          nextSelectedOrderId ||
          selectedOrderId ||
          rows[0]?.order_id ||
          null
        setSelectedOrderId(nextId)
        if (nextId) {
          setDetail(await getCatchWeightFinalizationDetail(nextId))
        } else {
          setDetail(null)
        }
      } catch (err: any) {
        setError(err.message || "Could not load finalization queue.")
      }
    })
  }

  function loadDetail(orderId: string) {
    setSelectedOrderId(orderId)
    setError(null)
    startTransition(async () => {
      try {
        setDetail(await getCatchWeightFinalizationDetail(orderId))
      } catch (err: any) {
        setError(err.message || "Could not load order.")
      }
    })
  }

  function runAction(
    label: string,
    action: (orderId: string) => Promise<StaffCatchWeightFinalizationDetail>
  ) {
    if (!selectedOrderId) return
    setError(null)
    setStatus(null)
    startTransition(async () => {
      try {
        const result = await action(selectedOrderId)
        setDetail({
          ...result,
          order: result.order || detail?.order || { id: selectedOrderId },
          lines: result.lines || detail?.lines || [],
        })
        setStatus(label)
        loadQueue(selectedOrderId)
      } catch (err: any) {
        setError(err.message || "Action failed.")
      }
    })
  }

  useEffect(() => {
    loadQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const totals = detail?.totals || detail?.finalization || {}

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Pack and finalize
            </p>
            <h2 className="mt-1 text-2xl font-gyst font-bold text-Charcoal">
              Pack & finalize queue
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Needs packing", "pending_pack,packing,packed_pending_review,packed_pending_charge,charge_failed_hold"],
              ["Ready charge", "packed_pending_charge"],
              ["Charge holds", "charge_failed_hold"],
              ["Ready ship", "charged_ready_to_ship,released_to_fulfillment"],
            ].map(([label, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`min-h-[36px] rounded-md border px-3 text-xs font-maison-neue-mono uppercase ${
                  filter === value
                    ? "border-Charcoal bg-Charcoal text-white"
                    : "border-gray-200 bg-white text-Charcoal hover:border-Gold/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(error || status) && (
        <div
          className={`mx-5 mt-5 rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || status}
        </div>
      )}

      <div className="grid min-h-[620px] xl:grid-cols-[440px_minmax(0,1fr)]">
        <div className="border-b border-gray-200 xl:border-b-0 xl:border-r">
          <div className="grid grid-cols-[92px_minmax(0,1fr)_116px] border-b border-gray-200 px-4 py-3 text-[11px] font-maison-neue-mono uppercase text-Charcoal/45">
            <span>Order</span>
            <span>Customer</span>
            <span className="text-right">Total</span>
          </div>
          <div className="max-h-[620px] overflow-auto">
            {queue.map((item) => {
              const selected = item.order_id === selectedOrderId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadDetail(item.order_id)}
                  className={`grid w-full grid-cols-[92px_minmax(0,1fr)_116px] gap-2 border-b border-gray-100 px-4 py-3 text-left transition ${
                    selected ? "bg-Gold/10" : "hover:bg-SilverPlate/30"
                  }`}
                >
                  <span>
                    <span className="block font-maison-neue-mono text-sm text-Charcoal">
                      {item.display_id ? `#${item.display_id}` : item.order_id.slice(-6)}
                    </span>
                    <span className="mt-1 block">{statusBadge(item.status)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-maison-neue text-Charcoal">
                      {item.customer_email || "Customer"}
                    </span>
                    {item.blocked_reason && (
                      <span className="mt-1 block truncate text-xs text-red-700">
                        {item.blocked_reason.replace(/_/g, " ")}
                      </span>
                    )}
                  </span>
                  <span className="text-right text-sm font-maison-neue text-Charcoal">
                    {money(
                      item.final_order_total || item.estimated_order_total,
                      item.currency_code
                    )}
                    {item.delta_total ? (
                      <span className="block text-xs text-Charcoal/50">
                        {money(item.delta_total, item.currency_code)}
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })}
            {!queue.length && (
              <p className="px-4 py-8 text-sm font-maison-neue text-Charcoal/55">
                No submitted orders are waiting for catch-weight finalization.
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {detail ? (
            <>
              <div className="border-b border-gray-200 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-gyst font-bold text-Charcoal">
                        {detail.order?.display_id
                          ? `#${detail.order.display_id}`
                          : detail.order?.id}
                      </h3>
                      {statusBadge(detail.finalization.status)}
                    </div>
                    <p className="mt-1 text-sm font-maison-neue text-Charcoal/60">
                      {detail.order?.email || detail.finalization.customer_email}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-right">
                    <div>
                      <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
                        Estimate
                      </p>
                      <p className="font-maison-neue text-sm text-Charcoal">
                        {money(
                          detail.finalization.estimated_order_total,
                          currencyCode
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
                        Final
                      </p>
                      <p className="font-maison-neue text-sm text-Charcoal">
                        {money(totals.final_order_total, currencyCode)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
                        Delta
                      </p>
                      <p className="font-maison-neue text-sm text-Charcoal">
                        {money(totals.delta_total, currencyCode)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="min-h-[40px] rounded-md border border-Charcoal bg-white px-4 text-xs font-rexton font-bold uppercase text-Charcoal"
                    isLoading={isPending}
                    onClick={() =>
                      runAction("Packing started.", startCatchWeightFinalization)
                    }
                    type="button"
                  >
                    Start Pack
                  </Button>
                  <Button
                    className="min-h-[40px] rounded-md border border-Charcoal bg-white px-4 text-xs font-rexton font-bold uppercase text-Charcoal"
                    isLoading={isPending}
                    onClick={() =>
                      runAction("Preview refreshed.", previewCatchWeightFinalization)
                    }
                    type="button"
                  >
                    Preview
                  </Button>
                  <Button
                    className="min-h-[40px] rounded-md bg-Charcoal px-4 text-xs font-rexton font-bold uppercase text-white"
                    isLoading={isPending}
                    onClick={() =>
                      runAction("Finalization approved.", approveCatchWeightFinalization)
                    }
                    type="button"
                  >
                    Approve
                  </Button>
                  <Button
                    className="min-h-[40px] rounded-md bg-Gold px-4 text-xs font-rexton font-bold uppercase text-Charcoal"
                    isLoading={isPending}
                    onClick={() =>
                      runAction(
                        "Card charged and order released.",
                        chargeAndReleaseCatchWeightOrder
                      )
                    }
                    type="button"
                  >
                    Charge & Release
                  </Button>
                </div>
              </div>

              <div>
                {detail.lines.map((line) => (
                  <LineEditor
                    key={line.id}
                    orderId={detail.order.id}
                    line={line}
                    currencyCode={currencyCode}
                    onSaved={() => loadDetail(detail.order.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-sm font-maison-neue text-Charcoal/55">
              {isPending ? "Loading..." : "Select an order."}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
