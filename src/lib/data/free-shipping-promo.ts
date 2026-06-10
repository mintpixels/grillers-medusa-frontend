"use server"

import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { applyPromotions } from "./cart"
import type { FulfillmentType } from "@lib/util/free-shipping"
import {
  ALL_AUTO_APPLIED_CODES,
  pickFreeShippingCode,
  pickPlantPickupCredit,
  pickSoutheastPickupCredit,
} from "@lib/util/free-shipping-codes"
import { getAuthHeaders } from "./cookies"
import { normalizeUpsServiceCode } from "@lib/util/eligible-arrival-dates"

function selectedUpsServiceCode(cart: HttpTypes.StoreCart): string | null {
  const method = cart.shipping_methods?.at(-1) as
    | (HttpTypes.StoreCartShippingMethod & {
        data?: { service_code?: string }
        service_code?: string
        shipping_option?: {
          name?: string
          data?: { service_code?: string }
          service_code?: string
        }
      })
    | undefined

  return (
    normalizeUpsServiceCode(
      method?.data?.service_code ||
        method?.service_code ||
        method?.shipping_option?.data?.service_code ||
        method?.shipping_option?.service_code ||
        method?.shipping_option?.name ||
        method?.name
    ) || null
  )
}

/**
 * Compute the full set of auto-applied promotion codes that should be on
 * the cart given its current fulfillment + subtotal + ship-state. This
 * runs server-side as part of every cart mutation, so by the time the
 * client receives the response, all of free-ship, plant pickup credit,
 * and SE pickup credit are settled in a single round-trip — no
 * follow-up client-side cascade that flashes the order summary after
 * the loading state ends.
 *
 * Returns the codes that ended up on the cart.
 */
export async function syncFreeShippingPromotion(
  cart: HttpTypes.StoreCart | null | undefined
): Promise<string[]> {
  if (!cart) return []

  const fulfillmentType = (cart.metadata?.fulfillmentType ||
    undefined) as FulfillmentType
  const shipState = cart.shipping_address?.province
  const destinationZip = cart.shipping_address?.postal_code
  const selectedServiceCode = selectedUpsServiceCode(cart)
  // Medusa v2 store-API returns monetary fields as decimal dollars (e.g.
  // 1590.73), NOT cents. Do not divide by 100.
  const subtotalDollars = cart.subtotal ?? 0
  const currentCodes = (cart.promotions || [])
    .map((p) => p.code)
    .filter(Boolean) as string[]

  const desiredAutoCodes = [
    pickFreeShippingCode({
      eligibleSubtotalDollars: subtotalDollars,
      fulfillmentType,
      shipState,
      destinationZip,
      selectedUpsServiceCode: selectedServiceCode,
    }),
    pickPlantPickupCredit({
      eligibleSubtotalDollars: subtotalDollars,
      fulfillmentType,
    }),
    pickSoutheastPickupCredit({
      eligibleSubtotalDollars: subtotalDollars,
      fulfillmentType,
    }),
  ].filter(Boolean) as string[]

  // Customer-applied codes (not in our auto-applied set) should be preserved.
  const customerCodes = currentCodes.filter(
    (c) => !ALL_AUTO_APPLIED_CODES.includes(c)
  )
  const currentAutoCodes = currentCodes.filter((c) =>
    ALL_AUTO_APPLIED_CODES.includes(c)
  )

  const desiredSorted = [...desiredAutoCodes].sort()
  const currentAutoSorted = [...currentAutoCodes].sort()
  const noChange =
    desiredSorted.length === currentAutoSorted.length &&
    desiredSorted.every((c, i) => c === currentAutoSorted[i])

  if (noChange) return desiredAutoCodes

  const nextCodes = [...customerCodes, ...desiredAutoCodes]

  try {
    await applyPromotions(nextCodes)
    const headers = { ...(await getAuthHeaders()) }
    const { cart: after } = await sdk.store.cart.retrieve(
      cart.id,
      {
        fields:
          "*items, *shipping_address, *promotions, *shipping_methods, +subtotal, +shipping_total, +shipping_subtotal, +discount_total, *metadata",
      },
      headers
    )
    const afterCodes = (after?.promotions || []).map((p) => p.code)
    console.log(
      "[checkout-promos] sync:",
      JSON.stringify({
        sent: nextCodes,
        attachedAfter: afterCodes,
        shippingTotal: (after as any)?.shipping_total,
        discountTotal: (after as any)?.discount_total,
      })
    )
    return desiredAutoCodes
  } catch (err) {
    console.warn(
      "[checkout-promos] applyPromotions threw:",
      (err as any)?.message || err
    )
    return []
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
      fields:
        "*items, *shipping_address, *promotions, *shipping_methods, +subtotal, *metadata",
    },
    headers
  )
  return syncFreeShippingPromotion(cart as HttpTypes.StoreCart)
}
