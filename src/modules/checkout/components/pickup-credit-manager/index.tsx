"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { applyPromotions, type FulfillmentType } from "@lib/data/cart"
import type { PickupCreditConfig } from "@lib/data/strapi/checkout"

type PickupCreditManagerProps = {
  cart: HttpTypes.StoreCart
  pickupCreditConfig: PickupCreditConfig
}

/**
 * Watches the cart state and auto-applies or removes the plant pickup
 * credit promotion code based on fulfillment type and subtotal threshold.
 *
 * NOTE: When updating the credit amount in Strapi's ShippingSetting,
 * you must also update the corresponding Medusa promotion amount to match.
 */
export default function PickupCreditManager({ cart, pickupCreditConfig }: PickupCreditManagerProps) {
  const router = useRouter()
  const isApplying = useRef(false)

  const fulfillmentType = cart.metadata?.fulfillmentType as FulfillmentType | undefined
  const isPlantPickup = fulfillmentType === "plant_pickup"
  const subtotal = cart.subtotal ?? 0
  const qualifies = isPlantPickup && subtotal >= pickupCreditConfig.threshold
  const promoCode = pickupCreditConfig.promoCode

  const existingCodes = (cart.promotions || [])
    .map((p: any) => p.code as string)
    .filter(Boolean)
  const hasPickupCredit = existingCodes.includes(promoCode)

  useEffect(() => {
    if (isApplying.current) return

    const needsApply = qualifies && !hasPickupCredit
    const needsRemove = !qualifies && hasPickupCredit

    if (!needsApply && !needsRemove) return

    isApplying.current = true

    const updatePromos = async () => {
      try {
        if (needsApply) {
          await applyPromotions([...existingCodes, promoCode])
        } else if (needsRemove) {
          await applyPromotions(existingCodes.filter((c) => c !== promoCode))
        }
        router.refresh()
      } catch {
        // Promo code may not exist yet in Medusa -- silently ignore
      } finally {
        isApplying.current = false
      }
    }

    updatePromos()
  }, [qualifies, hasPickupCredit, existingCodes, promoCode, router])

  return null
}
