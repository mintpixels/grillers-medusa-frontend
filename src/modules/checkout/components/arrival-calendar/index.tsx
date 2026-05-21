"use client"

import { Calendar } from "@medusajs/ui"
import { useState, useEffect, useCallback, useMemo } from "react"
import type { StoreCart, StoreCartShippingOption } from "@medusajs/types"

import { setRequestedDeliveryDate } from "@lib/data/cart"
import {
  computeEligibleArrivalDates,
  toIsoDate,
  type ArrivalMethod,
  type AtlantaZipDayConfig,
} from "@lib/util/eligible-arrival-dates"
import { ATLANTA_DELIVERY_ZIP_DAYS } from "@lib/data/strapi/checkout"

/**
 * Arrival-date picker for the checkout shipping flow. Renders the next batch of
 * eligible dates as a card grid — the calendar grid version made it impossible
 * to tell selectable vs disabled days at a glance.
 */

type ArriveFoodCalendarProps = {
  cart: StoreCart
  setError: (error: string | null) => void
  /** All shipping options visible to this cart — used to resolve service_code. */
  availableShippingMethods?: StoreCartShippingOption[] | null
  /** Server-derived "now" — passed from the parent so the client clock can't lie. */
  serverNowIso?: string
  atlantaZipConfig?: Record<string, AtlantaZipDayConfig>
}

function deriveArrivalMethod(
  cart: StoreCart,
  availableShippingMethods?: StoreCartShippingOption[] | null
): ArrivalMethod {
  const fulfillmentType = cart.metadata?.fulfillmentType as string | undefined
  const selectedOptionId = cart.shipping_methods?.at(-1)?.shipping_option_id
  const selectedOption = availableShippingMethods?.find((o) => o.id === selectedOptionId)
  const serviceCode =
    (selectedOption as any)?.data?.service_code ??
    (selectedOption as any)?.service_code

  if (fulfillmentType === "atlanta_delivery") return "atlanta_delivery"
  if (fulfillmentType === "southeast_pickup") return "southeast_pickup"
  if (fulfillmentType === "plant_pickup") return "plant_pickup"

  if (serviceCode === "OVERNIGHT") return "ups_overnight"
  if (serviceCode === "2ND_DAY_AIR" || serviceCode === "TWO_DAY") return "ups_2day"
  if (serviceCode === "GROUND") return "ups_ground"

  const name = (selectedOption?.name || "").toLowerCase()
  if (name.includes("overnight")) return "ups_overnight"
  if (name.includes("2nd day") || name.includes("two day")) return "ups_2day"
  return "ups_ground"
}

const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const INITIAL_DATES_SHOWN = 9

export default function ArriveFoodCalendar({
  cart,
  setError,
  availableShippingMethods,
  serverNowIso,
  atlantaZipConfig = ATLANTA_DELIVERY_ZIP_DAYS,
}: ArriveFoodCalendarProps) {
  const [dateValue, setDateValue] = useState<Date | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [view, setView] = useState<"list" | "calendar">("list")

  const method = useMemo(
    () => deriveArrivalMethod(cart, availableShippingMethods),
    [cart, availableShippingMethods]
  )
  const destinationZip = (cart.shipping_address?.postal_code || "").trim()

  const now = useMemo(
    () => (serverNowIso ? new Date(serverNowIso) : undefined),
    [serverNowIso]
  )

  const eligibility = useMemo(
    () =>
      computeEligibleArrivalDates({
        method,
        destinationZip,
        now,
        atlantaZipConfig,
      }),
    [method, destinationZip, now, atlantaZipConfig]
  )

  // Hydrate selection from cart metadata. If the stored date is no longer
  // eligible (method or zip changed) drop it and clear server-side so a
  // logically-impossible date can never reach payment.
  useEffect(() => {
    const md = cart?.metadata?.requestedDeliveryDate as string | undefined
    if (!md) {
      setDateValue(eligibility.earliest ?? null)
      return
    }
    const [m, d, y] = md.split("/").map(Number)
    if (!m || !d || !y) {
      setDateValue(eligibility.earliest ?? null)
      return
    }
    const stored = new Date(y, m - 1, d)
    if (eligibility.isoSet.has(toIsoDate(stored))) {
      setDateValue(stored)
    } else {
      setDateValue(eligibility.earliest ?? null)
      setRequestedDeliveryDate({ cartId: cart.id, date: "" }).catch(() => {
        /* UI will recover when user re-selects */
      })
    }
  }, [cart?.metadata?.requestedDeliveryDate, eligibility.isoSet, eligibility.earliest, cart.id])

  const handlePick = useCallback(
    (d: Date) => {
      setError(null)
      setDateValue(d)
      const usaDate = d.toLocaleDateString("en-US")
      setRequestedDeliveryDate({ cartId: cart.id, date: usaDate }).catch((err) =>
        setError(err.message)
      )
    },
    [cart.id, setError]
  )

  if (!eligibility.earliest || eligibility.dates.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-lg text-sm text-amber-800">
        No eligible arrival dates found in the next 30 days for this shipping
        method. Please choose a different shipping method or contact us to
        schedule.
      </div>
    )
  }

  const visibleDates = showAll
    ? eligibility.dates
    : eligibility.dates.slice(0, INITIAL_DATES_SHOWN)
  const selectedIso = dateValue ? toIsoDate(dateValue) : null
  const earliestIso = toIsoDate(eligibility.earliest)
  const hasMore = eligibility.dates.length > INITIAL_DATES_SHOWN

  const isDateUnavailable = (d: Date) =>
    !eligibility.isoSet.has(toIsoDate(d))

  const handleCalendarChange = (d: Date | null) => {
    if (!d) return
    handlePick(d)
  }

  const toggleView = () => setView((v) => (v === "list" ? "calendar" : "list"))

  return (
    <div className="space-y-3">
      {view === "list" ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {visibleDates.map((d) => {
              const iso = toIsoDate(d)
              const isSelected = iso === selectedIso
              const isEarliest = iso === earliestIso
              const weekday = WEEKDAY_SHORT[d.getDay()]
              const weekdayLong = WEEKDAY_LONG[d.getDay()]
              const monthAbbrev = MONTH_SHORT[d.getMonth()]
              const day = d.getDate()
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => handlePick(d)}
                  aria-pressed={isSelected}
                  aria-label={`${weekdayLong}, ${monthAbbrev} ${day}${isEarliest ? " — earliest available" : ""}`}
                  className={`
                    relative flex flex-col items-center justify-center
                    rounded-xl border-2 px-2 py-3 transition-all
                    ${isSelected
                      ? "border-Gold bg-Gold/[0.08] shadow-sm"
                      : "border-gray-200 bg-white hover:border-Gold/60 hover:shadow-sm"
                    }
                  `}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-Gold" : "text-Charcoal/60"}`}>
                    {weekday}
                  </span>
                  <span className={`text-xl font-bold leading-tight mt-0.5 ${isSelected ? "text-Charcoal" : "text-Charcoal"}`}>
                    {day}
                  </span>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${isSelected ? "text-Gold" : "text-Charcoal/50"}`}>
                    {monthAbbrev}
                  </span>
                  {isEarliest && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider bg-Gold text-white px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                      Earliest
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-xs font-semibold text-Gold hover:text-Gold/80"
              >
                {showAll
                  ? "Show fewer dates"
                  : `Show ${eligibility.dates.length - INITIAL_DATES_SHOWN} more dates`}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={toggleView}
              className="text-xs font-semibold text-Charcoal/70 hover:text-Charcoal underline underline-offset-2 transition-colors"
            >
              Switch to calendar view
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <Calendar
              value={dateValue}
              onChange={handleCalendarChange}
              aria-label="Select your desired arrival date"
              minValue={eligibility.earliest ?? undefined}
              isDateUnavailable={isDateUnavailable}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleView}
              className="text-xs font-semibold text-Charcoal/70 hover:text-Charcoal underline underline-offset-2 transition-colors"
            >
              Switch to list view
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-Charcoal/55 leading-snug" aria-live="polite">
        {eligibility.reason} Arrival dates are estimates — we don't control
        carrier schedules.
      </p>
    </div>
  )
}
