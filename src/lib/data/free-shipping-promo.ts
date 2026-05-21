"use server"

import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { applyPromotions } from "./cart"
import type { FulfillmentType } from "@lib/util/free-shipping"
import {
  ALL_FREE_SHIP_CODES,
  pickFreeShippingCode,
} from "@lib/util/free-shipping-codes"
import { getAuthHeaders } from "./cookies"

/**
 * Make sure the cart has the correct free-shipping promotion code
 * applied for its current state. Removes any prior free-shipping codes
 * that no longer apply. Safe to call repeatedly — no-ops when the right
 * code is already on the cart.
 *
 * Returns the code that ended up on the cart (or `null` if none).
 */
export async function syncFreeShippingPromotion(
  cart: HttpTypes.StoreCart | null | undefined
): Promise<string | null> {
  if (!cart) return null

  const fulfillmentType = (cart.metadata?.fulfillmentType ||
    undefined) as FulfillmentType
  const shipState = cart.shipping_address?.province
  const subtotalDollars = (cart.subtotal ?? 0) / 100
  const currentCodes = (cart.promotions || [])
    .map((p) => p.code)
    .filter(Boolean) as string[]

  const desired = pickFreeShippingCode({
    eligibleSubtotalDollars: subtotalDollars,
    fulfillmentType,
    shipState,
  })

  const hasDesired = desired ? currentCodes.includes(desired) : false
  const lingeringFreeShip = currentCodes.filter(
    (c) => ALL_FREE_SHIP_CODES.includes(c) && c !== desired
  )

  if (hasDesired && lingeringFreeShip.length === 0) return desired
  if (!desired && lingeringFreeShip.length === 0) return null

  const nextCodes = [
    ...currentCodes.filter((c) => !ALL_FREE_SHIP_CODES.includes(c)),
    ...(desired ? [desired] : []),
  ]

  try {
    await applyPromotions(nextCodes)
    return desired
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[free-shipping-promo] could not apply free-shipping promo; ensure seed-free-shipping-promotions.ts has been run",
        err
      )
    }
    return null
  }
}

/**
 * Convenience: re-read the cart, then sync. Use from server actions that
 * just mutated the cart and want the freshest state.
 */
export async function syncFreeShippingPromotionByCartId(cartId: string) {
  const headers = { ...(await getAuthHeaders()) }
  const { cart } = await sdk.store.cart.retrieve(
    cartId,
    {
      fields: "*items, *shipping_address, *promotions, +subtotal, *metadata",
    },
    headers
  )
  return syncFreeShippingPromotion(cart as HttpTypes.StoreCart)
}
