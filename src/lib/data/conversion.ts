"use server"

import { retrieveCart } from "@lib/data/cart"
import type { FulfillmentType } from "@lib/util/free-shipping"

export type CartConversionState = {
  subtotal: number
  currencyCode: string
  itemCount: number
  fulfillmentType: FulfillmentType
  shipState: string | null
  postalCode: string | null
}

export async function getCartConversionState(): Promise<CartConversionState> {
  const cart = await retrieveCart().catch(() => null)

  if (!cart) {
    return {
      subtotal: 0,
      currencyCode: "usd",
      itemCount: 0,
      fulfillmentType: null,
      shipState: null,
      postalCode: null,
    }
  }

  const metadata = (cart.metadata || {}) as Record<string, unknown>

  return {
    subtotal: cart.subtotal ?? 0,
    currencyCode: cart.currency_code || "usd",
    itemCount:
      cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
    fulfillmentType:
      typeof metadata.fulfillmentType === "string"
        ? metadata.fulfillmentType
        : null,
    shipState: cart.shipping_address?.province || null,
    postalCode: cart.shipping_address?.postal_code || null,
  }
}
