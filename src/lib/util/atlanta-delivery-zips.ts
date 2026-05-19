import type { AtlantaZipDayConfig } from "@lib/util/eligible-arrival-dates"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"

// Defensive fallback for the Strapi-owned route table. Kept client-safe
// because PDP/cart progress needs to classify a saved delivery ZIP before
// checkout has a full shipping address.
export const ATLANTA_DELIVERY_ZIP_DAYS: Record<string, AtlantaZipDayConfig> = {
  "30005": { weekdays: [2], cutoffHour: 12 },
  "30009": { weekdays: [2], cutoffHour: 12 },
  "30022": { weekdays: [2], cutoffHour: 12 },
  "30033": { weekdays: [3], cutoffHour: 12 },
  "30062": { weekdays: [2], cutoffHour: 12 },
  "30067": { weekdays: [2], cutoffHour: 12 },
  "30068": { weekdays: [2], cutoffHour: 12 },
  "30071": { weekdays: [2], cutoffHour: 12 },
  "30075": { weekdays: [2], cutoffHour: 12 },
  "30079": { weekdays: [3], cutoffHour: 12 },
  "30092": { weekdays: [2], cutoffHour: 12 },
  "30093": { weekdays: [2], cutoffHour: 12 },
  "30097": { weekdays: [2], cutoffHour: 12 },
  "30319": { weekdays: [3], cutoffHour: 12 },
  "30322": { weekdays: [3], cutoffHour: 12 },
  "30324": { weekdays: [3], cutoffHour: 12 },
  "30326": { weekdays: [3], cutoffHour: 12 },
  "30327": { weekdays: [3], cutoffHour: 12 },
  "30328": { weekdays: [2], cutoffHour: 12 },
  "30329": { weekdays: [3], cutoffHour: 12 },
  "30338": { weekdays: [2], cutoffHour: 12 },
  "30339": { weekdays: [2], cutoffHour: 12 },
  "30340": { weekdays: [3], cutoffHour: 12 },
  "30341": { weekdays: [3], cutoffHour: 12 },
  "30342": { weekdays: [3], cutoffHour: 12 },
  "30345": { weekdays: [3], cutoffHour: 12 },
  "30346": { weekdays: [3], cutoffHour: 12 },
  "30350": { weekdays: [2], cutoffHour: 12 },
  "30360": { weekdays: [2], cutoffHour: 12 },
}

export function isAtlantaDeliveryZip(zip?: string | null): boolean {
  const normalized = normalizeDeliveryZip(zip)
  return Boolean(normalized && ATLANTA_DELIVERY_ZIP_DAYS[normalized])
}
