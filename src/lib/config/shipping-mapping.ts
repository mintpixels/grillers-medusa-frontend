import type { FulfillmentType } from "@lib/data/cart"

/**
 * Maps Medusa service codes (from GrillersFulfillmentProviderService) to frontend fulfillment types.
 * 
 * Medusa Backend Service Codes:
 * - PICKUP: "Pickup From Plant Premises in Atlanta, GA"
 * - ATLANTA_DELIVERY: "Metro Atlanta Delivery"
 * - SCHEDULED_DELIVERY: "Scheduled Delivery" (Southeast pickup locations)
 * - GROUND: "Ground Estimated Shipping"
 * - 3_DAY_SELECT: "UPS 3 Day Select Estimated Shipping"
 * - 2ND_DAY_AIR: "UPS 2nd Day Air Estimated Shipping"
 * - OVERNIGHT: "Overnight Estimated Shipping"
 */
export const SERVICE_CODE_TO_FULFILLMENT: Record<string, FulfillmentType> = {
  "PICKUP": "plant_pickup",
  "ATLANTA_DELIVERY": "atlanta_delivery",
  "SCHEDULED_DELIVERY": "southeast_pickup",
  "GROUND": "ups_shipping",
  "3_DAY_SELECT": "ups_shipping",
  "2ND_DAY_AIR": "ups_shipping",
  "OVERNIGHT": "ups_shipping",
}

/**
 * Reverse mapping: frontend fulfillment type to valid Medusa service codes.
 * Used when we need to find the Medusa shipping option for a user's selection.
 */
export const FULFILLMENT_TO_SERVICE_CODES: Record<FulfillmentType, string[]> = {
  "plant_pickup": ["PICKUP"],
  "atlanta_delivery": ["ATLANTA_DELIVERY"],
  "southeast_pickup": ["SCHEDULED_DELIVERY"],
  "ups_shipping": ["GROUND", "3_DAY_SELECT", "2ND_DAY_AIR", "OVERNIGHT"],
}

/**
 * Display order for fulfillment options in the UI
 */
export const FULFILLMENT_DISPLAY_ORDER: FulfillmentType[] = [
  "ups_shipping",
  "atlanta_delivery",
  "plant_pickup",
  "southeast_pickup",
]
