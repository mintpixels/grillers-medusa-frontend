import { convertToLocale } from "@lib/util/money"
import {
  getFreeShippingState,
  type FulfillmentType,
} from "@lib/util/free-shipping"
import { lookupUpsGroundDays } from "@lib/util/eligible-arrival-dates"
import {
  ATLANTA_DELIVERY_ZIP_DAYS,
  isAtlantaDeliveryZip,
} from "@lib/util/atlanta-delivery-zips"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"

type FulfillmentProgressProps = {
  subtotal?: number | null
  selectedItemTotal?: number
  currencyCode?: string
  fulfillmentType?: FulfillmentType
  shipState?: string | null
  postalCode?: string | null
  className?: string
  context?: "cart" | "pdp"
  variant?: "light" | "dark"
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function inferFulfillmentType(
  fulfillmentType: FulfillmentType,
  postalCode?: string | null
): FulfillmentType {
  if (fulfillmentType) return fulfillmentType
  if (isAtlantaDeliveryZip(postalCode)) return "atlanta_delivery"
  if (normalizeDeliveryZip(postalCode).length === 5) return "ups_shipping"
  return null
}

function fulfillmentLabel(kind: ReturnType<typeof getFreeShippingState>["kind"]): string {
  if (kind === "atlanta_delivery") return "free local delivery"
  if (kind === "southeast_pickup") return "free regional pickup"
  if (kind === "national_ups") return "free UPS Ground shipping"
  if (kind === "in_region_ups") return "the regional free-delivery threshold"
  return "free delivery or shipping"
}

function etaText(
  fulfillmentType: FulfillmentType,
  postalCode?: string | null
): string {
  const zip = normalizeDeliveryZip(postalCode)

  if (fulfillmentType === "plant_pickup") {
    return "Plant pickup is selected; checkout confirms your pickup slot before payment."
  }

  if (fulfillmentType === "southeast_pickup") {
    return "Regional pickup is selected; checkout confirms the pickup location and date before payment."
  }

  if (fulfillmentType === "atlanta_delivery" || isAtlantaDeliveryZip(zip)) {
    const route = ATLANTA_DELIVERY_ZIP_DAYS[zip]
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
  selectedItemTotal = 0,
  currencyCode = "usd",
  fulfillmentType,
  shipState,
  postalCode,
  className = "",
  context = "cart",
  variant = "light",
}: FulfillmentProgressProps) {
  const baseSubtotal = Math.max(0, subtotal ?? 0)
  const projectedSubtotal = baseSubtotal + selectedItemTotal
  const effectiveFulfillmentType = inferFulfillmentType(
    fulfillmentType,
    postalCode
  )
  const state = getFreeShippingState({
    subtotal: projectedSubtotal,
    fulfillmentType: effectiveFulfillmentType,
    shipState,
  })
  const currentState = getFreeShippingState({
    subtotal: baseSubtotal,
    fulfillmentType: effectiveFulfillmentType,
    shipState,
  })

  const progress = state.threshold
    ? Math.min(100, Math.max(0, (projectedSubtotal / state.threshold) * 100))
    : state.qualified
      ? 100
      : 0
  const itemGetsThere =
    context === "pdp" &&
    !currentState.qualified &&
    state.qualified &&
    selectedItemTotal > 0
  const thresholdLabel = state.threshold
    ? convertToLocale({ amount: state.threshold, currency_code: currencyCode })
    : null
  const remainingLabel =
    state.threshold && !state.qualified
      ? convertToLocale({ amount: state.remaining, currency_code: currencyCode })
      : null
  const freeLabel = fulfillmentLabel(state.kind)

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
      return "Enter your ZIP or choose fulfillment to see the right free threshold."
    }
    if (state.qualified) {
      return itemGetsThere
        ? `Adding this item unlocks ${freeLabel}.`
        : `This cart qualifies for ${freeLabel}.`
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
                : "ZIP needed"}
        </span>
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
        className={`mt-3 grid gap-2 text-xs leading-snug sm:grid-cols-2 ${
          isDark ? "text-white/60" : "text-Charcoal/60"
        }`}
      >
        <p>
          {context === "pdp" ? "Cart after this selection" : "Cart subtotal"}:{" "}
          <strong className={isDark ? "text-white" : "text-Charcoal"}>
            {convertToLocale({
              amount: projectedSubtotal,
              currency_code: currencyCode,
            })}
          </strong>
        </p>
        <p>{etaText(effectiveFulfillmentType, postalCode)}</p>
      </div>
    </div>
  )
}
