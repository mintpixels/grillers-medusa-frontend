"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { ChevronDown } from "lucide-react"
import Button from "@modules/common/components/button"
import {
  addCatchWeightFinalizationLine,
  approveCatchWeightFinalization,
  chargeAndReleaseCatchWeightOrder,
  fulfillReleasedCatchWeightOrder,
  getCatchWeightFinalizationDetail,
  listCatchWeightFinalizationQueue,
  markCatchWeightReadyForPacking,
  returnCatchWeightOrderToPicking,
  startCatchWeightFinalization,
  unclaimCatchWeightPick,
  updateCatchWeightFinalizationLine,
  updateCatchWeightFinalizationPackages,
  type StaffCatchWeightFinalizationDetail,
  type StaffCatchWeightFinalizationSummary,
  type StaffFinalizationPackage,
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
import {
  parseStaffAuditLog,
  type StaffAuditEntry,
} from "@lib/data/staff/exception-types"
import {
  replacementPriceLabel,
  replacementUnitPrice,
} from "./replacement-pricing"

const statusLabels: Record<string, string> = {
  pending_pick: "Needs picking",
  picking: "Picking",
  ready_for_packing: "Ready for packing",
  pending_pack: "Needs picking",
  packing: "Packing",
  packed_pending_review: "Packing review",
  packed_pending_charge: "Ready to charge",
  charge_attempting: "Charging",
  charge_failed_hold: "Charge hold",
  charged_ready_to_ship: "Ready to ship",
  released_to_fulfillment: "Released",
  ready: "Ready",
  needs_pick: "Needs pick",
  needs_weight: "Needs weight",
  removed: "Removed",
  substituted: "Substituted",
}

const statusClass: Record<string, string> = {
  charge_failed_hold: "border-red-200 bg-red-50 text-red-800",
  packed_pending_charge: "border-emerald-200 bg-emerald-50 text-emerald-800",
  charged_ready_to_ship: "border-blue-200 bg-blue-50 text-blue-800",
  released_to_fulfillment: "border-blue-200 bg-blue-50 text-blue-800",
  ready_for_packing: "border-blue-200 bg-blue-50 text-blue-800",
  pending_pick: "border-amber-200 bg-amber-50 text-amber-800",
  pending_pack: "border-amber-200 bg-amber-50 text-amber-800",
  picking: "border-amber-200 bg-amber-50 text-amber-800",
  packing: "border-amber-200 bg-amber-50 text-amber-800",
  packed_pending_review: "border-amber-200 bg-amber-50 text-amber-800",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_pick: "border-amber-200 bg-amber-50 text-amber-800",
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

const disabledButtonClass =
  "min-h-[42px] cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-4 text-xs font-rexton font-bold uppercase text-Charcoal/35 shadow-none"

const OUT_OF_STOCK_REASON = "out_of_stock"
const OUT_OF_STOCK_LABEL = "Out of stock"

const shipperOptions = [
  {
    value: "Shipper-Micro",
    label: "Micro",
    detail: "16x14x13 OD",
    qbdListId: "8000085A-1415899147",
  },
  {
    value: "Shipper-330-Medium",
    label: "330 Medium",
    detail: "18x15x13 OD",
    qbdListId: "8000085B-1415899316",
  },
  {
    value: "Shipper-345-Large",
    label: "345 Large",
    detail: "24x17x13 OD",
    qbdListId: "8000085C-1415899425",
  },
  {
    value: "Shipper-360-ExtraLarge",
    label: "360 Extra large",
    detail: "24x21x17 OD",
    qbdListId: "8000085D-1415899521",
  },
  {
    value: "Cooler-Igloo",
    label: "Cooler / igloo",
    detail: "Pickup or delivery cooler",
    qbdListId: "",
  },
  {
    value: "Other",
    label: "Other",
    detail: "Describe packaging",
    qbdListId: "",
  },
]

type FinalizationPhase = "picking" | "packing"

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

const fulfillmentTypeLabels: Record<string, string> = {
  plant_pickup: "Plant pickup",
  atlanta_delivery: "Atlanta delivery",
  ups_shipping: "UPS shipping",
  southeast_pickup: "Southeast pickup",
}

function fulfillmentTypeLabel(value?: string | null) {
  if (!value) return ""
  return fulfillmentTypeLabels[value] || value.replace(/_/g, " ")
}

function shortDateLabel(value?: string | null) {
  if (!value) return ""
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const date = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    : us
    ? new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
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

function messagesFromLineValue(value: StaffCatchWeightLine["errors"]) {
  if (!Array.isArray(value) || !value.length) return null
  const messages = value
    .map((item) => (typeof item === "string" ? item : item.message))
    .filter((message): message is string => Boolean(message))
  return messages.length ? messages : null
}

function lineMessage(value: StaffCatchWeightLine["errors"]) {
  return messagesFromLineValue(value)?.join(" ") || null
}

function finalizationBlockingIssues(
  detail: StaffCatchWeightFinalizationDetail | null
) {
  if (!detail) return []

  const linesByItemId = new Map(
    (detail.lines || []).map((line) => [line.line_item_id, line])
  )
  const issues: string[] = []
  const seen = new Set<string>()
  const pushIssue = (message?: string | null, lineItemId?: string | null) => {
    if (!message) return
    const line = lineItemId ? linesByItemId.get(lineItemId) : null
    const title = line?.customer_title || line?.title_snapshot
    const text = title ? `${title}: ${message}` : message
    const key = `${lineItemId || "order"}:${message}`
    if (seen.has(key)) return
    seen.add(key)
    issues.push(text)
  }

  for (const error of detail.errors || []) {
    if (typeof error === "string") {
      pushIssue(error)
    } else {
      pushIssue(error.message, error.line_item_id)
    }
  }

  for (const line of detail.lines || []) {
    for (const message of messagesFromLineValue(line.errors) || []) {
      pushIssue(message, line.line_item_id)
    }
  }

  return issues
}

function lineDisplayTitle(line: StaffCatchWeightLine) {
  return line.customer_title || line.title_snapshot || "Order line"
}

function lineActualQuantity(line: StaffCatchWeightLine) {
  const amount = Number(line.actual_quantity)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

function finalizationPickerReadiness(
  detail: StaffCatchWeightFinalizationDetail | null
) {
  if (!detail) return { blockers: [], warnings: [] }

  const blockers: string[] = []
  const warnings: string[] = []

  for (const line of detail.lines || []) {
    const title = lineDisplayTitle(line)
    const ordered = orderedQuantity(line)
    const picked = lineActualQuantity(line)
    const status = line.status || "needs_pick"

    if (status === "removed") {
      if (!line.short_reason && !line.note) {
        blockers.push(`${title}: removed lines need an out-of-stock reason.`)
      } else {
        warnings.push(`${title}: removed as out of stock.`)
      }
      continue
    }

    if (status === "substituted") {
      if (
        !line.replacement_variant_id ||
        !line.replacement_qbd_list_id ||
        !line.replacement_reason
      ) {
        blockers.push(`${title}: finish the substitution before handoff.`)
      } else {
        warnings.push(`${title}: substitution selected.`)
      }
      continue
    }

    if (picked <= 0) {
      blockers.push(
        `${title}: picked is 0 of ${
          ordered || 0
        }. Enter a picked count, or use Out of Stock/Substitute if it is out of stock.`
      )
      continue
    }

    if (status !== "ready") {
      blockers.push(
        `${title}: save the picked count so the line is marked ready.`
      )
      continue
    }

    if (ordered > 0 && picked < ordered && !line.short_reason) {
      blockers.push(
        `${title}: picked ${picked} of ${ordered}; save the line so the out-of-stock shortage is recorded.`
      )
      continue
    }

    if (ordered > 0 && picked < ordered) {
      warnings.push(
        `${title}: picked ${picked} of ${ordered}; shortage will be recorded as out of stock.`
      )
    }
  }

  return { blockers, warnings }
}

function lineRequiresActualWeight(line: StaffCatchWeightLine, title: string) {
  const estimatedWeight = Number(line.estimated_weight_total)
  return (
    line.pricing_mode === "per_lb" ||
    (Number.isFinite(estimatedWeight) && estimatedWeight > 0) ||
    /\b\d+(?:\.\d+)?\s*(lb|lbs|pound|pounds)\b/i.test(title)
  )
}

function lineIsFixedPrice(line: StaffCatchWeightLine, title: string) {
  return !lineRequiresActualWeight(line, title)
}

function draftFromLine(line: StaffCatchWeightLine) {
  const title = line.customer_title || line.title_snapshot || "Order line"
  const unitWeights = Array.isArray(line.metadata?.actual_unit_weights_lb)
    ? line.metadata?.actual_unit_weights_lb
        .map((value: unknown) => numberText(value as number | string))
        .filter(Boolean)
    : []

  return {
    actual_weight_total: numberText(line.actual_weight_total),
    actual_unit_weights: unitWeights,
    actual_piece_count: numberText(line.actual_piece_count ?? 0),
    actual_quantity: numberText(line.actual_quantity ?? 0),
    actual_unit_price: numberText(line.actual_unit_price),
    status: line.status || "needs_pick",
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

function weightTotal(weights: string[]) {
  const total = weights.reduce((sum, value) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum
  }, 0)
  return total > 0 ? Math.round(total * 1000) / 1000 : 0
}

function positiveWeightCount(weights: string[]) {
  return weights.filter((value) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0
  }).length
}

function positiveDraftQuantity(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

function orderedQuantity(line: StaffCatchWeightLine) {
  const amount = Number(line.ordered_quantity)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

function pickedQuantity(line: StaffCatchWeightLine) {
  const amount = Number(line.metadata?.picked_quantity ?? line.actual_quantity)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

function actualQuantityValue(draft: ReturnType<typeof draftFromLine>) {
  const amount = Number(draft.actual_quantity)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function lineHasShortage(
  line: StaffCatchWeightLine,
  draft: ReturnType<typeof draftFromLine>
) {
  const ordered = orderedQuantity(line)
  const actual = actualQuantityValue(draft)
  return ordered > 0 && actual >= 0 && actual < ordered
}

function positiveWholeQuantity(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? Math.ceil(amount) : 0
}

function expectedUnitWeightCount(
  line: StaffCatchWeightLine,
  draft: ReturnType<typeof draftFromLine>
) {
  return (
    Math.max(
      positiveWholeQuantity(draft.actual_quantity),
      positiveWholeQuantity(line.metadata?.picked_quantity)
    ) ||
    positiveWholeQuantity(line.actual_quantity) ||
    positiveWholeQuantity(line.actual_piece_count)
  )
}

function unitWeightRows(
  line: StaffCatchWeightLine,
  draft: ReturnType<typeof draftFromLine>
) {
  const rowCount = Math.max(
    draft.actual_unit_weights.length,
    expectedUnitWeightCount(line, draft),
    1
  )
  return Array.from(
    { length: rowCount },
    (_, index) => draft.actual_unit_weights[index] || ""
  )
}

function deriveLineStatus(
  draft: ReturnType<typeof draftFromLine>,
  requiresActualWeight: boolean,
  packingPhase: boolean,
  expectedWeightCount = 0
) {
  if (draft.status === "removed" || draft.status === "substituted") {
    return draft.status
  }
  if (requiresActualWeight && packingPhase) {
    const neededWeights = Math.max(1, expectedWeightCount)
    return positiveWeightCount(draft.actual_unit_weights) >= neededWeights
      ? "ready"
      : "needs_weight"
  }
  return positiveDraftQuantity(draft.actual_quantity) > 0
    ? "ready"
    : "needs_pick"
}

function withDerivedLineStatus(
  draft: ReturnType<typeof draftFromLine>,
  requiresActualWeight: boolean,
  packingPhase: boolean,
  expectedWeightCount = 0,
  line?: StaffCatchWeightLine
) {
  if (draft.status === "substituted") return draft

  if (draft.status === "removed") {
    return {
      ...draft,
      short_reason: draft.short_reason || OUT_OF_STOCK_REASON,
    }
  }

  const derivedStatus = deriveLineStatus(
    draft,
    requiresActualWeight,
    packingPhase,
    expectedWeightCount
  )

  if (line && lineHasShortage(line, draft)) {
    const actual = actualQuantityValue(draft)
    const picked = pickedQuantity(line)
    if (packingPhase && picked > 0 && actual < picked) {
      return {
        ...draft,
        status: requiresActualWeight ? "needs_weight" : "needs_pick",
      }
    }
    return {
      ...draft,
      short_reason: draft.short_reason || OUT_OF_STOCK_REASON,
      status:
        actual > 0
          ? derivedStatus === "needs_weight"
            ? "needs_weight"
            : "ready"
          : packingPhase
          ? derivedStatus
          : "removed",
    }
  }

  const nextDraft =
    draft.short_reason === OUT_OF_STOCK_REASON
      ? { ...draft, short_reason: "" }
      : draft

  return {
    ...nextDraft,
    status: derivedStatus,
  }
}

function pricingBasisBadge(requiresActualWeight: boolean) {
  return (
    <span
      className={`inline-flex min-h-[26px] items-center rounded-full border px-2.5 text-[11px] font-maison-neue-mono uppercase ${
        requiresActualWeight
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : "border-gray-200 bg-gray-50 text-Charcoal/65"
      }`}
    >
      {requiresActualWeight ? "By weight" : "Per pack"}
    </span>
  )
}

function auditActionLabel(entry: StaffAuditEntry) {
  return (entry.action || entry.staff_action || "staff action").replace(
    /_/g,
    " "
  )
}

function OrderAuditTrail({ order }: { order: Record<string, any> }) {
  const auditLog = parseStaffAuditLog(order?.metadata || {})
  const recent = auditLog.slice(-8).reverse()

  return (
    <details className="group border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
      <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-4 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold/30 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-xs font-maison-neue-mono uppercase text-Gold">
            Super admin
          </span>
          <span className="mt-0.5 block text-sm font-maison-neue font-semibold text-Charcoal">
            Audit trail
          </span>
        </span>
        <span className="flex items-center gap-3 text-xs font-maison-neue text-Charcoal/45">
          {auditLog.length
            ? `${auditLog.length} recorded actions`
            : "No actions yet"}
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 text-Charcoal/45 transition group-open:rotate-180"
          />
        </span>
      </summary>

      {recent.length ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {recent.map((entry, index) => (
            <div
              className="rounded-md border border-gray-100 bg-SilverPlate/20 px-3 py-2"
              key={`${entry.at || "audit"}-${index}`}
            >
              <p className="text-sm font-maison-neue font-semibold capitalize text-Charcoal">
                {auditActionLabel(entry)}
              </p>
              <p className="mt-1 text-xs font-maison-neue text-Charcoal/55">
                {[
                  entry.status,
                  entry.staff_actor_name ||
                    entry.staff_actor_email ||
                    entry.staff_actor_customer_id ||
                    entry.staff_actor_id,
                  entry.at,
                ]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
              {(entry.line_item_id ||
                entry.sku ||
                entry.finalization_id ||
                entry.charge_attempt_id) && (
                <p className="mt-1 truncate text-xs font-maison-neue text-Charcoal/45">
                  {[
                    entry.sku ? `SKU ${entry.sku}` : "",
                    entry.line_item_id ? `Line ${entry.line_item_id}` : "",
                    entry.charge_attempt_id
                      ? `Charge ${entry.charge_attempt_id}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-gray-100 bg-SilverPlate/20 px-3 py-2 text-sm font-maison-neue text-Charcoal/55">
          This order has no recorded staff actions yet.
        </p>
      )}
    </details>
  )
}

function LineEditor({
  orderId,
  line,
  currencyCode,
  phase,
  canEdit,
  onSaved,
}: {
  orderId: string
  line: StaffCatchWeightLine
  currencyCode: string
  phase: FinalizationPhase
  canEdit: boolean
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
  const fixedPriceLine = lineIsFixedPrice(line, title)
  const packingPhase = phase === "packing"
  const pickedCount = pickedQuantity(line)
  const orderedCount = orderedQuantity(line)
  const actualCount = actualQuantityValue(draft)
  const lineHasFullQuantity = orderedCount > 0 && actualCount >= orderedCount
  const lineHasPartialShortage =
    orderedCount > 0 && actualCount > 0 && actualCount < orderedCount
  const stockExceptionDisabled =
    !canEdit || (!packingPhase && (orderedCount <= 0 || lineHasFullQuantity))
  const removeActionLabel = packingPhase
    ? "Remove"
    : lineHasPartialShortage
    ? "Some Out Of Stock"
    : "Out Of Stock"
  const quantityInputLabel = packingPhase ? "Packed" : "Picked"
  const effectiveUnitWeightTotal = weightTotal(draft.actual_unit_weights)
  const expectedWeights = expectedUnitWeightCount(line, draft)
  const enteredWeightCount = positiveWeightCount(draft.actual_unit_weights)
  const effectiveActualQuantity = draft.actual_quantity
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
    setDraft((current) => {
      const nextDraft = {
        ...current,
        [key]: value,
        ...(key === "actual_quantity" ? { actual_piece_count: value } : {}),
      }
      return withDerivedLineStatus(
        nextDraft,
        requiresActualWeight,
        packingPhase,
        expectedUnitWeightCount(line, nextDraft),
        line
      )
    })
  }

  function updateUnitWeight(index: number, value: string) {
    setDraft((current) => {
      const rowCount = Math.max(
        current.actual_unit_weights.length,
        expectedUnitWeightCount(line, current),
        index + 1
      )
      const actualUnitWeights = Array.from(
        { length: rowCount },
        (_, rowIndex) => current.actual_unit_weights[rowIndex] || ""
      )
      actualUnitWeights[index] = value
      const nextDraft = {
        ...current,
        actual_unit_weights: actualUnitWeights,
        actual_quantity: numberText(positiveWeightCount(actualUnitWeights)),
        actual_piece_count: numberText(positiveWeightCount(actualUnitWeights)),
        actual_weight_total: numberText(weightTotal(actualUnitWeights)),
      }
      return {
        ...nextDraft,
        status: deriveLineStatus(
          nextDraft,
          requiresActualWeight,
          packingPhase,
          expectedUnitWeightCount(line, current)
        ),
      }
    })
  }

  function addUnitWeight() {
    setDraft((current) => {
      const rowCount = Math.max(
        current.actual_unit_weights.length,
        expectedUnitWeightCount(line, current)
      )
      return {
        ...current,
        actual_unit_weights: [
          ...Array.from(
            { length: rowCount },
            (_, index) => current.actual_unit_weights[index] || ""
          ),
          "",
        ],
      }
    })
  }

  function removeUnitWeight(index: number) {
    setDraft((current) => {
      const actualUnitWeights = current.actual_unit_weights.filter(
        (_, rowIndex) => rowIndex !== index
      )
      const nextDraft = {
        ...current,
        actual_unit_weights: actualUnitWeights,
        actual_quantity: numberText(positiveWeightCount(actualUnitWeights)),
        actual_piece_count: numberText(positiveWeightCount(actualUnitWeights)),
        actual_weight_total: numberText(weightTotal(actualUnitWeights)),
      }
      return {
        ...nextDraft,
        status: deriveLineStatus(
          nextDraft,
          requiresActualWeight,
          packingPhase,
          expectedUnitWeightCount(line, current)
        ),
      }
    })
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
      actual_unit_price:
        replacementUnitPrice(product) !== null
          ? String(replacementUnitPrice(product))
          : current.actual_unit_price,
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
    const normalizedDraft = withDerivedLineStatus(
      draftToSave,
      requiresActualWeight,
      packingPhase,
      expectedUnitWeightCount(line, draftToSave),
      line
    )
    const signature = draftSignature(normalizedDraft)
    const actualWeight = requiresActualWeight
      ? weightTotal(normalizedDraft.actual_unit_weights)
      : Number(normalizedDraft.actual_weight_total)
    const expectedWeightRows = expectedUnitWeightCount(line, normalizedDraft)
    const enteredWeights = positiveWeightCount(
      normalizedDraft.actual_unit_weights
    )

    if (
      options.validate &&
      normalizedDraft.status === "ready" &&
      requiresActualWeight &&
      packingPhase &&
      (!Number.isFinite(actualWeight) || actualWeight <= 0)
    ) {
      setError(
        "Enter each packed item's weight before marking this line ready."
      )
      return
    }
    if (
      options.validate &&
      requiresActualWeight &&
      packingPhase &&
      expectedWeightRows > 0 &&
      enteredWeights < expectedWeightRows
    ) {
      setError(
        `Enter ${expectedWeightRows} item weight${
          expectedWeightRows === 1 ? "" : "s"
        } before marking this line ready.`
      )
      return
    }

    const actualQuantity =
      Number(normalizedDraft.actual_quantity) ||
      (requiresActualWeight ? enteredWeights : 0)
    if (
      options.validate &&
      normalizedDraft.status === "ready" &&
      (!Number.isFinite(actualQuantity) || actualQuantity <= 0)
    ) {
      setError("Enter the fulfilled quantity before marking this line ready.")
      return
    }

    if (
      options.validate &&
      normalizedDraft.status === "removed" &&
      !normalizedDraft.short_reason.trim()
    ) {
      setError("Add a removal reason before saving this line.")
      return
    }

    if (
      options.validate &&
      normalizedDraft.status === "substituted" &&
      (!normalizedDraft.replacement_variant_id.trim() ||
        !normalizedDraft.replacement_qbd_list_id.trim() ||
        !normalizedDraft.replacement_reason.trim())
    ) {
      setError("Choose a replacement and add the substitution reason.")
      return
    }

    setSaveState("saving")
    try {
      await updateCatchWeightFinalizationLine({
        orderId,
        lineItemId: line.line_item_id,
        ...normalizedDraft,
        actual_weight_total: requiresActualWeight
          ? numberText(weightTotal(normalizedDraft.actual_unit_weights))
          : normalizedDraft.actual_weight_total,
        actual_unit_weights: requiresActualWeight
          ? normalizedDraft.actual_unit_weights
          : [],
        short_reason:
          normalizedDraft.short_reason ||
          (lineHasShortage(line, normalizedDraft) ? OUT_OF_STOCK_REASON : ""),
        metadata: packingPhase ? { packing_phase: true } : undefined,
      })
      lastSavedSignature.current = signature
      if (latestDraftSignature.current === signature) {
        setSaveState("saved")
      }
      if (options.refresh && latestDraftSignature.current === signature) {
        onSaved()
      }
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

  function markRemoved() {
    setDraft((current) => ({
      ...current,
      status: "removed",
      short_reason: current.short_reason || OUT_OF_STOCK_REASON,
    }))
  }

  function markPartialOutOfStock() {
    setDraft((current) =>
      withDerivedLineStatus(
        {
          ...current,
          status: "ready",
          short_reason: current.short_reason || OUT_OF_STOCK_REASON,
        },
        requiresActualWeight,
        packingPhase,
        expectedUnitWeightCount(line, current),
        line
      )
    )
  }

  function markSubstituted() {
    setDraft((current) => ({
      ...current,
      status: "substituted",
    }))
  }

  function clearException() {
    setDraft((current) =>
      withDerivedLineStatus(
        {
          ...current,
          replacement_variant_id: "",
          replacement_qbd_list_id: "",
          replacement_reason: "",
          short_reason: "",
          status: "needs_pick",
        },
        requiresActualWeight,
        packingPhase,
        expectedUnitWeightCount(line, current),
        line
      )
    )
  }

  useEffect(() => {
    const signature = draftSignature(draft)
    latestDraftSignature.current = signature
    if (signature === lastSavedSignature.current) return

    setSaveState("idle")
    const timer = window.setTimeout(() => {
      persistDraft(draft, { validate: false, refresh: true })
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
              {pricingBasisBadge(requiresActualWeight)}
              {statusBadge(draft.status)}
            </div>
            <p className="mt-1 truncate text-[11px] font-maison-neue-mono uppercase text-Charcoal/45">
              {skuSummary}
            </p>
            <p className="mt-2 text-sm font-maison-neue text-Charcoal/60">
              Ordered {numberText(line.ordered_quantity) || "0"} |{" "}
              {quantityInputLabel} {effectiveActualQuantity || "0"}
              {packingPhase && pickedCount > 0
                ? ` | picked ${numberText(pickedCount)}`
                : ""}
              {requiresActualWeight && packingPhase
                ? ` | weighed ${enteredWeightCount}/${expectedWeights || "?"}`
                : ""}
              {line.estimated_weight_total !== null &&
              line.estimated_weight_total !== undefined
                ? ` | est. ${numberText(line.estimated_weight_total)} lb`
                : ""}
              {requiresActualWeight && effectiveUnitWeightTotal > 0
                ? ` | actual ${numberText(effectiveUnitWeightTotal)} lb`
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
            disabled={!canEdit}
            isLoading={isPending || saveState === "saving"}
            onClick={save}
            type="button"
          >
            Save Line
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {requiresActualWeight && packingPhase ? (
            <div className="min-w-0 sm:col-span-2 xl:col-span-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className={labelClass}>Item weights</span>
                  <p className="mt-1 text-xs font-maison-neue text-Charcoal/45">
                    Enter one weight per packed item. Total and fulfilled count
                    calculate automatically.
                  </p>
                </div>
                <Button
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                  disabled={!canEdit || isRemoved}
                  onClick={addUnitWeight}
                  type="button"
                >
                  Add Item Weight
                </Button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {unitWeightRows(line, draft).map((weight, index) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_42px] gap-2"
                    key={`weight-${index}`}
                  >
                    <label className="flex min-w-0 flex-col gap-1">
                      <span className={labelClass}>Item {index + 1} lb</span>
                      <input
                        className={fieldClass}
                        inputMode="decimal"
                        value={weight}
                        disabled={!canEdit || isRemoved}
                        onChange={(event) =>
                          updateUnitWeight(index, event.target.value)
                        }
                      />
                    </label>
                    <button
                      className="mt-5 min-h-[42px] rounded-md border border-gray-200 px-2 text-xs font-maison-neue-mono uppercase text-Charcoal/55 disabled:opacity-40"
                      disabled={!canEdit || isRemoved}
                      onClick={() => removeUnitWeight(index)}
                      type="button"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-maison-neue text-Charcoal/70">
                  Total weight: {numberText(effectiveUnitWeightTotal) || "0"} lb
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-maison-neue text-Charcoal/70">
                  Weighed packs: {enteredWeightCount}/{expectedWeights || "?"}
                </div>
              </div>
            </div>
          ) : requiresActualWeight ? (
            <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
              <span className={labelClass}>Weight</span>
              <div className="rounded-md border border-blue-100 bg-blue-50/50 px-3 py-3 text-sm text-blue-900">
                <p className="font-maison-neue font-semibold">
                  Weight entry opens after Claim Pack.
                </p>
                <p className="mt-1 text-xs font-maison-neue text-blue-900/70">
                  Pickers enter the fulfilled count here. Packers will get one
                  weight box for each picked pack.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-1">
              <span className={labelClass}>Weight</span>
              <div className="flex min-h-[42px] items-center rounded-md border border-gray-100 bg-gray-50 px-3 text-sm text-Charcoal/55">
                No weight needed
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-1">
            <span className={labelClass}>Ordered</span>
            <div className="flex min-h-[42px] items-center rounded-md border border-gray-100 bg-gray-50 px-3 text-sm text-Charcoal/70">
              {numberText(line.ordered_quantity) || "0"}
            </div>
          </div>

          <label className="flex min-w-0 flex-col gap-1">
            <span className={labelClass}>{quantityInputLabel}</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={draft.actual_quantity}
              disabled={
                !canEdit || isRemoved || (requiresActualWeight && packingPhase)
              }
              onChange={(event) =>
                update("actual_quantity", event.target.value)
              }
            />
          </label>

          <div className="flex min-w-0 flex-col gap-1 sm:col-span-2 xl:col-span-2">
            <span className={labelClass}>Line action</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {isRemoved || isSubstituted ? (
                <button
                  className={`${secondaryButtonClass} w-full min-w-0 px-3 text-center`}
                  disabled={!canEdit}
                  onClick={clearException}
                  type="button"
                >
                  Clear
                </button>
              ) : (
                <>
                  <button
                    className={`w-full min-w-0 px-3 text-center ${
                      stockExceptionDisabled
                        ? disabledButtonClass
                        : secondaryButtonClass
                    }`}
                    disabled={stockExceptionDisabled}
                    onClick={
                      !packingPhase && lineHasPartialShortage
                        ? markPartialOutOfStock
                        : markRemoved
                    }
                    title={
                      !packingPhase && lineHasFullQuantity
                        ? "Picked already matches ordered quantity."
                        : undefined
                    }
                    type="button"
                  >
                    {removeActionLabel}
                  </button>
                  <button
                    className={`${secondaryButtonClass} w-full min-w-0 px-3 text-center`}
                    disabled={!canEdit}
                    onClick={markSubstituted}
                    type="button"
                  >
                    Substitute
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {fixedPriceLine && (
          <p className="mt-2 text-xs font-maison-neue text-Charcoal/45">
            Fixed-price line: final amount follows fulfilled quantity, not
            weight.
          </p>
        )}

        {isRemoved && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-maison-neue text-amber-900">
            Reason:{" "}
            {draft.short_reason === OUT_OF_STOCK_REASON
              ? OUT_OF_STOCK_LABEL
              : draft.short_reason || OUT_OF_STOCK_LABEL}
          </div>
        )}

        {!isRemoved &&
          !isSubstituted &&
          lineHasShortage(line, draft) &&
          (draft.short_reason === OUT_OF_STOCK_REASON ||
            actualQuantityValue(draft) > 0) && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-maison-neue text-amber-900">
              Shortage reason: {OUT_OF_STOCK_LABEL}
            </div>
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
                  disabled={!canEdit}
                  onChange={(event) => setReplacementQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runReplacementSearch()
                  }}
                />
              </label>
              <Button
                className={`${secondaryButtonClass} w-full lg:w-auto`}
                isLoading={isSearchPending}
                disabled={!canEdit}
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
                        replacementPriceLabel(product, currencyCode),
                        product.qbdListId ? "QBD saved" : "Missing QBD",
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Replacement variant ID</span>
                <input
                  className={fieldClass}
                  value={draft.replacement_variant_id}
                  disabled={!canEdit}
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
                  disabled={!canEdit}
                  onChange={(event) =>
                    update("replacement_qbd_list_id", event.target.value)
                  }
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Replacement unit price</span>
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={draft.actual_unit_price}
                  disabled={!canEdit}
                  onChange={(event) =>
                    update("actual_unit_price", event.target.value)
                  }
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 md:col-span-3">
                <span className={labelClass}>Substitution reason</span>
                <input
                  className={fieldClass}
                  value={draft.replacement_reason}
                  disabled={!canEdit}
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
            disabled={!canEdit}
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

function AddFinalizationItem({
  orderId,
  currencyCode,
  canEdit,
  onSaved,
}: {
  orderId: string
  currencyCode: string
  canEdit: boolean
  onSaved: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StaffProductSearchResult[]>([])
  const [quantity, setQuantity] = useState("1")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSearchPending, startSearchTransition] = useTransition()
  const [isAddPending, startAddTransition] = useTransition()

  function runSearch() {
    const q = query.trim()
    setError(null)
    if (q.length < 2) {
      setError("Search by product name or SKU.")
      return
    }
    startSearchTransition(async () => {
      try {
        const nextResults = await searchStaffProducts(q, "us")
        setResults(nextResults)
        if (!nextResults.length) setError("No products found.")
      } catch (err: any) {
        setError(err.message || "Could not search products.")
      }
    })
  }

  function addProduct(product: StaffProductSearchResult) {
    const amount = Number(quantity)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a fulfilled quantity greater than zero.")
      return
    }
    if (!product.qbdListId) {
      setError("This product is missing a QuickBooks item ID.")
      return
    }
    const title =
      product.variantTitle && product.variantTitle !== "Default"
        ? `${product.title} - ${product.variantTitle}`
        : product.title
    const unitPrice = replacementUnitPrice(product)

    startAddTransition(async () => {
      try {
        await addCatchWeightFinalizationLine({
          orderId,
          product_id: product.productId,
          variant_id: product.variantId,
          sku: product.sku,
          qbd_list_id: product.qbdListId,
          title,
          customer_title: title,
          pricing_mode: product.pricingMode,
          actual_unit_price:
            unitPrice !== null && unitPrice !== undefined
              ? String(unitPrice)
              : "",
          actual_quantity: quantity,
          actual_piece_count: quantity,
          note,
        })
        setQuery("")
        setResults([])
        setQuantity("1")
        setNote("")
        setError(null)
        onSaved()
      } catch (err: any) {
        setError(err.message || "Could not add item.")
      }
    })
  }

  if (!canEdit) return null

  return (
    <div className="border-b border-gray-200 bg-SilverPlate/20 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={labelClass}>Add item</span>
          <input
            className={fieldClass}
            type="search"
            placeholder="Search product or SKU"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch()
            }}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 lg:w-28">
          <span className={labelClass}>Fulfilled</span>
          <input
            className={fieldClass}
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={labelClass}>Note</span>
          <input
            className={fieldClass}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <Button
          className={`${secondaryButtonClass} w-full lg:w-auto`}
          isLoading={isSearchPending}
          onClick={runSearch}
          type="button"
        >
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-3 max-h-72 overflow-auto rounded-md border border-gray-200 bg-white">
          {results.map((product) => (
            <button
              className="grid w-full gap-2 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 hover:bg-SilverPlate/35 sm:grid-cols-[minmax(0,1fr)_auto]"
              disabled={isAddPending}
              key={product.variantId}
              onClick={() => addProduct(product)}
              type="button"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-maison-neue font-semibold text-Charcoal">
                  {product.variantTitle && product.variantTitle !== "Default"
                    ? `${product.title} - ${product.variantTitle}`
                    : product.title}
                </span>
                <span className="mt-1 block text-xs font-maison-neue text-Charcoal/55">
                  {[
                    product.sku,
                    replacementPriceLabel(product, currencyCode),
                    product.qbdListId ? "QBD saved" : "Missing QBD",
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </span>
              </span>
              <span className="flex items-center gap-2 sm:justify-end">
                {pricingBasisBadge(product.pricingMode === "per_lb")}
                <span className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Add
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}
    </div>
  )
}

function packageDrafts(packages: StaffFinalizationPackage[] | undefined) {
  const rows = packages?.length
    ? packages
    : [
        {
          package_type: "",
          shipper_qbd_list_id: "",
          count: "1",
          packed_weight_lb: "",
          dry_ice_lb: "",
          note: "",
        },
      ]

  return rows.map((pkg) => ({
    id: pkg.id || "",
    package_type: pkg.package_type || "",
    shipper_qbd_list_id: pkg.shipper_qbd_list_id || "",
    count: "1",
    packed_weight_lb: numberText(pkg.packed_weight_lb),
    dry_ice_lb: numberText(pkg.dry_ice_lb),
    note: pkg.note || "",
  }))
}

function cleanPackageDrafts(
  packages: ReturnType<typeof packageDrafts>
): StaffFinalizationPackage[] {
  return packages
    .map((pkg) => ({
      id: pkg.id || undefined,
      package_type: pkg.package_type.trim(),
      shipper_qbd_list_id: pkg.shipper_qbd_list_id.trim(),
      count: "1",
      packed_weight_lb: pkg.packed_weight_lb.trim(),
      dry_ice_lb: pkg.dry_ice_lb.trim(),
      note: pkg.note.trim(),
    }))
    .filter(
      (pkg) =>
        pkg.package_type ||
        pkg.shipper_qbd_list_id ||
        pkg.packed_weight_lb ||
        pkg.dry_ice_lb ||
        pkg.note
    )
}

function packageSignature(packages: ReturnType<typeof packageDrafts>) {
  return JSON.stringify(cleanPackageDrafts(packages))
}

function PackageCapture({
  orderId,
  detail,
  onSaved,
}: {
  orderId: string
  detail: StaffCatchWeightFinalizationDetail
  onSaved: () => void
}) {
  const [packages, setPackages] = useState(() => packageDrafts(detail.packages))
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [isPending, startTransition] = useTransition()
  const lastSavedSignature = useRef(packageSignature(packages))
  const latestPackageSignature = useRef(packageSignature(packages))

  useEffect(() => {
    const nextPackages = packageDrafts(detail.packages)
    const nextSignature = packageSignature(nextPackages)
    setPackages(nextPackages)
    lastSavedSignature.current = nextSignature
    latestPackageSignature.current = nextSignature
    setError(null)
    setSaveState("idle")
  }, [detail.packages])

  function update(
    index: number,
    key: keyof (typeof packages)[number],
    value: string
  ) {
    setPackages((current) =>
      current.map((pkg, rowIndex) =>
        rowIndex === index ? { ...pkg, [key]: value } : pkg
      )
    )
  }

  function selectShipper(index: number, value: string) {
    const option = shipperOptions.find((item) => item.value === value)
    setPackages((current) =>
      current.map((pkg, rowIndex) =>
        rowIndex === index
          ? {
              ...pkg,
              package_type: value,
              shipper_qbd_list_id: option?.qbdListId || "",
            }
          : pkg
      )
    )
  }

  function addRow() {
    setPackages((current) => [
      ...current,
      {
        id: "",
        package_type: "",
        shipper_qbd_list_id: "",
        count: "1",
        packed_weight_lb: "",
        dry_ice_lb: "",
        note: "",
      },
    ])
  }

  function removeRow(index: number) {
    setPackages((current) =>
      current.length === 1
        ? packageDrafts([])
        : current.filter((_, rowIndex) => rowIndex !== index)
    )
  }

  async function persistPackages(
    packagesToSave: ReturnType<typeof packageDrafts>,
    options: { refresh: boolean }
  ) {
    setError(null)
    const cleanPackages = cleanPackageDrafts(packagesToSave)
    const signature = JSON.stringify(cleanPackages)
    const overweightRow = cleanPackages.findIndex((pkg) => {
      const packedWeight = Number(pkg.packed_weight_lb)
      return Number.isFinite(packedWeight) && packedWeight > 50
    })
    if (overweightRow >= 0) {
      setError(
        `Package ${
          overweightRow + 1
        } is over 50 lb including dry ice and packaging.`
      )
      return
    }
    setSaveState("saving")
    try {
      await updateCatchWeightFinalizationPackages({
        orderId,
        packages: cleanPackages,
      })
      lastSavedSignature.current = signature
      if (latestPackageSignature.current === signature) {
        setSaveState("saved")
      }
      if (options.refresh && latestPackageSignature.current === signature) {
        onSaved()
      }
    } catch (err: any) {
      setSaveState("idle")
      setError(err.message || "Could not save package details.")
    }
  }

  useEffect(() => {
    const signature = packageSignature(packages)
    latestPackageSignature.current = signature
    if (signature === lastSavedSignature.current) return

    setSaveState("idle")
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        await persistPackages(packages, { refresh: true })
      })
    }, 900)

    return () => window.clearTimeout(timer)
    // Package save is intentionally debounced from the current draft only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages, orderId])

  return (
    <div className="border-b border-gray-200 bg-SilverPlate/20 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-maison-neue-mono uppercase text-Gold">
            Boxes and coolers
          </p>
          <h4 className="mt-1 text-base font-maison-neue font-semibold text-Charcoal">
            Packing complete details
          </h4>
          <p className="mt-1 max-w-2xl text-sm font-maison-neue text-Charcoal/60">
            {detail.package_capture_required
              ? "Add one row per physical container. Packed lb is the full scale weight, including the box or cooler and dry ice; record dry ice separately."
              : "Add one row per cooler, igloo, or other container used before marking the pack ready."}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <span className="text-xs font-maison-neue text-Charcoal/50">
            {isPending || saveState === "saving"
              ? "Saving package details..."
              : saveState === "saved"
              ? "Package details saved."
              : "Changes save automatically"}
          </span>
          <Button
            className={secondaryButtonClass}
            onClick={addRow}
            type="button"
          >
            Add Package
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {packages.map((pkg, index) => (
          <div
            className="grid gap-3 rounded-md border border-gray-200 bg-white p-3 md:grid-cols-[minmax(220px,1.2fr)_120px_120px_minmax(0,1fr)_auto]"
            key={`${pkg.id || "new"}-${index}`}
          >
            <label className="flex min-w-0 flex-col gap-1">
              <span className={labelClass}>Package</span>
              <select
                className={fieldClass}
                value={pkg.package_type}
                onChange={(event) => selectShipper(index, event.target.value)}
              >
                <option value="">Choose package</option>
                {shipperOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.detail}
                  </option>
                ))}
              </select>
              {pkg.shipper_qbd_list_id && (
                <span className="truncate text-[11px] font-maison-neue text-Charcoal/45">
                  QBD item saved
                </span>
              )}
              {pkg.package_type === "Other" && (
                <input
                  className={fieldClass}
                  placeholder="Describe package or cooler"
                  value={pkg.note}
                  onChange={(event) =>
                    update(index, "note", event.target.value)
                  }
                />
              )}
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className={labelClass}>Full packed lb</span>
              <input
                className={fieldClass}
                inputMode="decimal"
                placeholder="Box + product + dry ice"
                value={pkg.packed_weight_lb}
                onChange={(event) =>
                  update(index, "packed_weight_lb", event.target.value)
                }
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className={labelClass}>Dry ice lb</span>
              <input
                className={fieldClass}
                inputMode="decimal"
                placeholder="Dry ice only"
                value={pkg.dry_ice_lb}
                onChange={(event) =>
                  update(index, "dry_ice_lb", event.target.value)
                }
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className={labelClass}>Note</span>
              <input
                className={fieldClass}
                value={pkg.note}
                onChange={(event) => update(index, "note", event.target.value)}
              />
            </label>
            <button
              className="min-h-[42px] self-end rounded-md border border-gray-200 px-3 text-xs font-maison-neue-mono uppercase text-Charcoal/60"
              onClick={() => removeRow(index)}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {(error || saveState === "saved") && (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || "Package details saved."}
        </p>
      )}
    </div>
  )
}

export default function StaffCatchWeightFinalizationConsole({
  canChargeFinalOrders = false,
  canPickOrders = true,
  canPackOrders = true,
  canViewAuditTrail = false,
}: {
  canChargeFinalOrders?: boolean
  canPickOrders?: boolean
  canPackOrders?: boolean
  canViewAuditTrail?: boolean
}) {
  const [queue, setQueue] = useState<StaffCatchWeightFinalizationSummary[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detail, setDetail] =
    useState<StaffCatchWeightFinalizationDetail | null>(null)
  const [filter, setFilter] = useState(() =>
    canPickOrders
      ? "pending_pick,picking,pending_pack"
      : "ready_for_packing,packing,packed_pending_review"
  )
  const [queueQuery, setQueueQuery] = useState("")
  const [fulfillmentTypeFilter, setFulfillmentTypeFilter] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const queueRequestRef = useRef(0)

  const selectedSummary = useMemo(
    () => queue.find((item) => item.order_id === selectedOrderId),
    [queue, selectedOrderId]
  )
  const currencyCode =
    detail?.finalization?.currency_code ||
    selectedSummary?.currency_code ||
    "usd"
  const blockingIssues = useMemo(
    () => finalizationBlockingIssues(detail),
    [detail]
  )
  const blockingErrorCount = blockingIssues.length
  const pickerReadiness = useMemo(
    () => finalizationPickerReadiness(detail),
    [detail]
  )

  function loadQueue(
    nextSelectedOrderId?: string | null,
    filterOverride?: {
      query?: string
      fulfillmentType?: string
      dateFrom?: string
      dateTo?: string
    }
  ) {
    const requestId = queueRequestRef.current + 1
    queueRequestRef.current = requestId
    const nextQuery = filterOverride?.query ?? queueQuery
    const nextFulfillmentType =
      filterOverride?.fulfillmentType ?? fulfillmentTypeFilter
    const nextDateFrom = filterOverride?.dateFrom ?? dateFromFilter
    const nextDateTo = filterOverride?.dateTo ?? dateToFilter

    startTransition(async () => {
      try {
        const rows = await listCatchWeightFinalizationQueue({
          status: filter,
          limit: 100,
          query: nextQuery.trim(),
          fulfillmentType: nextFulfillmentType,
          dateFrom: nextDateFrom,
          dateTo: nextDateTo,
        })
        if (requestId !== queueRequestRef.current) return
        setQueue(rows)
        const requestedId =
          nextSelectedOrderId === undefined
            ? selectedOrderId
            : nextSelectedOrderId
        const nextId =
          requestedId && rows.some((row) => row.order_id === requestedId)
            ? requestedId
            : null
        setSelectedOrderId(nextId)
        if (nextId) {
          setDetail(await getCatchWeightFinalizationDetail(nextId))
        } else {
          setDetail(null)
        }
      } catch (err: any) {
        if (requestId !== queueRequestRef.current) return
        setError(err.message || "Could not load finalization queue.")
      }
    })
  }

  function clearQueueFilters() {
    setQueueQuery("")
    setFulfillmentTypeFilter("")
    setDateFromFilter("")
    setDateToFilter("")
    setError(null)
    setStatus(null)
    loadQueue(null, {
      query: "",
      fulfillmentType: "",
      dateFrom: "",
      dateTo: "",
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

  function sendBackToPicking() {
    if (!selectedOrderId || pendingAction) return
    const reason =
      window.prompt(
        "Why is this order going back to picking?",
        "Packer found a mismatch during packing."
      ) || ""
    if (!reason.trim()) return
    runAction("return-picking", "Order sent back to picking.", (orderId) =>
      returnCatchWeightOrderToPicking({ orderId, reason: reason.trim() })
    )
  }

  function unclaimPick() {
    if (!selectedOrderId || pendingAction) return
    if (
      !window.confirm(
        "Release this pick so another picker can claim it? Saved line work stays on the order."
      )
    ) {
      return
    }
    runAction("unclaim-pick", "Pick released.", (orderId) =>
      unclaimCatchWeightPick({
        orderId,
        reason: "Picker released the claimed pick.",
      })
    )
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadQueue()
    }, 250)

    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, queueQuery, fulfillmentTypeFilter, dateFromFilter, dateToFilter])

  const totals = detail?.totals || detail?.finalization || {}
  const currentStatus = detail?.finalization?.status || ""
  const pickingStatuses = new Set(["pending_pick", "picking", "pending_pack"])
  const packingStatuses = new Set([
    "packing",
    "packed_pending_review",
    "packed_pending_charge",
    "charge_failed_hold",
    "charged_ready_to_ship",
    "released_to_fulfillment",
  ])
  const inPickingPhase = pickingStatuses.has(currentStatus)
  const pickClaimed = currentStatus === "picking"
  const waitingForPacker = currentStatus === "ready_for_packing"
  const inPackingPhase = waitingForPacker || packingStatuses.has(currentStatus)
  const editorPhase: FinalizationPhase = inPackingPhase ? "packing" : "picking"
  const canEditLines = inPickingPhase
    ? canPickOrders && pickClaimed
    : inPackingPhase && !waitingForPacker
    ? canPackOrders
    : false
  const readyForFulfillment = catchWeightReadyForFulfillment(detail)
  const fulfilled = hasActiveFulfillment(detail?.order)
  const permissionChargeDisabledReason = !canChargeFinalOrders
    ? "This staff account can pack orders but is not allowed to charge saved cards."
    : !canPackOrders
    ? "This staff account is not allowed to pack and release orders."
    : null
  const chargeDisabledReason =
    permissionChargeDisabledReason ||
    (blockingErrorCount > 0
      ? "Resolve the listed packing issues before charging."
      : null)
  const readyForPackingDisabledReason = !canPickOrders
    ? "This staff account is not allowed to pick orders."
    : !pickClaimed
    ? "Claim the pick before handing this order to packing."
    : pickerReadiness.blockers.length
    ? "Resolve the listed pick issues before handing this order to packing."
    : null
  const readyForPackingBlocked = Boolean(readyForPackingDisabledReason)
  const readyForPackingBlockerId = "ready-for-packing-blockers"
  const activeQueueFilters = Boolean(
    queueQuery || fulfillmentTypeFilter || dateFromFilter || dateToFilter
  )

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
              ["Picking", "pending_pick,picking,pending_pack"],
              ["Ready for packing", "ready_for_packing"],
              ["Packing", "packing,packed_pending_review"],
              ["Ready to charge", "packed_pending_charge"],
              ["Charge holds", "charge_failed_hold"],
              ["Ready ship", "charged_ready_to_ship,released_to_fulfillment"],
            ]
              .filter(([label]) => {
                if (label === "Picking") return canPickOrders
                if (label === "Ready for packing" || label === "Packing") {
                  return canPackOrders || canPickOrders
                }
                return canPackOrders || canChargeFinalOrders
              })
              .map(([label, value]) => (
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
          <div className="border-b border-gray-200 bg-SilverPlate/20 p-3">
            <div className="grid gap-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Search queue</span>
                <input
                  className={fieldClass}
                  placeholder="Order, email, name, ZIP"
                  value={queueQuery}
                  onChange={(event) => setQueueQuery(event.target.value)}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className={labelClass}>Fulfillment</span>
                <select
                  className={fieldClass}
                  value={fulfillmentTypeFilter}
                  onChange={(event) =>
                    setFulfillmentTypeFilter(event.target.value)
                  }
                >
                  <option value="">All methods</option>
                  <option value="plant_pickup">Plant pickup</option>
                  <option value="atlanta_delivery">Atlanta delivery</option>
                  <option value="ups_shipping">UPS shipping</option>
                  <option value="southeast_pickup">Southeast pickup</option>
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1">
                  <span className={labelClass}>Ship / pickup from</span>
                  <input
                    className={fieldClass}
                    type="date"
                    value={dateFromFilter}
                    onChange={(event) => setDateFromFilter(event.target.value)}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1">
                  <span className={labelClass}>Through</span>
                  <input
                    className={fieldClass}
                    type="date"
                    value={dateToFilter}
                    onChange={(event) => setDateToFilter(event.target.value)}
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-maison-neue text-Charcoal/45">
                  {isPending
                    ? "Updating queue..."
                    : "Results update as you filter."}
                </p>
                <button
                  className={`min-h-[42px] shrink-0 rounded-md border px-4 text-xs font-rexton font-bold uppercase ${
                    activeQueueFilters
                      ? "border-Charcoal bg-white text-Charcoal hover:border-Gold/70"
                      : "cursor-not-allowed border-gray-200 bg-gray-50 text-Charcoal/35"
                  }`}
                  disabled={!activeQueueFilters}
                  onClick={clearQueueFilters}
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
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
                      {item.order_email || item.customer_email || "Customer"}
                    </span>
                    {(item.fulfillment_type || item.fulfillment_date) && (
                      <span className="mt-1 block truncate text-xs font-maison-neue text-Charcoal/50">
                        {[
                          fulfillmentTypeLabel(item.fulfillment_type),
                          shortDateLabel(item.fulfillment_date),
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </span>
                    )}
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
                {activeQueueFilters
                  ? "No orders match these filters."
                  : "No submitted orders are waiting for catch-weight finalization."}
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
                        Change
                      </p>
                      <p className="font-maison-neue text-sm text-Charcoal">
                        {money(totals.delta_total, currencyCode)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {["pending_pick", "pending_pack"].includes(currentStatus) && (
                    <Button
                      className={`${primaryButtonClass} w-full sm:w-auto`}
                      disabled={!canPickOrders || Boolean(pendingAction)}
                      isLoading={pendingAction === "start-pick"}
                      onClick={() =>
                        runAction("start-pick", "Picking claimed.", (orderId) =>
                          startCatchWeightFinalization(orderId, "pick")
                        )
                      }
                      type="button"
                    >
                      Claim Pick
                    </Button>
                  )}
                  {pickClaimed && (
                    <Button
                      className={`${secondaryButtonClass} w-full sm:w-auto`}
                      disabled={Boolean(pendingAction)}
                      isLoading={pendingAction === "unclaim-pick"}
                      onClick={unclaimPick}
                      type="button"
                    >
                      Unclaim Pick
                    </Button>
                  )}
                  {pickClaimed && (
                    <Button
                      className={`w-full sm:w-auto ${
                        readyForPackingBlocked
                          ? disabledButtonClass
                          : secondaryButtonClass
                      }`}
                      disabled={
                        Boolean(pendingAction) || readyForPackingBlocked
                      }
                      isLoading={pendingAction === "ready-pack"}
                      aria-describedby={
                        readyForPackingBlocked
                          ? readyForPackingBlockerId
                          : undefined
                      }
                      aria-disabled={readyForPackingBlocked || undefined}
                      onClick={() =>
                        runAction(
                          "ready-pack",
                          "Order ready for packing.",
                          markCatchWeightReadyForPacking
                        )
                      }
                      title={readyForPackingDisabledReason || undefined}
                      type="button"
                    >
                      Ready For Packing
                    </Button>
                  )}
                  {waitingForPacker && (
                    <Button
                      className={`${primaryButtonClass} w-full sm:w-auto`}
                      disabled={!canPackOrders || Boolean(pendingAction)}
                      isLoading={pendingAction === "start-pack"}
                      onClick={() =>
                        runAction("start-pack", "Packing claimed.", (orderId) =>
                          startCatchWeightFinalization(orderId, "pack")
                        )
                      }
                      type="button"
                    >
                      Claim Pack
                    </Button>
                  )}
                  {inPackingPhase && !waitingForPacker && (
                    <Button
                      className={`${secondaryButtonClass} w-full sm:w-auto`}
                      disabled={!canPackOrders || Boolean(pendingAction)}
                      isLoading={pendingAction === "return-picking"}
                      onClick={sendBackToPicking}
                      type="button"
                    >
                      Send Back To Picking
                    </Button>
                  )}
                  {inPackingPhase && !waitingForPacker && (
                    <Button
                      className={`${primaryButtonClass} w-full sm:w-auto`}
                      disabled={
                        !canPackOrders ||
                        Boolean(pendingAction) ||
                        blockingErrorCount > 0
                      }
                      isLoading={pendingAction === "approve"}
                      onClick={() =>
                        runAction(
                          "approve",
                          "Ready for final charge.",
                          approveCatchWeightFinalization
                        )
                      }
                      type="button"
                    >
                      Mark Ready For Charge
                    </Button>
                  )}
                  {inPackingPhase && !waitingForPacker && (
                    <Button
                      className="min-h-[42px] w-full rounded-md bg-Gold px-4 text-xs font-rexton font-bold uppercase text-Charcoal sm:w-auto"
                      disabled={
                        Boolean(pendingAction) || Boolean(chargeDisabledReason)
                      }
                      isLoading={pendingAction === "charge"}
                      onClick={() =>
                        runAction(
                          "charge",
                          "Card charged; order ready to ship.",
                          chargeAndReleaseCatchWeightOrder
                        )
                      }
                      type="button"
                    >
                      Charge Card & Release
                    </Button>
                  )}
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
                {inPickingPhase && !pickClaimed && (
                  <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-900">
                    <p className="font-maison-neue font-semibold">
                      Claim this pick before editing or handing it to packing.
                    </p>
                    <p className="mt-1 font-maison-neue text-blue-900/75">
                      Claiming records who owns the pick and unlocks the picked
                      count, remove, and substitute controls.
                    </p>
                  </div>
                )}
                {pickClaimed &&
                  (pickerReadiness.blockers.length > 0 ||
                    pickerReadiness.warnings.length > 0) && (
                    <div
                      aria-live="polite"
                      className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                      id={readyForPackingBlockerId}
                    >
                      {pickerReadiness.blockers.length > 0 && (
                        <>
                          <p className="font-maison-neue font-semibold">
                            Ready For Packing is blocked.
                          </p>
                          <p className="mt-1 font-maison-neue text-amber-900/75">
                            Clear these items before the handoff button unlocks.
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {pickerReadiness.blockers.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {pickerReadiness.warnings.length > 0 && (
                        <>
                          <p
                            className={`font-maison-neue font-semibold ${
                              pickerReadiness.blockers.length > 0 ? "mt-3" : ""
                            }`}
                          >
                            Review intentional exceptions:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {pickerReadiness.warnings.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                {inPackingPhase &&
                  !waitingForPacker &&
                  chargeDisabledReason && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {blockingIssues.length ? (
                        <>
                          <p className="font-maison-neue font-semibold">
                            Resolve these before charging:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {blockingIssues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        chargeDisabledReason
                      )}
                    </div>
                  )}
              </div>

              {canViewAuditTrail && <OrderAuditTrail order={detail.order} />}

              {canEditLines && (
                <AddFinalizationItem
                  orderId={detail.order.id}
                  currencyCode={currencyCode}
                  canEdit={canEditLines}
                  onSaved={() => loadDetail(detail.order.id)}
                />
              )}

              {!waitingForPacker && inPackingPhase && (
                <PackageCapture
                  orderId={detail.order.id}
                  detail={detail}
                  onSaved={() => loadDetail(detail.order.id)}
                />
              )}

              <div>
                {detail.lines.map((line) => (
                  <LineEditor
                    key={line.id}
                    orderId={detail.order.id}
                    line={line}
                    currencyCode={currencyCode}
                    phase={editorPhase}
                    canEdit={canEditLines}
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
