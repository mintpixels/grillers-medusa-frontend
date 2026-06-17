import type { FulfillmentType } from "@lib/data/cart"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"

/**
 * Region-based eligibility for the four fulfillment methods.
 *
 * This is the geographic half of the rule the fulfillment selector already
 * encodes (see `availability` in fulfillment-step/index.tsx): UPS shipping and
 * Atlanta local delivery are MUTUALLY EXCLUSIVE — UPS is for out-of-region
 * destinations, Atlanta delivery is for Atlanta-area ZIPs only. We deliberately
 * ignore cart-total minimums here: a minimum shortfall is an "add $X more"
 * nudge, not an address-change invalidation, and clearing a method because the
 * cart dipped under a threshold would be wrong.
 *
 * Pickups (plant + Southeast) are address-independent once chosen: anyone can
 * drive to the plant, and a Southeast pickup keeps the pickup LOCATION the
 * customer selected regardless of what billing/contact ZIP they later edit. So
 * they are always region-valid here.
 *
 * Client-safe: only depends on the (type-erased) FulfillmentType type and the
 * pure ZIP normalizer.
 */

/** Whole-ZIP membership test against the active Atlanta delivery ZIP list. */
export function isAtlantaZip(
  zip: string | null | undefined,
  atlantaZipCodes: string[]
): boolean {
  const normalized = normalizeDeliveryZip(zip)
  if (normalized.length !== 5) return false
  return atlantaZipCodes.some((z) => normalizeDeliveryZip(z) === normalized)
}

/**
 * Returns whether a chosen `fulfillmentType` is still valid for a destination
 * `zip`. When the ZIP is unknown/incomplete we return `true` — never block
 * before we actually know the destination.
 */
export function isFulfillmentTypeRegionValid(
  fulfillmentType: FulfillmentType | null | undefined,
  zip: string | null | undefined,
  { atlantaZipCodes }: { atlantaZipCodes: string[] }
): boolean {
  if (!fulfillmentType) return true
  const normalized = normalizeDeliveryZip(zip)
  if (normalized.length !== 5) return true

  const inAtlanta = isAtlantaZip(normalized, atlantaZipCodes)
  switch (fulfillmentType) {
    case "ups_shipping":
      // UPS targets out-of-region delivery; inside the Atlanta delivery area
      // customers use local delivery or pickup instead.
      return !inAtlanta
    case "atlanta_delivery":
      return inAtlanta
    case "plant_pickup":
    case "southeast_pickup":
      // Pickups don't depend on the delivery address.
      return true
    default:
      return true
  }
}
