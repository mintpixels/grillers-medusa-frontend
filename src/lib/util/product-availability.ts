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
  if (typeof quantity !== "number") return false

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
