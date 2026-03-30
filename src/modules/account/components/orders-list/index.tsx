"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type StatusFilter = "all" | "not_fulfilled" | "fulfilled" | "shipped" | "delivered" | "canceled"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  not_fulfilled: { label: "Processing", className: "bg-amber-50 text-amber-700 border-amber-200" },
  fulfilled: { label: "Shipped", className: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped: { label: "Shipped", className: "bg-blue-50 text-blue-700 border-blue-200" },
  delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" },
  canceled: { label: "Canceled", className: "bg-gray-50 text-gray-500 border-gray-200" },
  partially_fulfilled: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
}

export default function OrdersList({ orders }: { orders: HttpTypes.StoreOrder[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const filtered = useMemo(() => {
    let items = [...orders]

    if (statusFilter !== "all") {
      items = items.filter((o) => o.fulfillment_status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((o) => {
        const matchId = `#${o.display_id}`.includes(q) || String(o.display_id).includes(q)
        const matchProduct = o.items?.some((i) =>
          (i.product_title || "").toLowerCase().includes(q) ||
          (i.title || "").toLowerCase().includes(q)
        )
        return matchId || matchProduct
      })
    }

    return items
  }, [orders, search, statusFilter])

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-Charcoal/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-lg font-gyst font-bold text-Charcoal mb-2">No orders yet</p>
        <p className="text-sm font-maison-neue text-Charcoal/50 mb-6">Start shopping to see your orders here.</p>
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
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col small:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-Charcoal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by order # or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2.5 text-sm font-maison-neue border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-Gold"
          >
            <option value="all">All statuses</option>
            <option value="not_fulfilled">Processing</option>
            <option value="fulfilled">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <p className="mt-3 text-xs font-maison-neue text-Charcoal/40">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Orders */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statusCfg = STATUS_CONFIG[order.fulfillment_status || ""] || { label: order.fulfillment_status || "Unknown", className: "bg-gray-50 text-gray-500 border-gray-200" }
            return (
              <LocalizedClientLink
                key={order.id}
                href={`/account/orders/details/${order.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-Gold/30 hover:shadow-sm transition-all"
              >
                <div className="flex -space-x-2 shrink-0">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="w-11 h-11 rounded-lg border-2 border-white bg-gray-100 overflow-hidden"
                      style={{ zIndex: 4 - idx }}
                    >
                      {item.thumbnail && (
                        <Image
                          src={item.thumbnail}
                          alt={item.product_title || ""}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {(order.items?.length || 0) > 4 && (
                    <div className="w-11 h-11 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-Charcoal/50">
                      +{(order.items?.length || 0) - 4}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-maison-neue font-semibold text-Charcoal">
                      Order #{order.display_id}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-maison-neue font-semibold rounded-full border ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs font-maison-neue text-Charcoal/50">
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {" · "}
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>

                <span className="text-sm font-maison-neue font-semibold text-Charcoal shrink-0">
                  {convertToLocale({ amount: order.total, currency_code: order.currency_code })}
                </span>

                <svg className="w-4 h-4 text-Charcoal/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </LocalizedClientLink>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-maison-neue text-Charcoal/50">No orders match your search.</p>
        </div>
      )}
    </div>
  )
}
