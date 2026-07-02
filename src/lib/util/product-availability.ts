export type ProductVariantAvailability = {
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  inventory_quantity?: number | null
}

export function isVariantPurchasable(
  variant: ProductVariantAvailability | null | undefined
) {
  if (!variant) return false
  if (variant.manage_inventory === false) return true
  if (variant.allow_backorder === true) return true

  const quantity = variant.inventory_quantity
  // Unobserved inventory (no numeric quantity) fails OPEN. The authoritative
  // oversell backstop is the server-side ATP gate in medusa-admin place-order,
  // which re-checks inventory before cart.complete and 409s unavailable lines.
  // Failing closed here turned every surface that doesn't enrich — or any
  // transient enrichment failure — into a store-wide false "Out of stock", so
  // the client gate is only an accurate UX hint when inventory is observed.
  if (typeof quantity !== "number") return true

  return quantity > 0
}

export function variantNeedsInventoryObservation(
  variant: ProductVariantAvailability | null | undefined
) {
  if (!variant) return false
  if (variant.manage_inventory === false) return false
  if (variant.allow_backorder === true) return false

  return typeof variant.inventory_quantity !== "number"
}
