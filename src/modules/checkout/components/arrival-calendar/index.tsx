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
 * Arrival-date calendar used in the new checkout shipping flow.
 *
 * Reads the selected shipping method's service_code (GROUND / OVERNIGHT / 2ND_DAY_AIR)
 * + the destination zip + the server-derived "now" to compute the set of eligible
 * arrival dates. Disabled days are non-clickable; the calendar opens on the first
 * month that contains a valid date so customers in long-transit zones (CA, OR, WA)
 * don't see an empty current-month grid.
 *
 * Fixes #36 and #72.
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

  // UPS shipping — service_code drills the transit time
  if (serviceCode === "OVERNIGHT") return "ups_overnight"
  if (serviceCode === "2ND_DAY_AIR" || serviceCode === "TWO_DAY") return "ups_2day"
  if (serviceCode === "GROUND") return "ups_ground"

  // Fallback by name (catches calculated rates that don't expose data.service_code)
  const name = (selectedOption?.name || "").toLowerCase()
  if (name.includes("overnight")) return "ups_overnight"
  if (name.includes("2nd day") || name.includes("two day")) return "ups_2day"
  return "ups_ground"
}

export default function ArriveFoodCalendar({
  cart,
  setError,
  availableShippingMethods,
  serverNowIso,
  atlantaZipConfig = ATLANTA_DELIVERY_ZIP_DAYS,
}: ArriveFoodCalendarProps) {
  const [dateValue, setDateValue] = useState<Date | null>(null)

  const method = useMemo(
    () => deriveArrivalMethod(cart, availableShippingMethods),
    [cart, availableShippingMethods]
  )
  const destinationZip = (cart.shipping_address?.postal_code || "").trim()

  // Derive server-side "now" — fall back to client clock if not provided. The
  // utility itself will re-derive nowEST() when no `now` arg is passed.
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

  const minDate = eligibility.earliest ?? undefined

  // 1) Hydrate selection from cart metadata. If the stored date is no longer
  //    eligible (the user changed method or zip) drop it and clear server-side
  //    so a logically-impossible date can never reach payment.
  useEffect(() => {
    const md = cart?.metadata?.requestedDeliveryDate as string | undefined
    if (!md) {
      // No stored selection — default to earliest valid so the calendar opens
      // on the right month. We do NOT persist; user must pick to confirm.
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

  const isDateUnavailable = useCallback(
    (d: Date) => !eligibility.isoSet.has(toIsoDate(d)),
    [eligibility.isoSet]
  )

  const handleChange = useCallback(
    (d: Date | null) => {
      setError(null)
      if (d && isDateUnavailable(d)) {
        // Defensive: refuse to set an unavailable date, even if the calendar somehow
        // surfaces one.
        setError(`That date isn't available. ${eligibility.reason}`)
        return
      }
      setDateValue(d)
      if (!d) return
      const usaDate = d.toLocaleDateString("en-US")
      setRequestedDeliveryDate({ cartId: cart.id, date: usaDate }).catch((err) =>
        setError(err.message)
      )
    },
    [cart.id, setError, isDateUnavailable, eligibility.reason]
  )

  if (!eligibility.earliest) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-lg text-sm text-amber-800">
        No eligible arrival dates found in the next 30 days for this shipping method.
        Please choose a different shipping method or contact us to schedule.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Calendar
        value={dateValue}
        onChange={handleChange}
        aria-label="Select your desired arrival date"
        minValue={minDate}
        isDateUnavailable={isDateUnavailable}
      />
      <p className="text-xs text-gray-500 leading-snug" aria-live="polite">
        {eligibility.reason}
      </p>
    </div>
  )
}
