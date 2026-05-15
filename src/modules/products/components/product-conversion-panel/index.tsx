import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import {
  getFreeShippingState,
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
} from "@lib/util/free-shipping"
import { lookupUpsGroundDays } from "@lib/util/eligible-arrival-dates"
import type { CartConversionState } from "@lib/data/conversion"
import type { PurchaseHistoryItem } from "@lib/data/orders"

type ProductConversionPanelProps = {
  cartState?: CartConversionState | null
  selectedItemTotal?: number
  currencyCode?: string
  purchaseHistoryItem?: PurchaseHistoryItem | null
}

function formatDate(value?: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getEtaText(postalCode?: string | null): string {
  const zip = (postalCode || "").replace(/\D/g, "").slice(0, 5)
  if (zip.length !== 5) {
    return "Checkout confirms delivery or cold-chain shipping before payment."
  }
  const days = lookupUpsGroundDays(zip)
  return `Using ZIP ${zip}: UPS Ground estimate is ${days === 1 ? "1 business day" : `${days} business days`} in transit.`
}

export default function ProductConversionPanel({
  cartState,
  selectedItemTotal = 0,
  currencyCode = "usd",
  purchaseHistoryItem,
}: ProductConversionPanelProps) {
  const subtotal = cartState?.subtotal ?? 0
  const projectedSubtotal = subtotal + selectedItemTotal
  const state = getFreeShippingState({
    subtotal: projectedSubtotal,
    fulfillmentType: cartState?.fulfillmentType,
    shipState: cartState?.shipState,
  })
  const currentState = getFreeShippingState({
    subtotal,
    fulfillmentType: cartState?.fulfillmentType,
    shipState: cartState?.shipState,
  })

  const progress = state.threshold
    ? Math.min(100, Math.max(0, (projectedSubtotal / state.threshold) * 100))
    : state.qualified
      ? 100
      : 0
  const itemGetsThere =
    !currentState.qualified && state.qualified && selectedItemTotal > 0
  const freeLabel =
    state.kind === "national_ups" || state.kind === "ambiguous"
      ? "free shipping"
      : "free delivery"
  const thresholdLabel = state.threshold
    ? convertToLocale({ amount: state.threshold, currency_code: currencyCode })
    : null
  const remainingLabel =
    state.threshold && !state.qualified
      ? convertToLocale({ amount: state.remaining, currency_code: currencyCode })
      : null

  const lastOrdered = formatDate(purchaseHistoryItem?.lastOrderedAt)

  return (
    <div className="mb-5 space-y-3">
      {purchaseHistoryItem && (
        <div className="rounded-[5px] border border-Charcoal/15 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-VibrantRed">
                Ordered before
              </p>
              <p className="mt-1 font-maison-neue text-sm leading-snug text-Charcoal/70">
                {lastOrdered
                  ? `Last ordered ${lastOrdered}`
                  : "This item is in your order history"}
                {purchaseHistoryItem.timesOrdered > 1
                  ? ` - ${purchaseHistoryItem.timesOrdered} total orders`
                  : ""}
                .
              </p>
            </div>
            <LocalizedClientLink
              href="/account/reorder"
              className="inline-flex min-h-[44px] items-center rounded-[5px] border border-Charcoal px-3 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal transition-colors hover:bg-Charcoal hover:text-white"
            >
              Reorder list
            </LocalizedClientLink>
          </div>
        </div>
      )}

      <div className="rounded-[5px] border border-Charcoal/15 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal/60">
              Cart progress
            </p>
            <p className="mt-1 font-maison-neue text-sm font-semibold leading-snug text-Charcoal">
              {state.isPlantPickup
                ? state.pickupBonusEarned
                  ? "Pickup is free and the pickup credit is unlocked."
                  : `${convertToLocale({
                      amount: state.pickupBonusRemaining,
                      currency_code: currencyCode,
                    })} away from the pickup credit.`
                : state.qualified
                  ? itemGetsThere
                    ? `Adding this item unlocks ${freeLabel}.`
                    : `This cart qualifies for ${freeLabel}.`
                  : `${remainingLabel} away from ${freeLabel}.`}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-Scroll px-3 py-1 font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-Charcoal">
            {thresholdLabel
              ? `Free at ${thresholdLabel}`
              : state.isPlantPickup
                ? "Pickup"
                : "Carrier rate"}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-Charcoal/10">
          <div
            className="h-full rounded-full bg-Gold transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 grid gap-2 text-xs leading-snug text-Charcoal/60 sm:grid-cols-2">
          <p>
            Cart after this selection:{" "}
            <strong className="text-Charcoal">
              {convertToLocale({
                amount: projectedSubtotal,
                currency_code: currencyCode,
              })}
            </strong>
          </p>
          <p>{getEtaText(cartState?.postalCode)}</p>
        </div>
        {state.kind === "ambiguous" && (
          <p className="mt-2 font-maison-neue text-xs leading-snug text-Charcoal/50">
            Regional free delivery starts at ${IN_REGION_THRESHOLD}; nationwide
            UPS Ground starts at ${NATIONAL_THRESHOLD}.
          </p>
        )}
      </div>
    </div>
  )
}
