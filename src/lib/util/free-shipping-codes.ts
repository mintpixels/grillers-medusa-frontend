import {
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
  isInRegionState,
  type FulfillmentType,
} from "@lib/util/free-shipping"

/**
 * Promotion codes seeded by
 * `grillers-medusa-admin/src/scripts/seed-free-shipping-promotions.ts`.
 *
 * Kept in a plain util module (no "use server") so client components can
 * read them when deciding whether to render a "FREE" badge — the async
 * cart helpers live in `lib/data/free-shipping-promo.ts`.
 */
export const FREE_SHIP_IN_REGION_CODE = "GP_FREESHIP_INREGION"
export const FREE_SHIP_NATIONAL_CODE = "GP_FREESHIP_NATIONAL"
export const ALL_FREE_SHIP_CODES = [
  FREE_SHIP_IN_REGION_CODE,
  FREE_SHIP_NATIONAL_CODE,
]

/**
 * Pure decision: which (if any) free-shipping code should be on the cart
 * right now? Returns `null` when no qualifying free-shipping promo applies.
 */
export function pickFreeShippingCode(input: {
  eligibleSubtotalDollars: number
  fulfillmentType?: FulfillmentType
  shipState?: string | null
}): string | null {
  const sub = Math.max(0, input.eligibleSubtotalDollars || 0)
  const { fulfillmentType, shipState } = input

  // Pickup options are free at the carrier level — no shipping promo needed.
  if (
    fulfillmentType === "plant_pickup" ||
    fulfillmentType === "southeast_pickup"
  ) {
    return null
  }

  // Atlanta Delivery: in-region rule applies ($250).
  if (fulfillmentType === "atlanta_delivery") {
    return sub >= IN_REGION_THRESHOLD ? FREE_SHIP_IN_REGION_CODE : null
  }

  // Overnight is never free.
  if (fulfillmentType === "ups_overnight") {
    return null
  }

  // UPS Ground (or unspecified delivery): use the ship-state to pick threshold.
  if (isInRegionState(shipState)) {
    return sub >= IN_REGION_THRESHOLD ? FREE_SHIP_IN_REGION_CODE : null
  }

  if (shipState) {
    return sub >= NATIONAL_THRESHOLD ? FREE_SHIP_NATIONAL_CODE : null
  }

  return null
}
