/**
 * Single source of truth for the "items only" subtotal shown in cart/checkout
 * summaries.
 *
 * Medusa's `cart.subtotal` INCLUDES `shipping_subtotal`, so rendering it on a
 * "Subtotal" line that sits above a separate "Shipping" line double-counts
 * shipping and makes the Subtotal equal the Total (shipping appears uncounted).
 * Every summary must use this helper so the breakdown is consistent:
 *
 *   Subtotal (items)  +  Shipping  +  Taxes  −  Discounts  =  Total
 *
 * `cart.total` already equals item_subtotal + shipping_total + tax − discount,
 * so it is correct as-is; only the displayed subtotal needs this.
 */
type ItemsSubtotalSource = {
  item_subtotal?: number | null
  item_total?: number | null
  subtotal?: number | null
}

export function getItemsSubtotal(
  source: ItemsSubtotalSource | null | undefined
): number {
  return source?.item_subtotal ?? source?.item_total ?? source?.subtotal ?? 0
}
