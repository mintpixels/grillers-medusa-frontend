"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Button from "@modules/common/components/button"
import {
  approveCatchWeightFinalization,
  chargeAndReleaseCatchWeightOrder,
  fulfillReleasedCatchWeightOrder,
  getCatchWeightFinalizationDetail,
  listCatchWeightFinalizationQueue,
  previewCatchWeightFinalization,
  startCatchWeightFinalization,
  updateCatchWeightFinalizationLine,
  type StaffCatchWeightFinalizationDetail,
  type StaffCatchWeightFinalizationSummary,
  type StaffCatchWeightLine,
} from "@lib/data/staff/catch-weight-finalization"
import {
  catchWeightReadyForFulfillment,
  hasActiveFulfillment,
} from "@lib/util/catch-weight-fulfillment"
import {
  searchStaffProducts,
  type StaffProductSearchResult,
} from "@lib/data/staff/order-entry"

const statusLabels: Record<string, string> = {
  pending_pack: "Needs pack",
  packing: "Packing",
  packed_pending_review: "Review",
  packed_pending_charge: "Ready charge",
  charge_attempting: "Charging",
  charge_failed_hold: "Charge hold",
  charged_ready_to_ship: "Ready ship",
  released_to_fulfillment: "Released",
  ready: "Ready",
  needs_weight: "Needs weight",
  removed: "Removed",
  substituted: "Substituted",
}

const statusClass: Record<string, string> = {
  charge_failed_hold: "border-red-200 bg-red-50 text-red-800",
  packed_pending_charge: "border-emerald-200 bg-emerald-50 text-emerald-800",
  charged_ready_to_ship: "border-blue-200 bg-blue-50 text-blue-800",
  released_to_fulfillment: "border-blue-200 bg-blue-50 text-blue-800",
  packing: "border-amber-200 bg-amber-50 text-amber-800",
  packed_pending_review: "border-amber-200 bg-amber-50 text-amber-800",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_weight: "border-amber-200 bg-amber-50 text-amber-800",
  removed: "border-red-200 bg-red-50 text-red-800",
  substituted: "border-blue-200 bg-blue-50 text-blue-800",
}

const fieldClass =
  "min-h-[42px] w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-Charcoal outline-none transition focus:border-Gold focus:ring-2 focus:ring-Gold/20 disabled:bg-gray-50 disabled:text-Charcoal/40"

const labelClass =
  "text-[11px] font-maison-neue-mono uppercase tracking-[0.08em] text-Charcoal/55"

const secondaryButtonClass =
  "min-h-[42px] rounded-md border border-Charcoal bg-white px-4 text-xs font-rexton font-bold uppercase text-Charcoal"

const primaryButtonClass =
  "min-h-[42px] rounded-md bg-Charcoal px-4 text-xs font-rexton font-bold uppercase text-white"

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

function lineRequiresActualWeight(line: StaffCatchWeightLine, title: string) {
  const estimatedWeight = Number(line.estimated_weight_total)
  return (
    line.pricing_mode === "per_lb" ||
    (Number.isFinite(estimatedWeight) && estimatedWeight > 0) ||
    /\b\d+(?:\.\d+)?\s*(lb|lbs|pound|pounds)\b/i.test(title)
  )
}

function draftFromLine(line: StaffCatchWeightLine) {
  return {
    actual_weight_total: numberText(line.actual_weight_total),
    actual_piece_count: numberText(line.actual_piece_count),
    actual_quantity: numberText(line.actual_quantity ?? line.ordered_quantity),
    actual_unit_price: numberText(line.actual_unit_price),
    status: line.status || "ready",
    replacement_variant_id: line.replacement_variant_id || "",
    replacement_qbd_list_id: line.replacement_qbd_list_id || "",
    replacement_reason: line.replacement_reason || "",
    short_reason: line.short_reason || "",
    note: line.note || "",
  }
}

function draftSignature(draft: ReturnType<typeof draftFromLine>) {
  return JSON.stringify(draft)
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
  const [draft, setDraft] = useState(() => draftFromLine(line))
  const [replacementQuery, setReplacementQuery] = useState("")
  const [replacementResults, setReplacementResults] = useState<
    StaffProductSearchResult[]
  >([])
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [isPending, startTransition] = useTransition()
  const [isSearchPending, startSearchTransition] = useTransition()
  const lastSavedSignature = useRef(draftSignature(draft))
  const latestDraftSignature = useRef(draftSignature(draft))
  const isRemoved = draft.status === "removed"
  const isSubstituted = draft.status === "substituted"
  const title = line.customer_title || line.title_snapshot || "Order line"
  const requiresActualWeight = lineRequiresActualWeight(line, title)
  const skuSummary = [
    line.sku,
    line.qbd_list_id ? `QBD ${line.qbd_list_id}` : "Missing QBD",
  ]
    .filter(Boolean)
    .join(" | ")
  const replacementSummary = [
    line.replacement_variant_id ? `Variant ${line.replacement_variant_id}` : "",
    line.replacement_qbd_list_id ? `QBD ${line.replacement_qbd_list_id}` : "",
  ]
    .filter(Boolean)
    .join(" | ")

  useEffect(() => {
    const nextDraft = draftFromLine(line)
    const nextSignature = draftSignature(nextDraft)
    setDraft(nextDraft)
    lastSavedSignature.current = nextSignature
    latestDraftSignature.current = nextSignature
    setSaveState("idle")
    setReplacementQuery("")
    setReplacementResults([])
  }, [line])

  function update(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function runReplacementSearch() {
    const query = replacementQuery.trim()
    setError(null)
    if (query.length < 2) {
      setError("Search by product name or SKU.")
      return
    }

    startSearchTransition(async () => {
      try {
        const results = await searchStaffProducts(query, "us")
        setReplacementResults(results)
        if (!results.length) setError("No replacement products found.")
      } catch (err: any) {
        setError(err.message || "Could not search replacement products.")
      }
    })
  }

  function selectReplacement(product: StaffProductSearchResult) {
    const replacementTitle =
      product.variantTitle && product.variantTitle !== "Default"
        ? `${product.title} - ${product.variantTitle}`
        : product.title

    setDraft((current) => ({
      ...current,
      status: "substituted",
      replacement_variant_id: product.variantId,
      replacement_qbd_list_id:
        product.qbdListId || current.replacement_qbd_list_id,
      replacement_reason:
        current.replacement_reason || `Substituted with ${replacementTitle}`,
    }))
    setReplacementQuery(
      [replacementTitle, product.sku ? `SKU ${product.sku}` : ""]
        .filter(Boolean)
        .join(" | ")
    )
    setReplacementResults([])
  }

  async function persistDraft(
    draftToSave: ReturnType<typeof draftFromLine>,
    options: { validate: boolean; refresh: boolean }
  ) {
    const signature = draftSignature(draftToSave)
    const actualWeight = Number(draftToSave.actual_weight_total)

    if (
      options.validate &&
      draftToSave.status === "ready" &&
      requiresActualWeight &&
      (!Number.isFinite(actualWeight) || actualWeight <= 0)
    ) {
      setError("Enter the actual weight before marking this line ready.")
      return
    }

    if (
      options.validate &&
      draftToSave.status === "removed" &&
      !draftToSave.short_reason.trim()
    ) {
      setError("Add a removal reason before saving this line.")
      return
    }

    if (
      options.validate &&
      draftToSave.status === "substituted" &&
      (!draftToSave.replacement_variant_id.trim() ||
        !draftToSave.replacement_qbd_list_id.trim() ||
        !draftToSave.replacement_reason.trim())
    ) {
      setError("Choose a replacement and add the substitution reason.")
      return
    }

    setSaveState("saving")
    try {
      await updateCatchWeightFinalizationLine({
        orderId,
        lineItemId: line.line_item_id,
        ...draftToSave,
      })
      lastSavedSignature.current = signature
      if (latestDraftSignature.current === signature) {
        setSaveState("saved")
      }
      if (options.refresh) onSaved()
    } catch (err: any) {
      setSaveState("error")
      setError(err.message || "Could not save line.")
    }
  }

  function save() {
    setError(null)
    startTransition(async () => {
      await persistDraft(draft, { validate: true, refresh: true })
    })
  }

  useEffect(() => {
    const signature = draftSignature(draft)
    latestDraftSignature.current = signature
    if (signature === lastSavedSignature.current) return

    setSaveState("idle")
    const timer = window.setTimeout(() => {
      persistDraft(draft, { validate: false, refresh: false })
    }, 900)

    return () => window.clearTimeout(timer)
    // Save state is intentionally debounced from the current draft only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, orderId, line.line_item_id])

  return (
    <div className="border-b border-gray-200 px-4 py-4 last:border-b-0">
      <div className="rounded-md border border-gray-100 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="min-w-0 text-base font-maison-neue font-semibold leading-snug text-Charcoal">
                {title}
              </h4>
              {statusBadge(draft.status)}
            </div>
            <p className="mt-1 truncate text-[11px] font-maison-neue-mono uppercase text-Charcoal/45">
              {skuSummary}
            </p>
            <p className="mt-2 text-sm font-maison-neue text-Charcoal/60">
              Ordered {numberText(line.ordered_quantity) || "0"}
              {line.estimated_weight_total !== null &&
              line.estimated_weight_total !== undefined
                ? ` | est. ${numberText(line.estimated_weight_total)} lb`
                : ""}
              {line.final_line_total !== null &&
              line.final_line_total !== undefined
                ? ` | final ${money(line.final_line_total, currencyCode)}`
                : ""}
            </p>
            {replacementSummary && (
              <p className="mt-1 truncate text-xs font-maison-neue text-blue-700">
                Replacement: {replacementSummary}
              </p>
            )}
          </div>
          <Button
            className={`${primaryButtonClass} w-full sm:w-auto`}
            isLoading={isPending || saveState === "saving"}
            onClick={save}
            type="button"
          >
            Save Line
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1">
            <span className={labelClass}>Weight lb</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={draft.actual_weight_total}
              disabled={isRemoved}
              onChange={(event) =>
                update("actual_weight_total", event.target.value)
              }
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className={labelClass}>Pieces</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={draft.actual_piece_count}
              disabled={isRemoved}
              onChange={(event) =>
                update("actual_piece_count", event.target.value)
              }
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className={labelClass}>Quantity</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={draft.actual_quantity}
              disabled={isRemoved}
              onChange={(event) =>
                update("actual_quantity", event.target.value)
              }
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className={labelClass}>Pick result</span>
            <select
              className={fieldClass}
              value={draft.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="ready">Ready</option>
              <option value="needs_weight">Needs weight</option>
              <option value="removed">Removed</option>
              <option value="substituted">Substituted</option>
            </select>
          </label>
        </div>

        {isRemoved && (
          <label className="mt-4 flex flex-col gap-1">
            <span className={labelClass}>Removal reason</span>
            <input
              className={fieldClass}
              value={draft.short_reason}
              onChange={(event) => update("short_reason", event.target.value)}
            />
          </label>
        )}

        {isSubstituted && (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50/40 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Find replacement</span>
                <input
                  className={fieldClass}
                  type="search"
                  value={replacementQuery}
                  onChange={(event) => setReplacementQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runReplacementSearch()
                  }}
                />
              </label>
              <Button
                className={`${secondaryButtonClass} w-full lg:w-auto`}
                isLoading={isSearchPending}
                onClick={runReplacementSearch}
                type="button"
              >
                Search
              </Button>
            </div>

            {replacementResults.length > 0 && (
              <div className="mt-3 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white">
                {replacementResults.map((product) => (
                  <button
                    className="flex w-full flex-col gap-1 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-SilverPlate/40"
                    key={product.variantId}
                    onClick={() => selectReplacement(product)}
                    type="button"
                  >
                    <span className="text-sm font-maison-neue font-semibold text-Charcoal">
                      {product.title}
                    </span>
                    <span className="text-xs font-maison-neue text-Charcoal/55">
                      {[
                        product.variantTitle,
                        product.sku,
                        product.qbdListId ? "QBD saved" : "Missing QBD",
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Replacement variant ID</span>
                <input
                  className={fieldClass}
                  value={draft.replacement_variant_id}
                  onChange={(event) =>
                    update("replacement_variant_id", event.target.value)
                  }
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Replacement QBD ListID</span>
                <input
                  className={fieldClass}
                  value={draft.replacement_qbd_list_id}
                  onChange={(event) =>
                    update("replacement_qbd_list_id", event.target.value)
                  }
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 md:col-span-2">
                <span className={labelClass}>Substitution reason</span>
                <input
                  className={fieldClass}
                  value={draft.replacement_reason}
                  onChange={(event) =>
                    update("replacement_reason", event.target.value)
                  }
                />
              </label>
            </div>
          </div>
        )}

        <label className="mt-4 flex flex-col gap-1">
          <span className={labelClass}>Note</span>
          <input
            className={fieldClass}
            value={draft.note}
            onChange={(event) => update("note", event.target.value)}
          />
        </label>

        {(lineMessage(line.errors) || lineMessage(line.warnings) || error) && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error || lineMessage(line.errors) || lineMessage(line.warnings)}
          </p>
        )}
        <p className="mt-3 text-xs font-maison-neue text-Charcoal/45">
          {saveState === "saving"
            ? "Autosaving..."
            : saveState === "saved"
            ? "Saved"
            : saveState === "error"
            ? "Autosave failed"
            : "Changes save automatically"}
        </p>
      </div>
    </div>
  )
}

export default function StaffCatchWeightFinalizationConsole() {
  const [queue, setQueue] = useState<StaffCatchWeightFinalizationSummary[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detail, setDetail] =
    useState<StaffCatchWeightFinalizationDetail | null>(null)
  const [filter, setFilter] = useState(
    "pending_pack,packing,packed_pending_review,packed_pending_charge,charge_failed_hold"
  )
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

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
          nextSelectedOrderId || selectedOrderId || rows[0]?.order_id || null
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
    actionKey: string,
    label: string,
    action: (orderId: string) => Promise<StaffCatchWeightFinalizationDetail>
  ) {
    if (!selectedOrderId || pendingAction) return
    setPendingAction(actionKey)
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
      } finally {
        setPendingAction(null)
      }
    })
  }

  useEffect(() => {
    loadQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const totals = detail?.totals || detail?.finalization || {}
  const readyForFulfillment = catchWeightReadyForFulfillment(detail)
  const fulfilled = hasActiveFulfillment(detail?.order)

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Pack and finalize
            </p>
            <h2 className="mt-1 text-xl font-maison-neue font-semibold text-Charcoal">
              Pack & finalize queue
            </h2>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {[
              [
                "Needs packing",
                "pending_pack,packing,packed_pending_review,packed_pending_charge,charge_failed_hold",
              ],
              ["Ready charge", "packed_pending_charge"],
              ["Charge holds", "charge_failed_hold"],
              ["Ready ship", "charged_ready_to_ship,released_to_fulfillment"],
            ].map(([label, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`min-h-[36px] shrink-0 rounded-md border px-3 text-xs font-maison-neue-mono uppercase ${
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
          className={`mx-4 mt-4 rounded-md border px-4 py-3 text-sm sm:mx-5 sm:mt-5 ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || status}
        </div>
      )}

      <div className="grid min-h-[620px] lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-[72px_minmax(0,1fr)_84px] border-b border-gray-200 px-4 py-3 text-[11px] font-maison-neue-mono uppercase text-Charcoal/45 sm:grid-cols-[84px_minmax(0,1fr)_96px]">
            <span>Order</span>
            <span>Customer</span>
            <span className="text-right">Total</span>
          </div>
          <div className="max-h-[360px] overflow-auto lg:max-h-[620px]">
            {queue.map((item) => {
              const selected = item.order_id === selectedOrderId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadDetail(item.order_id)}
                  className={`grid w-full grid-cols-[72px_minmax(0,1fr)_84px] gap-2 border-b border-gray-100 px-4 py-3 text-left transition sm:grid-cols-[84px_minmax(0,1fr)_96px] ${
                    selected ? "bg-Gold/10" : "hover:bg-SilverPlate/30"
                  }`}
                >
                  <span>
                    <span className="block font-maison-neue-mono text-sm text-Charcoal">
                      {item.display_id
                        ? `#${item.display_id}`
                        : item.order_id.slice(-6)}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-maison-neue text-Charcoal">
                      {item.customer_email || "Customer"}
                    </span>
                    <span className="mt-1 block">
                      {statusBadge(item.status)}
                    </span>
                    {item.blocked_reason && (
                      <span className="mt-1 block truncate text-xs text-red-700">
                        {item.blocked_reason.replace(/_/g, " ")}
                      </span>
                    )}
                  </span>
                  <span className="text-right text-sm font-maison-neue text-Charcoal">
                    {money(
                      item.final_order_total ?? item.estimated_order_total,
                      item.currency_code
                    )}
                    {item.delta_total !== null &&
                    item.delta_total !== undefined ? (
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
              <div className="border-b border-gray-200 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-all text-xl font-maison-neue font-semibold text-Charcoal">
                        {detail.order?.display_id
                          ? `#${detail.order.display_id}`
                          : detail.order?.id}
                      </h3>
                      {statusBadge(detail.finalization.status)}
                    </div>
                    <p className="mt-1 text-sm font-maison-neue text-Charcoal/60">
                      {detail.order?.email ||
                        detail.finalization.customer_email}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-2 rounded-md bg-SilverPlate/30 p-3 text-left sm:w-auto sm:min-w-[260px] sm:text-right">
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

                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button
                    className={`${secondaryButtonClass} w-full sm:w-auto`}
                    disabled={Boolean(pendingAction)}
                    isLoading={pendingAction === "start"}
                    onClick={() =>
                      runAction(
                        "start",
                        "Packing started.",
                        startCatchWeightFinalization
                      )
                    }
                    type="button"
                  >
                    Start Pack
                  </Button>
                  <Button
                    className={`${secondaryButtonClass} w-full sm:w-auto`}
                    disabled={Boolean(pendingAction)}
                    isLoading={pendingAction === "preview"}
                    onClick={() =>
                      runAction(
                        "preview",
                        "Preview refreshed.",
                        previewCatchWeightFinalization
                      )
                    }
                    type="button"
                  >
                    Preview
                  </Button>
                  <Button
                    className={`${primaryButtonClass} w-full sm:w-auto`}
                    disabled={Boolean(pendingAction)}
                    isLoading={pendingAction === "approve"}
                    onClick={() =>
                      runAction(
                        "approve",
                        "Finalization approved.",
                        approveCatchWeightFinalization
                      )
                    }
                    type="button"
                  >
                    Approve
                  </Button>
                  <Button
                    className="min-h-[42px] w-full rounded-md bg-Gold px-4 text-xs font-rexton font-bold uppercase text-Charcoal sm:w-auto"
                    disabled={Boolean(pendingAction)}
                    isLoading={pendingAction === "charge"}
                    onClick={() =>
                      runAction(
                        "charge",
                        "Card charged and order released.",
                        chargeAndReleaseCatchWeightOrder
                      )
                    }
                    type="button"
                  >
                    Charge & Release
                  </Button>
                  {readyForFulfillment && (
                    <Button
                      className={`min-h-[42px] w-full rounded-md px-4 text-xs font-rexton font-bold uppercase sm:w-auto ${
                        fulfilled
                          ? "border border-gray-200 bg-gray-50 text-Charcoal/50"
                          : "bg-Charcoal px-4 text-white"
                      }`}
                      disabled={fulfilled || Boolean(pendingAction)}
                      isLoading={pendingAction === "fulfill"}
                      onClick={() =>
                        runAction(
                          "fulfill",
                          "Fulfillment created.",
                          fulfillReleasedCatchWeightOrder
                        )
                      }
                      type="button"
                    >
                      {fulfilled ? "Fulfilled" : "Mark Fulfilled"}
                    </Button>
                  )}
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
