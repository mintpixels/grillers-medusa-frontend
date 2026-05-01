import React from "react"
import { convertToLocale } from "@lib/util/money"

export const IN_REGION_STATES = [
  "GA",
  "TN",
  "TX",
  "NC",
  "FL",
  "SC",
  "AL",
] as const
export const IN_REGION_THRESHOLD = 250
export const NATIONAL_THRESHOLD = 500
export const PICKUP_BONUS_THRESHOLD = 150
export const PICKUP_BONUS_AMOUNT = 7.5

type FulfillmentType =
  | "ups_shipping"
  | "atlanta_delivery"
  | "southeast_pickup"
  | "plant_pickup"
  | string
  | null
  | undefined

type FreeShippingHelperProps = {
  subtotal?: number | null
  currencyCode?: string
  shipState?: string | null
  fulfillmentType?: FulfillmentType
  className?: string
  variant?: "light" | "dark"
}

const isInRegion = (st?: string | null) =>
  !!st && (IN_REGION_STATES as readonly string[]).includes(st.toUpperCase())

export const FreeShippingHelper: React.FC<FreeShippingHelperProps> = ({
  subtotal,
  currencyCode = "usd",
  shipState,
  fulfillmentType,
  className = "",
  variant = "light",
}) => {
  const sub = (subtotal ?? 0) / 100
  if (sub <= 0) return null

  let message: React.ReactNode = null
  let qualified = false

  if (fulfillmentType === "plant_pickup") {
    if (sub >= PICKUP_BONUS_THRESHOLD) {
      qualified = true
      message = (
        <>
          Pickup is always free —{" "}
          <strong>
            you've earned a $
            {PICKUP_BONUS_AMOUNT.toFixed(2)} pickup credit
          </strong>
          .
        </>
      )
    } else {
      const remaining = PICKUP_BONUS_THRESHOLD - sub
      message = (
        <>
          Pickup is always free. You're{" "}
          <strong>
            {convertToLocale({
              amount: Math.round(remaining * 100),
              currency_code: currencyCode,
            })}
          </strong>{" "}
          away from a $
          {PICKUP_BONUS_AMOUNT.toFixed(2)} pickup credit.
        </>
      )
    }
  } else if (isInRegion(shipState)) {
    if (sub >= IN_REGION_THRESHOLD) {
      qualified = true
      message = <>Your order qualifies for free delivery.</>
    } else {
      const remaining = IN_REGION_THRESHOLD - sub
      message = (
        <>
          You're{" "}
          <strong>
            {convertToLocale({
              amount: Math.round(remaining * 100),
              currency_code: currencyCode,
            })}
          </strong>{" "}
          away from <strong>free delivery</strong>.
        </>
      )
    }
  } else if (shipState) {
    if (sub >= NATIONAL_THRESHOLD) {
      qualified = true
      message = <>Your order ships free.</>
    } else {
      const remaining = NATIONAL_THRESHOLD - sub
      message = (
        <>
          You're{" "}
          <strong>
            {convertToLocale({
              amount: Math.round(remaining * 100),
              currency_code: currencyCode,
            })}
          </strong>{" "}
          away from <strong>free shipping</strong>.
        </>
      )
    }
  } else {
    message = (
      <>
        Free delivery on orders over $250 in our home region · Free shipping
        over $500 nationwide.
      </>
    )
  }

  const isDark = variant === "dark"
  const baseClasses = isDark
    ? qualified
      ? "text-emerald-300 bg-emerald-900/30 border border-emerald-500/30"
      : "text-gray-200 bg-gray-800/60 border border-gray-700"
    : qualified
      ? "text-emerald-700 bg-emerald-50/60 border border-emerald-200/60"
      : "text-Charcoal/70 bg-Scroll/50 border border-Charcoal/10"

  return (
    <div
      className={`text-xs font-maison-neue leading-snug ${baseClasses} rounded-md px-3 py-2 flex items-start gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      {qualified ? (
        <svg
          className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
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
      ) : (
        <svg
          className="w-4 h-4 shrink-0 mt-0.5 text-Gold"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h13l5 5v6h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3V7z"
          />
        </svg>
      )}
      <span>{message}</span>
    </div>
  )
}

export const CatchWeightBadge: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-maison-neue-mono uppercase tracking-wide text-Charcoal/60 bg-Scroll/70 rounded px-1.5 py-0.5 ${className}`}
    title="Sold by the pound — final price reflects actual weight"
  >
    <svg
      className="w-3 h-3 text-Gold"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h13l5 5v6h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3V7z"
      />
    </svg>
    Sold by the lb
  </span>
)

export const CartLevelEstimateNote: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <p
    className={`text-[11px] font-maison-neue text-Charcoal/55 leading-snug ${className}`}
  >
    Final charge may vary slightly from this estimate based on actual cut
    weights. Variance is typically 2–5%.
  </p>
)
