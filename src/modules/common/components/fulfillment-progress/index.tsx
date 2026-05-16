"use client"

import { type FormEvent, useEffect, useState } from "react"
import { convertToLocale } from "@lib/util/money"
import {
  getFreeShippingState,
  type FulfillmentType,
} from "@lib/util/free-shipping"
import { lookupUpsGroundDays } from "@lib/util/eligible-arrival-dates"
import { ATLANTA_DELIVERY_ZIP_DAYS } from "@lib/util/atlanta-delivery-zips"
import {
  DELIVERY_ZIP_EVENT,
  getStoredDeliveryZip,
  normalizeDeliveryZip,
  storeDeliveryZip,
} from "@lib/util/delivery-zip"
import type { AtlantaZipDayConfig } from "@lib/util/eligible-arrival-dates"

type FulfillmentProgressProps = {
  /** Subtotal that qualifies toward the offer, in dollars. */
  subtotal?: number | null
  /** Full cart subtotal, in dollars. Used when excluded items are present. */
  cartSubtotal?: number | null
  /** Non-qualifying subtotal, in dollars. */
  excludedSubtotal?: number | null
  currencyCode?: string
  fulfillmentType?: FulfillmentType
  shipState?: string | null
  postalCode?: string | null
  atlantaZipConfig?: Record<string, AtlantaZipDayConfig>
  className?: string
  context?: "cart" | "pdp"
  variant?: "light" | "dark"
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

function inferFulfillmentType(
  fulfillmentType: FulfillmentType,
  postalCode?: string | null,
  atlantaZipConfig: Record<string, AtlantaZipDayConfig> = ATLANTA_DELIVERY_ZIP_DAYS
): FulfillmentType {
  if (fulfillmentType) return fulfillmentType
  const zip = normalizeDeliveryZip(postalCode)
  if (zip && atlantaZipConfig[zip]) return "atlanta_delivery"
  if (normalizeDeliveryZip(postalCode).length === 5) return "ups_shipping"
  return null
}

function fulfillmentLabel(
  kind: ReturnType<typeof getFreeShippingState>["kind"]
): string {
  if (kind === "atlanta_delivery") return "free local delivery"
  if (kind === "southeast_pickup") return "free regional pickup"
  if (kind === "national_ups") return "free UPS Ground shipping"
  if (kind === "in_region_ups") return "the regional free-delivery threshold"
  return "free delivery or shipping"
}

function etaText(
  fulfillmentType: FulfillmentType,
  postalCode?: string | null,
  atlantaZipConfig: Record<string, AtlantaZipDayConfig> = ATLANTA_DELIVERY_ZIP_DAYS
): string {
  const zip = normalizeDeliveryZip(postalCode)

  if (fulfillmentType === "plant_pickup") {
    return "Plant pickup is selected; checkout confirms your pickup slot before payment."
  }

  if (fulfillmentType === "southeast_pickup") {
    return "Regional pickup is selected; checkout confirms the pickup location and date before payment."
  }

  if (
    fulfillmentType === "atlanta_delivery" ||
    Boolean(atlantaZipConfig[zip])
  ) {
    const route = atlantaZipConfig[zip]
    const routeDays =
      route?.weekdays
        ?.map((day) => WEEKDAY_NAMES[day])
        .filter(Boolean)
        .join(" or ") || "local route"

    return zip
      ? `Using ZIP ${zip}: local delivery route is ${routeDays}; checkout confirms the exact day before payment.`
      : "Local delivery is selected; checkout confirms the exact route day before payment."
  }

  if (zip.length === 5) {
    const days = lookupUpsGroundDays(zip)
    return `Using ZIP ${zip}: UPS Ground estimate is ${days === 1 ? "1 business day" : `${days} business days`} in transit.`
  }

  return "Enter your ZIP or choose fulfillment to see local delivery, pickup, or UPS transit before payment."
}

export default function FulfillmentProgress({
  subtotal = 0,
  cartSubtotal,
  excludedSubtotal,
  currencyCode = "usd",
  fulfillmentType,
  shipState,
  postalCode,
  atlantaZipConfig = ATLANTA_DELIVERY_ZIP_DAYS,
  className = "",
  variant = "light",
}: FulfillmentProgressProps) {
  const normalizedPropZip = normalizeDeliveryZip(postalCode)
  const [submittedZip, setSubmittedZip] = useState(normalizedPropZip)
  const [zipInput, setZipInput] = useState(normalizedPropZip)
  const [zipError, setZipError] = useState("")
  const [isEditingZip, setIsEditingZip] = useState(false)
  const effectivePostalCode = submittedZip || normalizedPropZip
  const baseSubtotal = Math.max(0, subtotal ?? 0)
  const fullSubtotal = Math.max(0, cartSubtotal ?? baseSubtotal)
  const excluded = Math.max(
    0,
    excludedSubtotal ?? Math.max(0, fullSubtotal - baseSubtotal)
  )
  const hasExcludedSubtotal = excluded > 0
  const effectiveFulfillmentType = inferFulfillmentType(
    fulfillmentType,
    effectivePostalCode,
    atlantaZipConfig
  )
  const state = getFreeShippingState({
    subtotal: baseSubtotal,
    fulfillmentType: effectiveFulfillmentType,
    shipState,
  })

  const progress = state.threshold
    ? Math.min(100, Math.max(0, (baseSubtotal / state.threshold) * 100))
    : state.qualified
      ? 100
      : 0
  const thresholdLabel = state.threshold
    ? convertToLocale({ amount: state.threshold, currency_code: currencyCode })
    : null
  const remainingLabel =
    state.threshold && !state.qualified
      ? convertToLocale({ amount: state.remaining, currency_code: currencyCode })
      : null
  const freeLabel = fulfillmentLabel(state.kind)
  const needsZip = state.kind === "ambiguous" && !effectiveFulfillmentType
  const canEditZip = !fulfillmentType && effectivePostalCode.length === 5
  const showZipForm = needsZip || isEditingZip

  useEffect(() => {
    if (normalizedPropZip) {
      setSubmittedZip(normalizedPropZip)
      setZipInput(normalizedPropZip)
      setIsEditingZip(false)
      return
    }

    const savedZip = getStoredDeliveryZip()
    if (!savedZip) return
    setSubmittedZip(savedZip)
    setZipInput(savedZip)
  }, [normalizedPropZip])

  useEffect(() => {
    const handleDeliveryZipUpdate = (event: Event) => {
      const nextZip = normalizeDeliveryZip(
        (event as CustomEvent<{ zip?: string }>).detail?.zip
      )
      const savedZip = nextZip || getStoredDeliveryZip()
      setSubmittedZip(savedZip)
      setZipInput(savedZip)
      setZipError("")
      setIsEditingZip(false)
    }

    window.addEventListener(DELIVERY_ZIP_EVENT, handleDeliveryZipUpdate)
    return () =>
      window.removeEventListener(DELIVERY_ZIP_EVENT, handleDeliveryZipUpdate)
  }, [])

  const handleZipSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = normalizeDeliveryZip(zipInput)

    if (normalized.length !== 5) {
      setZipInput(normalized)
      setZipError("Enter a 5-digit ZIP code.")
      return
    }

    const storedZip = storeDeliveryZip(normalized)
    setSubmittedZip(storedZip)
    setZipInput(storedZip)
    setZipError("")
    setIsEditingZip(false)
  }

  const message = (() => {
    if (state.isPlantPickup) {
      return state.pickupBonusEarned
        ? "Pickup is free and the pickup credit is unlocked."
        : `${convertToLocale({
            amount: state.pickupBonusRemaining,
            currency_code: currencyCode,
          })} away from the pickup credit.`
    }
    if (state.kind === "overnight") {
      return "UPS Overnight is charged at the carrier rate."
    }
    if (state.kind === "ambiguous") {
      return "Enter your ZIP here to see the right free threshold."
    }
    if (state.qualified) {
      return `This cart qualifies for ${freeLabel}.`
    }
    return `${remainingLabel} away from ${freeLabel}.`
  })()

  const isDark = variant === "dark"

  return (
    <div
      className={`rounded-[5px] border px-4 py-3 ${
        isDark
          ? "border-white/10 bg-white/5 text-white"
          : "border-Charcoal/15 bg-white text-Charcoal"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide ${
              isDark ? "text-white/55" : "text-Charcoal/60"
            }`}
          >
            Cart progress
          </p>
          <p className="mt-1 font-maison-neue text-sm font-semibold leading-snug">
            {message}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide ${
            isDark ? "bg-white/10 text-white" : "bg-Scroll text-Charcoal"
          }`}
        >
          {thresholdLabel
            ? `Free at ${thresholdLabel}`
            : state.isPlantPickup
              ? "Pickup"
              : state.kind === "overnight"
                ? "Carrier rate"
                : "Add ZIP"}
        </span>
      </div>

      {showZipForm && (
        <form
          onSubmit={handleZipSubmit}
          className={`mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] ${
            isDark ? "text-white" : "text-Charcoal"
          }`}
        >
          <label className="min-w-0">
            <span className="sr-only">Delivery ZIP code</span>
            <input
              inputMode="numeric"
              autoComplete="postal-code"
              value={zipInput}
              onChange={(event) => {
                setZipInput(normalizeDeliveryZip(event.target.value))
                setZipError("")
              }}
              placeholder="ZIP code"
              className={`h-11 w-full min-w-0 rounded-[5px] border px-3 font-maison-neue text-sm outline-none transition-colors focus:border-Gold focus:ring-2 focus:ring-Gold/30 ${
                isDark
                  ? "border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  : "border-Charcoal/20 bg-Scroll text-Charcoal placeholder:text-Charcoal/40"
              }`}
            />
          </label>
          <button
            type="submit"
            className={`h-11 rounded-[5px] border px-4 font-rexton text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold ${
              isDark
                ? "border-Gold bg-Gold text-Charcoal hover:bg-Gold/90"
                : "border-Charcoal bg-Charcoal text-white hover:bg-Charcoal/90"
            }`}
          >
            Check
          </button>
          {zipError && (
            <p
              className={`sm:col-span-2 font-maison-neue text-xs leading-snug ${
                isDark ? "text-Gold" : "text-VibrantRed"
              }`}
            >
              {zipError}
            </p>
          )}
        </form>
      )}

      <div
        className={`mt-3 h-2 overflow-hidden rounded-full ${
          isDark ? "bg-white/15" : "bg-Charcoal/10"
        }`}
      >
        <div
          className="h-full rounded-full bg-Gold transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={`mt-3 grid gap-2 text-xs leading-snug sm:grid-cols-2 ${
          isDark ? "text-white/60" : "text-Charcoal/60"
        }`}
      >
        <p>
          {hasExcludedSubtotal ? "Eligible subtotal" : "Cart subtotal"}:{" "}
          <strong className={isDark ? "text-white" : "text-Charcoal"}>
            {convertToLocale({
              amount: baseSubtotal,
              currency_code: currencyCode,
            })}
          </strong>
          {hasExcludedSubtotal && (
            <span className="block">
              {convertToLocale({
                amount: excluded,
                currency_code: currencyCode,
              })}{" "}
              in cart items does not count toward this offer.
            </span>
          )}
        </p>
        <p>
          {needsZip || isEditingZip ? (
            "This ZIP will be saved for delivery estimates across this browser."
          ) : (
            <>
              {etaText(
                effectiveFulfillmentType,
                effectivePostalCode,
                atlantaZipConfig
              )}
              {canEditZip && (
                <button
                  type="button"
                  onClick={() => {
                    setZipInput(effectivePostalCode)
                    setIsEditingZip(true)
                  }}
                  className={`ml-2 underline underline-offset-2 transition-colors ${
                    isDark
                      ? "text-white hover:text-Gold"
                      : "text-Charcoal hover:text-VibrantRed"
                  }`}
                >
                  Change ZIP
                </button>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
