import {
  ATLANTA_THRESHOLD,
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
  isInRegionState,
  resolveFreeShippingThreshold,
  type FulfillmentType,
} from "@lib/util/free-shipping"
import {
  isUpsGroundAvailableForZip,
  normalizeUpsServiceCode,
} from "@lib/util/eligible-arrival-dates"

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
 * Plant Pickup credit — a flat $7.50 incentive over $150.
 * The threshold can be overridden via Strapi `shippingSetting.PlantPickupDiscountThreshold`,
 * but we hardcode the default here so server-side promo sync stays cheap.
 */
export const PLANT_PICKUP_CREDIT_CODE = "PLANTPICKUP750"
export const PLANT_PICKUP_CREDIT_AMOUNT = 7.5
export const PLANT_PICKUP_CREDIT_THRESHOLD = 150

export function pickPlantPickupCredit(input: {
  eligibleSubtotalDollars: number
  fulfillmentType?: FulfillmentType
}): string | null {
  const sub = Math.max(0, input.eligibleSubtotalDollars || 0)
  if (input.fulfillmentType !== "plant_pickup") return null
  return sub >= PLANT_PICKUP_CREDIT_THRESHOLD ? PLANT_PICKUP_CREDIT_CODE : null
}

/**
 * Southeast Pickup credit — a flat $20 incentive applied when the
 * customer picks Southeast Pickup AND the cart subtotal qualifies them
 * for the in-region free-ship promo ($350). The route is dramatically
 * cheaper than cold UPS, so we share part of the savings back. The SE
 * credit threshold tracks the in-region threshold (so it moved $250 → $350
 * together).
 */
export const SE_PICKUP_CREDIT_CODE = "GP_SE_PICKUP_CREDIT"
export const SE_PICKUP_CREDIT_AMOUNT = 20
export const SE_PICKUP_CREDIT_THRESHOLD = IN_REGION_THRESHOLD

export function pickSoutheastPickupCredit(input: {
  eligibleSubtotalDollars: number
  fulfillmentType?: FulfillmentType
  /** #266: Strapi-editable in-region threshold; null/invalid → constant. */
  inRegionThreshold?: number | null
}): string | null {
  const sub = Math.max(0, input.eligibleSubtotalDollars || 0)
  if (input.fulfillmentType !== "southeast_pickup") return null
  const threshold = resolveFreeShippingThreshold(
    input.inRegionThreshold,
    SE_PICKUP_CREDIT_THRESHOLD
  )
  return sub >= threshold ? SE_PICKUP_CREDIT_CODE : null
}

/**
 * All auto-applied checkout promotion codes — never surfaced as
 * removable chips in the discount-code UI.
 */
export const ALL_AUTO_APPLIED_CODES = [
  ...ALL_FREE_SHIP_CODES,
  PLANT_PICKUP_CREDIT_CODE,
  SE_PICKUP_CREDIT_CODE,
]

export function isUpsServiceEligibleForFreeShipping(input: {
  serviceCode?: string | null
  destinationZip?: string | null
}): boolean {
  const serviceCode = normalizeUpsServiceCode(input.serviceCode)
  if (!serviceCode) return false
  if (serviceCode === "OVERNIGHT") return false

  const zip = (input.destinationZip || "").trim()
  const groundAvailable = zip ? isUpsGroundAvailableForZip(zip) : true

  if (groundAvailable) {
    return serviceCode === "GROUND"
  }

  // When Ground is not cold-chain-safe for the destination, UPS 3 Day Select is
  // the cheapest modeled expedited baseline. 2nd Day and Overnight remain paid
  // premium services.
  return serviceCode === "3_DAY_SELECT"
}

/**
 * Pure decision: which (if any) free-shipping code should be on the cart
 * right now? Returns `null` when no qualifying free-shipping promo applies.
 */
export function pickFreeShippingCode(input: {
  eligibleSubtotalDollars: number
  fulfillmentType?: FulfillmentType
  shipState?: string | null
  destinationZip?: string | null
  selectedUpsServiceCode?: string | null
  /** #266: Strapi-editable thresholds; null/invalid → constants. Threaded so
   * the applied discount matches what the UI shows the customer. */
  inRegionThreshold?: number | null
  nationalThreshold?: number | null
  /** Atlanta home-delivery threshold; null/invalid → ATLANTA_THRESHOLD ($250).
   * Atlanta delivery keeps the lower local threshold, unlike southeast pickup /
   * in-region UPS which use inRegionThreshold ($350). */
  atlantaThreshold?: number | null
}): string | null {
  const sub = Math.max(0, input.eligibleSubtotalDollars || 0)
  const {
    fulfillmentType,
    shipState,
    destinationZip,
    selectedUpsServiceCode,
  } = input
  const inRegionT = resolveFreeShippingThreshold(
    input.inRegionThreshold,
    IN_REGION_THRESHOLD
  )
  const nationalT = resolveFreeShippingThreshold(
    input.nationalThreshold,
    NATIONAL_THRESHOLD
  )
  const atlantaT = resolveFreeShippingThreshold(
    input.atlantaThreshold,
    ATLANTA_THRESHOLD
  )

  // Plant Pickup is unconditionally free at the carrier level.
  if (fulfillmentType === "plant_pickup") {
    return null
  }

  // Southeast Pickup carries a per-customer route share below $350. Above
  // $350 the route fee is waived (in-region rule applies), and the $20
  // pickup credit (GP_SE_PICKUP_CREDIT) stacks on top via its own promo.
  if (fulfillmentType === "southeast_pickup") {
    return sub >= inRegionT ? FREE_SHIP_IN_REGION_CODE : null
  }

  // Atlanta Delivery: local-delivery rule applies ($250) — keeps the lower
  // threshold rather than the in-region ($350) one.
  if (fulfillmentType === "atlanta_delivery") {
    return sub >= atlantaT ? FREE_SHIP_IN_REGION_CODE : null
  }

  // Overnight is never free.
  if (fulfillmentType === "ups_overnight") {
    return null
  }

  if (
    fulfillmentType === "ups_shipping" &&
    selectedUpsServiceCode &&
    !isUpsServiceEligibleForFreeShipping({
      serviceCode: selectedUpsServiceCode,
      destinationZip,
    })
  ) {
    return null
  }

  // UPS Ground (or unspecified delivery): use the ship-state to pick threshold.
  if (isInRegionState(shipState)) {
    return sub >= inRegionT ? FREE_SHIP_IN_REGION_CODE : null
  }

  if (shipState) {
    return sub >= nationalT ? FREE_SHIP_NATIONAL_CODE : null
  }

  return null
}
