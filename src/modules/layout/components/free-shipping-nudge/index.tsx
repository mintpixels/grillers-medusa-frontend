"use client"

import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { useStorefrontSession } from "@modules/layout/components/storefront-session"

export default function StorefrontFreeShippingNudge() {
  const { cart, shippingOptions } = useStorefrontSession()

  if (!cart || !shippingOptions.length) {
    return null
  }

  return (
    <FreeShippingPriceNudge
      variant="popup"
      cart={cart}
      shippingOptions={shippingOptions}
    />
  )
}
