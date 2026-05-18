"use client"

import { useState, useMemo } from "react"
import {
  requestLegacyReorderAssistance,
  type LegacyCustomerOrder,
  type PurchaseHistoryItem,
} from "@lib/data/orders"
import { addToCart } from "@lib/data/cart"
import { dispatchCartUpdated } from "@lib/util/cart-events"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import { ProductCard } from "@modules/collections/components/strapi-product-grid"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { toast } from "@medusajs/ui"

type SortOption = "recent" | "frequent" | "az" | "price"
type DateFilter = "all" | "30" | "60" | "90"
type RequestState = "idle" | "submitting" | "sent" | "error"
type AddState = "idle" | "adding" | "added" | "error"

function historyKey(item: PurchaseHistoryItem) {
  return (
    item.key ||
    item.variantId ||
    item.productId ||
    item.legacyItemId ||
    item.sku ||
    `${item.title}-${item.lastOrderedAt}`
  )
}

function itemTitle(
  item: PurchaseHistoryItem,
  strapiProduct?: StrapiCollectionProduct
) {
  return (
    strapiProduct?.Title || item.productTitle || item.title || "Past purchase"
  )
}

function formatLegacyDate(value?: string | null) {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatLegacyMoney(value?: number | null, currencyCode = "usd") {
  if (typeof value !== "number" || !Number.isFinite(value)) return ""

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(value)
}

function legacyOrderDisplayId(order: LegacyCustomerOrder) {
  return (
    order.ref_number || order.qbd_txn_id || order.legacy_order_id || order.id
  )
}

function legacyLineDisplayTitle(line: LegacyCustomerOrder["lines"][number]) {
  return (
    line.display_title ||
    line.medusa_variant_title ||
    line.medusa_product_title ||
    line.title ||
    line.description ||
    "Historical item"
  )
}

function legacyLineActionKey(line: LegacyCustomerOrder["lines"][number]) {
  return (
    line.purchase_history_key ||
    (line.medusa_variant_id ? `variant:${line.medusa_variant_id}` : "") ||
    line.qbd_item_list_id ||
    line.sku ||
    line.id
  )
}

function legacyLineStateKey(line: LegacyCustomerOrder["lines"][number]) {
  return `line:${line.id}`
}

function isStaffAssistedHistoryItem(item: PurchaseHistoryItem) {
  return item.mappingStatus === "staff_assisted"
}

function historyUnitPriceForSort(item: PurchaseHistoryItem) {
  if (item.source === "legacy" || item.source === "medusa+legacy") {
    return item.unitPrice
  }

  return item.unitPrice / 100
}

function LegacyOrdersSection({
  orders,
  totalCount,
  addStates,
  requestStates,
  onAddLine,
  onRequestLine,
}: {
  orders: LegacyCustomerOrder[]
  totalCount?: number
  addStates: Record<string, AddState>
  requestStates: Record<string, RequestState>
  onAddLine: (
    order: LegacyCustomerOrder,
    line: LegacyCustomerOrder["lines"][number]
  ) => void
  onRequestLine: (line: LegacyCustomerOrder["lines"][number]) => void
}) {
  const visibleOrders = orders.filter((order) => order.lines?.length)
  if (!visibleOrders.length) return null

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 small:p-5">
      <div className="mb-4 flex flex-col gap-1 small:flex-row small:items-end small:justify-between">
        <div>
          <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
            Older orders
          </p>
          <h2 className="text-2xl font-gyst font-bold text-Charcoal">
            Past orders
          </h2>
        </div>
        <p className="text-xs font-maison-neue text-Charcoal/45">
          {visibleOrders.length}
          {totalCount && totalCount > visibleOrders.length
            ? ` of ${totalCount}`
            : ""}{" "}
          shown
        </p>
      </div>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {visibleOrders.map((order) => (
          <details className="group" key={order.id}>
            <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3 hover:bg-SilverPlate/30 small:flex-row small:items-center small:justify-between">
              <span className="min-w-0">
                <span className="block break-words text-sm font-maison-neue font-semibold text-Charcoal">
                  Invoice {legacyOrderDisplayId(order)}
                </span>
                <span className="block text-xs font-maison-neue text-Charcoal/55">
                  {formatLegacyDate(order.placed_at)} |{" "}
                  {order.status || "imported"} |{" "}
                  {order.customer_visible_line_count ?? order.lines.length} item
                  {(order.customer_visible_line_count ?? order.lines.length) ===
                  1
                    ? ""
                    : "s"}
                </span>
              </span>
              <span className="shrink-0 text-left text-sm font-maison-neue font-semibold text-Charcoal small:text-right">
                {formatLegacyMoney(order.total, order.currency_code)}
              </span>
            </summary>

            <div className="px-4 pb-4">
              <ul className="space-y-2 border-t border-gray-100 pt-3">
                {order.lines.map((line) => (
                  <li
                    className="grid gap-2 text-sm font-maison-neue text-Charcoal/75 small:grid-cols-[minmax(0,1fr)_90px_130px] small:items-start"
                    key={line.id}
                  >
                    <span className="min-w-0 break-words">
                      {line.quantity} x {legacyLineDisplayTitle(line)}
                      {line.sku ? (
                        <span className="ml-2 text-xs uppercase text-Charcoal/40">
                          {line.sku}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-Charcoal/55 small:text-right">
                      {formatLegacyMoney(line.line_total, line.currency_code)}
                    </span>
                    {line.medusa_variant_id ? (
                      <button
                        type="button"
                        onClick={() => onAddLine(order, line)}
                        disabled={
                          addStates[legacyLineStateKey(line)] === "adding" ||
                          addStates[legacyLineStateKey(line)] === "added"
                        }
                        className="inline-flex min-h-[34px] items-center justify-center rounded-[5px] bg-Gold px-3 text-xs font-rexton font-bold uppercase text-Charcoal transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {addStates[legacyLineStateKey(line)] === "adding"
                          ? "Adding"
                          : addStates[legacyLineStateKey(line)] === "added"
                          ? "Added"
                          : "Add"}
                      </button>
                    ) : line.purchase_history_key ? (
                      <button
                        type="button"
                        onClick={() => onRequestLine(line)}
                        disabled={
                          requestStates[legacyLineStateKey(line)] ===
                            "submitting" ||
                          requestStates[legacyLineStateKey(line)] === "sent"
                        }
                        className="inline-flex min-h-[34px] items-center justify-center rounded-[5px] border border-Charcoal px-3 text-xs font-rexton font-bold uppercase text-Charcoal transition-colors hover:bg-Charcoal hover:text-white disabled:cursor-not-allowed disabled:border-Charcoal/30 disabled:text-Charcoal/35"
                      >
                        {requestStates[legacyLineStateKey(line)] ===
                        "submitting"
                          ? "Sending"
                          : requestStates[legacyLineStateKey(line)] === "sent"
                          ? "Sent"
                          : "Ask Staff"}
                      </button>
                    ) : (
                      <span className="text-xs font-maison-neue text-Charcoal/40 small:text-right">
                        On file
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

function LegacyHistoryCard({
  item,
  requestState,
  onRequest,
}: {
  item: PurchaseHistoryItem
  requestState: RequestState
  onRequest: () => void
}) {
  const title = item.productTitle || item.title || "Past purchase"
  const staffAssisted = isStaffAssistedHistoryItem(item)
  const lastOrdered = item.lastOrderedAt
    ? new Date(item.lastOrderedAt).toLocaleDateString()
    : "Unknown"
  const phoneDisplay = "(770) 454-8108"
  const phoneHref = "tel:+17704548108"
  const requestLabel =
    requestState === "submitting"
      ? "Sending..."
      : requestState === "sent"
      ? "Request sent"
      : "Ask staff to reorder"

  return (
    <div className="flex min-h-[260px] flex-col rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
            {staffAssisted ? "Staff-assisted item" : "Past purchase"}
          </p>
          <h3 className="mt-2 text-xl font-gyst font-bold leading-tight text-Charcoal">
            {title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-SilverPlate px-3 py-1 text-xs font-maison-neue text-Charcoal/70">
          Staff reorder
        </span>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-maison-neue">
        {item.sku && (
          <div>
            <dt className="text-Charcoal/45">SKU</dt>
            <dd className="text-Charcoal">{item.sku}</dd>
          </div>
        )}
        <div>
          <dt className="text-Charcoal/45">Last ordered</dt>
          <dd className="text-Charcoal">{lastOrdered}</dd>
        </div>
        <div>
          <dt className="text-Charcoal/45">Orders</dt>
          <dd className="text-Charcoal">
            {item.orderCount || item.timesOrdered}
          </dd>
        </div>
        <div>
          <dt className="text-Charcoal/45">Quantity</dt>
          <dd className="text-Charcoal">{item.totalQuantity}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-sm font-maison-neue text-Charcoal/55">
          {staffAssisted
            ? "This historical item needs staff pricing before it can be reordered online."
            : "This item is in your order history. Ask our staff to match it to today's catalog, or call us for immediate help."}
        </p>
        <div className="mt-3 flex flex-col gap-2 xsmall:flex-row">
          <button
            type="button"
            onClick={onRequest}
            disabled={requestState === "submitting" || requestState === "sent"}
            className="inline-flex min-h-[42px] items-center justify-center rounded-[5px] bg-Charcoal px-4 py-2 text-sm font-rexton font-bold uppercase text-white transition-colors hover:bg-Charcoal/90 disabled:cursor-not-allowed disabled:bg-Charcoal/45"
          >
            {requestLabel}
          </button>
          <a
            className="inline-flex min-h-[42px] items-center justify-center rounded-[5px] border border-Charcoal px-4 py-2 text-sm font-rexton font-bold uppercase text-Charcoal transition-colors hover:bg-Charcoal hover:text-white"
            href={phoneHref}
          >
            Call {phoneDisplay}
          </a>
        </div>
        {requestState === "sent" && (
          <p className="mt-3 text-xs font-maison-neue text-Charcoal/50">
            We saved this request with the matching order-history details.
          </p>
        )}
      </div>
    </div>
  )
}

function MappedHistoryCard({
  item,
  addState,
  onAdd,
}: {
  item: PurchaseHistoryItem
  addState: AddState
  onAdd: () => void
}) {
  const title = item.productTitle || item.title || "Past purchase"
  const lastOrdered = item.lastOrderedAt
    ? new Date(item.lastOrderedAt).toLocaleDateString()
    : "Unknown"
  const addLabel =
    addState === "adding"
      ? "Adding..."
      : addState === "added"
      ? "Added"
      : "Add to cart"

  return (
    <div className="flex min-h-[260px] flex-col rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
            Past purchase
          </p>
          <h3 className="mt-2 text-xl font-gyst font-bold leading-tight text-Charcoal">
            {title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-Gold px-3 py-1 text-xs font-maison-neue text-Charcoal/80">
          Reorderable
        </span>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-maison-neue">
        {item.sku && (
          <div>
            <dt className="text-Charcoal/45">SKU</dt>
            <dd className="break-words text-Charcoal">{item.sku}</dd>
          </div>
        )}
        <div>
          <dt className="text-Charcoal/45">Last ordered</dt>
          <dd className="text-Charcoal">{lastOrdered}</dd>
        </div>
        <div>
          <dt className="text-Charcoal/45">Orders</dt>
          <dd className="text-Charcoal">
            {item.orderCount || item.timesOrdered}
          </dd>
        </div>
        <div>
          <dt className="text-Charcoal/45">Quantity</dt>
          <dd className="text-Charcoal">{item.totalQuantity}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={
            addState === "adding" || addState === "added" || !item.variantId
          }
          className="inline-flex min-h-[42px] w-full items-center justify-center rounded-[5px] bg-Gold px-4 py-2 text-sm font-rexton font-bold uppercase text-Charcoal transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {addLabel}
        </button>
        <p className="mt-3 text-xs font-maison-neue text-Charcoal/50">
          This item is mapped from your historical orders and can be added
          directly.
        </p>
      </div>
    </div>
  )
}

export default function ReorderBrowser({
  history,
  legacyOrders = [],
  legacyOrderCount = 0,
  strapiMap,
  countryCode,
}: {
  history: PurchaseHistoryItem[]
  legacyOrders?: LegacyCustomerOrder[]
  legacyOrderCount?: number
  strapiMap: Record<string, StrapiCollectionProduct>
  countryCode: string
}) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("recent")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [requestStates, setRequestStates] = useState<
    Record<string, RequestState>
  >({})
  const [addStates, setAddStates] = useState<Record<string, AddState>>({})

  const handleMappedAddToCart = async (item: PurchaseHistoryItem) => {
    const key = historyKey(item)
    const current = addStates[key] || "idle"
    if (current === "adding" || current === "added" || !item.variantId) {
      return
    }

    setAddStates((states) => ({ ...states, [key]: "adding" }))

    try {
      await addToCart({
        variantId: item.variantId,
        quantity: 1,
        countryCode,
        metadata: {
          source: "legacy_purchase_history",
          legacy_purchase_history_key: key,
          legacy_item_id: item.legacyItemId || undefined,
          legacy_sku: item.sku || undefined,
          legacy_last_order_ref: item.lastOrderRef || undefined,
        },
      })
      dispatchCartUpdated({
        action: "add",
        variantId: item.variantId,
        quantity: 1,
      })
      setAddStates((states) => ({ ...states, [key]: "added" }))
      toast.success("Added to cart", {
        description: item.productTitle || item.title,
      })
    } catch (error) {
      console.error("Failed to add legacy mapped item to cart:", error)
      setAddStates((states) => ({ ...states, [key]: "error" }))
      toast.error("Couldn't add to cart", {
        description: "Please try again in a moment.",
      })
    }
  }

  const handleLegacyLineAddToCart = async (
    order: LegacyCustomerOrder,
    line: LegacyCustomerOrder["lines"][number]
  ) => {
    const stateKey = legacyLineStateKey(line)
    const current = addStates[stateKey] || "idle"
    if (
      current === "adding" ||
      current === "added" ||
      !line.medusa_variant_id
    ) {
      return
    }

    setAddStates((states) => ({ ...states, [stateKey]: "adding" }))

    try {
      await addToCart({
        variantId: line.medusa_variant_id,
        quantity: 1,
        countryCode,
        metadata: {
          source: "legacy_order_line",
          legacy_purchase_history_key: legacyLineActionKey(line),
          legacy_order_id: order.id,
          legacy_order_ref: legacyOrderDisplayId(order),
          legacy_order_line_id: line.id,
          legacy_item_id: line.qbd_item_list_id || undefined,
          legacy_sku: line.sku || undefined,
        },
      })
      dispatchCartUpdated({
        action: "add",
        variantId: line.medusa_variant_id,
        quantity: 1,
      })
      setAddStates((states) => ({ ...states, [stateKey]: "added" }))
      toast.success("Added to cart", {
        description: legacyLineDisplayTitle(line),
      })
    } catch (error) {
      console.error("Failed to add legacy order line to cart:", error)
      setAddStates((states) => ({ ...states, [stateKey]: "error" }))
      toast.error("Couldn't add to cart", {
        description: "Please try again in a moment.",
      })
    }
  }

  const handleLegacyReorderRequest = async (item: PurchaseHistoryItem) => {
    const key = historyKey(item)
    const current = requestStates[key] || "idle"
    if (current === "submitting" || current === "sent") {
      return
    }

    setRequestStates((states) => ({ ...states, [key]: "submitting" }))

    const result = await requestLegacyReorderAssistance({ key })
    if (result.success) {
      setRequestStates((states) => ({ ...states, [key]: "sent" }))
      toast.success(
        result.status === "already_requested"
          ? "Request already sent"
          : "Request sent",
        {
          description:
            "Our staff will use your purchase history to match the item.",
        }
      )
      return
    }

    setRequestStates((states) => ({ ...states, [key]: "error" }))
    toast.error("Couldn't send request", {
      description: result.error || "Please call the store and we'll help.",
    })
  }

  const handleLegacyLineReorderRequest = async (
    line: LegacyCustomerOrder["lines"][number]
  ) => {
    const stateKey = legacyLineStateKey(line)
    const current = requestStates[stateKey] || "idle"
    if (current === "submitting" || current === "sent") {
      return
    }

    setRequestStates((states) => ({ ...states, [stateKey]: "submitting" }))

    const result = await requestLegacyReorderAssistance({
      key: legacyLineActionKey(line),
    })
    if (result.success) {
      setRequestStates((states) => ({ ...states, [stateKey]: "sent" }))
      toast.success(
        result.status === "already_requested"
          ? "Request already sent"
          : "Request sent",
        {
          description:
            "Our staff will use this exact order line to match the item.",
        }
      )
      return
    }

    setRequestStates((states) => ({ ...states, [stateKey]: "error" }))
    toast.error("Couldn't send request", {
      description: result.error || "Please call the store and we'll help.",
    })
  }

  const filtered = useMemo(() => {
    const seen = new Set<string>()
    let items: Array<
      PurchaseHistoryItem & { strapiProduct?: StrapiCollectionProduct }
    > = []

    for (const h of history) {
      const key = historyKey(h)
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        ...h,
        strapiProduct: h.productId ? strapiMap[h.productId] : undefined,
      })
    }

    if (dateFilter !== "all") {
      const days = parseInt(dateFilter)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      items = items.filter((i) => new Date(i.lastOrderedAt) >= cutoff)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => {
        const title = itemTitle(i, i.strapiProduct)
        return (
          title.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          (i.sku || "").toLowerCase().includes(q) ||
          (i.lastOrderRef || "").toLowerCase().includes(q)
        )
      })
    }

    switch (sort) {
      case "recent":
        items.sort(
          (a, b) =>
            new Date(b.lastOrderedAt).getTime() -
            new Date(a.lastOrderedAt).getTime()
        )
        break
      case "frequent":
        items.sort((a, b) => b.timesOrdered - a.timesOrdered)
        break
      case "az":
        items.sort((a, b) => {
          const aTitle = itemTitle(a, a.strapiProduct)
          const bTitle = itemTitle(b, b.strapiProduct)
          return aTitle.localeCompare(bTitle)
        })
        break
      case "price":
        items.sort((a, b) => {
          const aPrice =
            a.strapiProduct?.MedusaProduct?.Variants?.[0]?.Price
              ?.CalculatedPriceNumber ?? historyUnitPriceForSort(a)
          const bPrice =
            b.strapiProduct?.MedusaProduct?.Variants?.[0]?.Price
              ?.CalculatedPriceNumber ?? historyUnitPriceForSort(b)
          return aPrice - bPrice
        })
        break
    }

    return items
  }, [history, search, sort, dateFilter, strapiMap])

  if (history.length === 0 && legacyOrders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-Charcoal/20 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652"
          />
        </svg>
        <p className="text-lg font-gyst font-bold text-Charcoal mb-2">
          No purchase history yet
        </p>
        <p className="text-sm font-maison-neue text-Charcoal/50 mb-6">
          Once you place an order, your products will appear here for easy
          reordering.
        </p>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center gap-2 px-6 py-3 bg-Gold text-Charcoal font-rexton font-bold text-sm uppercase rounded-[5px] hover:bg-Gold/90 transition-colors"
        >
          Browse Products
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <LegacyOrdersSection
        orders={legacyOrders}
        totalCount={legacyOrderCount}
        addStates={addStates}
        requestStates={requestStates}
        onAddLine={handleLegacyLineAddToCart}
        onRequestLine={handleLegacyLineReorderRequest}
      />

      {/* Search + Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col small:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-Charcoal/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search your past purchases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="px-3 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-Gold"
          >
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-Gold"
          >
            <option value="recent">Most Recent</option>
            <option value="frequent">Most Frequent</option>
            <option value="az">A - Z</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>

        <p className="mt-3 text-xs font-maison-neue text-Charcoal/40">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filtered.map((item) => {
            if (item.strapiProduct) {
              return (
                <ProductCard
                  key={historyKey(item)}
                  product={item.strapiProduct}
                  countryCode={countryCode}
                />
              )
            }

            const key = historyKey(item)
            if (item.reorderable && item.variantId) {
              return (
                <MappedHistoryCard
                  key={key}
                  item={item}
                  addState={addStates[key] || "idle"}
                  onAdd={() => handleMappedAddToCart(item)}
                />
              )
            }

            return (
              <LegacyHistoryCard
                key={key}
                item={item}
                requestState={requestStates[key] || "idle"}
                onRequest={() => handleLegacyReorderRequest(item)}
              />
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-maison-neue text-Charcoal/50">
            No products match your search. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  )
}
