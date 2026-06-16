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
import { getFreeDeliveryEligibleSubtotal } from "@lib/util/free-delivery-eligibility"
import { getFreeShippingThresholds } from "./strapi/checkout"
import { withTimeout } from "@lib/util/promise-timeout"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

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
  //
  // #265: gate the free-ship / pickup-credit promos on the FREE-DELIVERY
  // ELIGIBLE subtotal, not the raw cart subtotal. SKUs flagged
  // `metadata.free_delivery_eligible = false` (bulk/institutional packs,
  // large turkeys, etc.) must not advance the free-shipping threshold. This
  // is the authoritative gate that actually mutates the cart, so it has to
  // agree with the FulfillmentProgress UI (which already uses the eligible
  // subtotal). Requires `cart.items` to be populated — the retrieve `fields`
  // below request `*items`.
  const subtotalDollars = getFreeDeliveryEligibleSubtotal(cart.items)
  // #266: gate on the SAME Strapi-editable thresholds the UI shows, so the
  // applied free-ship/credit discount can't diverge from the displayed "$X
  // away". getFreeShippingThresholds safe-fails to {null,null} → constants.
  // Hot path (runs on every cart mutation): never let a slow Strapi block the
  // cart — time out fast and fall back to {null,null} → hardcoded constants.
  const { inRegionThreshold, nationalThreshold } = await withTimeout(
    getFreeShippingThresholds(),
    400,
    { inRegionThreshold: null, nationalThreshold: null },
    "free-ship promo thresholds"
  )
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
      inRegionThreshold,
      nationalThreshold,
    }),
    pickPlantPickupCredit({
      eligibleSubtotalDollars: subtotalDollars,
      fulfillmentType,
    }),
    pickSoutheastPickupCredit({
      eligibleSubtotalDollars: subtotalDollars,
      fulfillmentType,
      inRegionThreshold,
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
    const afterAutoCodes = afterCodes
      .filter((code): code is string => Boolean(code))
      .filter((code) => ALL_AUTO_APPLIED_CODES.includes(code))
      .sort()
    const expectedAutoCodes = [...desiredAutoCodes].sort()
    const appliedAsExpected =
      afterAutoCodes.length === expectedAutoCodes.length &&
      expectedAutoCodes.every((code, index) => code === afterAutoCodes[index])

    if (!appliedAsExpected) {
      // #251: promotion mismatches must land in the ops timeline.
      await emitStorefrontOpsAlert({
        alertKind: "free_shipping_promo_mismatch",
        title: `Auto promotion mismatch on cart ${cart.id}`,
        path: "src/lib/data/free-shipping-promo.ts",
        meta: {
          cart_id: cart.id,
          sent_codes: nextCodes,
          expected_auto_codes: expectedAutoCodes,
          attached_after: afterCodes,
          fulfillment_type: fulfillmentType || null,
          ship_state: shipState || null,
          destination_zip: destinationZip || null,
          subtotal_dollars: subtotalDollars,
        },
      })
      throw new Error(
        `Auto promotion mismatch after apply. Expected ${expectedAutoCodes.join(",") || "none"}; got ${afterAutoCodes.join(",") || "none"}.`
      )
    }

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
    const message = (err as any)?.message || String(err)
    console.error("[checkout-promos] sync failed:", message)
    // #251: apply failures are alert-worthy but never block the existing error path.
    await emitStorefrontOpsAlert({
      alertKind: "free_shipping_promo_apply_failed",
      title: `Auto promotion apply failed on cart ${cart.id}`,
      path: "src/lib/data/free-shipping-promo.ts",
      meta: {
        cart_id: cart.id,
        desired_auto_codes: desiredAutoCodes,
        current_auto_codes: currentAutoCodes,
        fulfillment_type: fulfillmentType || null,
        ship_state: shipState || null,
        destination_zip: destinationZip || null,
        subtotal_dollars: subtotalDollars,
        error: message,
      },
    })
    throw new Error(`Free-shipping promotion sync failed: ${message}`)
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
      // #265: include `*items.metadata` and per-item price fields so the
      // free-delivery-eligible subtotal can be computed (excluded SKUs are
      // flagged via line-item metadata).
      fields:
        "*items, *items.metadata, +items.subtotal, +items.unit_price, *shipping_address, *promotions, *shipping_methods, +subtotal, *metadata",
    },
    headers
  )
  return syncFreeShippingPromotion(cart as HttpTypes.StoreCart)
}
