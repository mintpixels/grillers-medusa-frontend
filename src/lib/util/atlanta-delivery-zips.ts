import type { AtlantaZipDayConfig } from "@lib/util/eligible-arrival-dates"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"

// Hardcoded until the Strapi fulfillment schema owns the route table.
// Kept client-safe because PDP/cart progress needs to classify a saved
// delivery ZIP before checkout has a full shipping address.
export const ATLANTA_DELIVERY_ZIP_DAYS: Record<string, AtlantaZipDayConfig> = {
  // Sandy Springs / Dunwoody / North Atlanta - Tuesday route
  "30328": { weekdays: [2], cutoffHour: 12 },
  "30338": { weekdays: [2], cutoffHour: 12 },
  "30342": { weekdays: [2], cutoffHour: 12 },
  "30350": { weekdays: [2], cutoffHour: 12 },
  "30319": { weekdays: [2], cutoffHour: 12 },
  "30327": { weekdays: [2], cutoffHour: 12 },
  // Toco Hills / Decatur / Druid Hills - Wednesday route
  "30329": { weekdays: [3], cutoffHour: 12 },
  "30033": { weekdays: [3], cutoffHour: 12 },
  "30030": { weekdays: [3], cutoffHour: 12 },
  "30306": { weekdays: [3], cutoffHour: 12 },
  "30307": { weekdays: [3], cutoffHour: 12 },
  "30324": { weekdays: [3], cutoffHour: 12 },
  // Buckhead / Brookhaven - Wednesday route
  "30305": { weekdays: [3], cutoffHour: 12 },
  "30326": { weekdays: [3], cutoffHour: 12 },
  // Marietta / East Cobb - Thursday route
  "30062": { weekdays: [4], cutoffHour: 12 },
  "30068": { weekdays: [4], cutoffHour: 12 },
  "30067": { weekdays: [4], cutoffHour: 12 },
}

export function isAtlantaDeliveryZip(zip?: string | null): boolean {
  const normalized = normalizeDeliveryZip(zip)
  return Boolean(normalized && ATLANTA_DELIVERY_ZIP_DAYS[normalized])
}
