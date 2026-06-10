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
  SE_PICKUP_CREDIT_AMOUNT,
  SE_PICKUP_CREDIT_THRESHOLD,
} from "@lib/util/free-shipping-codes"
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

function fulfillmentNoun(
  kind: ReturnType<typeof getFreeShippingState>["kind"]
): string {
  if (kind === "atlanta_delivery") return "local delivery"
  if (kind === "southeast_pickup") return "regional pickup"
  if (kind === "plant_pickup") return "pickup"
  if (kind === "national_ups") return "UPS cold-chain shipping"
  if (kind === "in_region_ups") return "the regional free-delivery threshold"
  return "shipping"
}

function compactEtaText(
  fulfillmentType: FulfillmentType,
  postalCode: string,
  atlantaZipConfig: Record<string, AtlantaZipDayConfig> = ATLANTA_DELIVERY_ZIP_DAYS
): string {
  if (fulfillmentType === "plant_pickup") return "Plant pickup"
  if (fulfillmentType === "southeast_pickup") return "Regional pickup"

  if (fulfillmentType === "atlanta_delivery" || atlantaZipConfig[postalCode]) {
    const route = atlantaZipConfig[postalCode]
    const routeDays =
      route?.weekdays
        ?.map((day) => WEEKDAY_NAMES[day])
        .filter(Boolean)
        .join(" / ") || "local route"
    return `Local delivery ${routeDays}`
  }

  if (postalCode.length === 5) {
    const days = lookupUpsGroundDays(postalCode)
    return `UPS Ground · ~${days} business day${days === 1 ? "" : "s"}`
  }

  return ""
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
  const noun = fulfillmentNoun(state.kind)
  const isSoutheastPickup = effectiveFulfillmentType === "southeast_pickup"
  const seCreditQualified =
    isSoutheastPickup && baseSubtotal >= SE_PICKUP_CREDIT_THRESHOLD
  const seCreditRemaining = isSoutheastPickup
    ? Math.max(0, SE_PICKUP_CREDIT_THRESHOLD - baseSubtotal)
    : 0
  const eta = compactEtaText(
    effectiveFulfillmentType,
    effectivePostalCode,
    atlantaZipConfig
  )
  const hasKnownZip = effectivePostalCode.length === 5
  const needsZip = !hasKnownZip && !fulfillmentType
  const showZipForm = needsZip || isEditingZip
  const canEditZip = !fulfillmentType && hasKnownZip

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

  const isDark = variant === "dark"

  // Container classes
  const containerBase = isDark
    ? "border-white/10 bg-white/5 text-white"
    : "border-Charcoal/15 bg-white text-Charcoal"
  const containerSuccess = isDark
    ? "border-emerald-400/30 bg-emerald-500/[0.08] text-white"
    : "border-emerald-200 bg-emerald-50/60 text-Charcoal"

  // ────────────────────────────────────────────────────────────────
  // STATE: editing — minimal "Change ZIP" form
  // ────────────────────────────────────────────────────────────────
  if (isEditingZip) {
    return (
      <div
        className={`rounded-[5px] border px-4 py-3 ${containerBase} ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={`font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide ${
              isDark ? "text-white/55" : "text-Charcoal/60"
            }`}
          >
            Change delivery ZIP
          </p>
          <button
            type="button"
            onClick={() => {
              setIsEditingZip(false)
              setZipInput(effectivePostalCode)
              setZipError("")
            }}
            className={`text-xs font-semibold transition-colors ${
              isDark ? "text-white/70 hover:text-white" : "text-Charcoal/60 hover:text-Charcoal"
            }`}
          >
            Cancel
          </button>
        </div>
        <form
          onSubmit={handleZipSubmit}
          className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <label className="min-w-0">
            <span className="sr-only">Delivery ZIP code</span>
            <input
              inputMode="numeric"
              autoComplete="postal-code"
              autoFocus
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
            Save
          </button>
        </form>
        {zipError && (
          <p
            className={`mt-2 font-maison-neue text-xs leading-snug ${
              isDark ? "text-Gold" : "text-VibrantRed"
            }`}
          >
            {zipError}
          </p>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────
  // STATE: no ZIP yet — prompt + input
  // ────────────────────────────────────────────────────────────────
  if (needsZip) {
    return (
      <div
        className={`rounded-[5px] border px-4 py-3 ${containerBase} ${className}`}
        role="status"
        aria-live="polite"
      >
        <p
          className={`font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide ${
            isDark ? "text-white/55" : "text-Charcoal/60"
          }`}
        >
          Cart progress
        </p>
        <p className="mt-1 font-maison-neue text-sm font-semibold leading-snug">
          Add your ZIP to see your free shipping threshold.
        </p>
        <form
          onSubmit={handleZipSubmit}
          className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
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
        </form>
        {zipError && (
          <p
            className={`mt-2 font-maison-neue text-xs leading-snug ${
              isDark ? "text-Gold" : "text-VibrantRed"
            }`}
          >
            {zipError}
          </p>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────
  // STATE: qualified — compact "unlocked" card
  // ────────────────────────────────────────────────────────────────
  if (state.qualified) {
    return (
      <div
        className={`rounded-[5px] border px-4 py-3 ${containerSuccess} ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          <svg
            className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="font-maison-neue text-sm font-semibold leading-snug">
              {seCreditQualified
                ? `Free pickup + ${convertToLocale({
                    amount: SE_PICKUP_CREDIT_AMOUNT,
                    currency_code: currencyCode,
                  })} credit unlocked`
                : `Free ${noun} unlocked`}
            </p>
            {(eta || canEditZip) && (
              <p
                className={`mt-0.5 font-maison-neue text-xs leading-snug ${
                  isDark ? "text-white/65" : "text-Charcoal/60"
                }`}
              >
                {eta && <span>{eta}{hasKnownZip ? ` · ZIP ${effectivePostalCode}` : ""}</span>}
                {canEditZip && (
                  <>
                    {eta ? " · " : ""}
                    <button
                      type="button"
                      onClick={() => {
                        setZipInput(effectivePostalCode)
                        setIsEditingZip(true)
                      }}
                      className={`underline underline-offset-2 transition-colors ${
                        isDark ? "hover:text-Gold" : "hover:text-VibrantRed"
                      }`}
                    >
                      Change
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        {hasExcludedSubtotal && (
          <p
            className={`mt-2 font-maison-neue text-xs leading-snug ${
              isDark ? "text-white/55" : "text-Charcoal/55"
            }`}
          >
            {convertToLocale({
              amount: excluded,
              currency_code: currencyCode,
            })}{" "}
            in cart items does not count toward this offer.
          </p>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────
  // STATE: special — overnight (no free threshold applies)
  // ────────────────────────────────────────────────────────────────
  if (state.kind === "overnight") {
    return (
      <div
        className={`rounded-[5px] border px-4 py-3 ${containerBase} ${className}`}
        role="status"
      >
        <p
          className={`font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide ${
            isDark ? "text-white/55" : "text-Charcoal/60"
          }`}
        >
          Cart progress
        </p>
        <p className="mt-1 font-maison-neue text-sm font-semibold leading-snug">
          UPS Overnight is charged at the carrier rate.
        </p>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────
  // STATE: known ZIP, not yet qualified — progress bar + remaining
  // ────────────────────────────────────────────────────────────────
  const remainingMessage = state.isPlantPickup
    ? state.pickupBonusEarned
      ? "Pickup credit unlocked"
      : `${convertToLocale({
          amount: state.pickupBonusRemaining,
          currency_code: currencyCode,
        })} away from your pickup credit`
    : isSoutheastPickup && !seCreditQualified
      ? `${convertToLocale({
          amount: seCreditRemaining,
          currency_code: currencyCode,
        })} away from free pickup + ${convertToLocale({
          amount: SE_PICKUP_CREDIT_AMOUNT,
          currency_code: currencyCode,
        })} credit`
      : `${remainingLabel} away from free ${noun}`

  return (
    <div
      className={`rounded-[5px] border px-4 py-3 ${containerBase} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide ${
              isDark ? "text-white/55" : "text-Charcoal/60"
            }`}
          >
            Cart progress
          </p>
          <p className="mt-1 font-maison-neue text-sm font-semibold leading-snug">
            {remainingMessage}
          </p>
        </div>
        {thresholdLabel && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide ${
              isDark ? "bg-white/10 text-white/80" : "bg-Scroll text-Charcoal/70"
            }`}
            aria-hidden="true"
          >
            Free at {thresholdLabel}
          </span>
        )}
      </div>

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
        className={`mt-2 flex items-center justify-between gap-2 font-maison-neue text-xs leading-snug ${
          isDark ? "text-white/60" : "text-Charcoal/55"
        }`}
      >
        <span>
          {eta || `Subtotal ${convertToLocale({ amount: baseSubtotal, currency_code: currencyCode })}`}
          {eta && hasKnownZip && ` · ZIP ${effectivePostalCode}`}
        </span>
        {canEditZip && (
          <button
            type="button"
            onClick={() => {
              setZipInput(effectivePostalCode)
              setIsEditingZip(true)
            }}
            className={`shrink-0 underline underline-offset-2 transition-colors ${
              isDark ? "text-white hover:text-Gold" : "text-Charcoal hover:text-VibrantRed"
            }`}
          >
            Change ZIP
          </button>
        )}
      </div>

      {hasExcludedSubtotal && (
        <p
          className={`mt-2 font-maison-neue text-xs leading-snug ${
            isDark ? "text-white/55" : "text-Charcoal/55"
          }`}
        >
          {convertToLocale({
            amount: excluded,
            currency_code: currencyCode,
          })}{" "}
          in cart items does not count toward this offer.
        </p>
      )}
    </div>
  )
}
