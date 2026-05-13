import React from "react"
import { convertToLocale } from "@lib/util/money"
import {
  IN_REGION_STATES,
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
  PICKUP_BONUS_AMOUNT,
  PICKUP_BONUS_THRESHOLD,
  getFreeShippingState,
  type FulfillmentType,
} from "@lib/util/free-shipping"

// Re-export so existing call sites (`from "@modules/common/components/cart-helpers"`)
// keep working without touching imports. New code should import from
// `@lib/util/free-shipping` directly.
export {
  IN_REGION_STATES,
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
  PICKUP_BONUS_AMOUNT,
  PICKUP_BONUS_THRESHOLD,
} from "@lib/util/free-shipping"

type FreeShippingHelperProps = {
  subtotal?: number | null
  currencyCode?: string
  shipState?: string | null
  fulfillmentType?: FulfillmentType
  className?: string
  variant?: "light" | "dark"
}

export const FreeShippingHelper: React.FC<FreeShippingHelperProps> = ({
  subtotal,
  currencyCode = "usd",
  shipState,
  fulfillmentType,
  className = "",
  variant = "light",
}) => {
  const sub = subtotal ?? 0
  if (sub <= 0) return null

  const state = getFreeShippingState({ subtotal: sub, fulfillmentType, shipState })
  const { qualified, isPlantPickup } = state

  let message: React.ReactNode = null

  if (isPlantPickup) {
    message = state.pickupBonusEarned ? (
      <>
        Pickup is always free —{" "}
        <strong>
          you've earned a ${PICKUP_BONUS_AMOUNT.toFixed(2)} pickup credit
        </strong>
        .
      </>
    ) : (
      <>
        Pickup is always free. You're{" "}
        <strong>
          {convertToLocale({
            amount: state.pickupBonusRemaining,
            currency_code: currencyCode,
          })}
        </strong>{" "}
        away from a ${PICKUP_BONUS_AMOUNT.toFixed(2)} pickup credit.
      </>
    )
  } else if (state.kind === "overnight") {
    message = <>UPS Overnight is charged at the carrier rate.</>
  } else if (qualified) {
    message =
      state.kind === "national_ups" ? (
        <>Your order ships free.</>
      ) : (
        <>Your order qualifies for free delivery.</>
      )
  } else if (state.kind === "ambiguous") {
    message = (
      <>
        Free delivery on orders over $250 in our home region · Free shipping
        over $500 nationwide.
      </>
    )
  } else {
    const label =
      state.kind === "national_ups" ? (
        <strong>free shipping</strong>
      ) : (
        <strong>free delivery</strong>
      )
    message = (
      <>
        You're{" "}
        <strong>
          {convertToLocale({
            amount: state.remaining,
            currency_code: currencyCode,
          })}
        </strong>{" "}
        away from {label}.
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
