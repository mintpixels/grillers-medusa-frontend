"use client"

import { useCallback, useEffect, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { AtlantaZipDayConfig } from "@lib/util/eligible-arrival-dates"
import {
  CART_UPDATED_EVENT,
  type CartUpdatedDetail,
} from "@lib/util/cart-events"
import {
  STOREFRONT_SESSION_UPDATED_EVENT,
  type StorefrontSessionUpdatedDetail,
} from "@lib/util/storefront-session-events"
import type { CartProductDetailsMap } from "@lib/util/cart-product-details"
import type { CartUpsellProduct } from "@modules/cart/components/cart-upsells/types"
import { useCart } from "./cart-context"
import SideCart from "./index"

type SideCartPayload = {
  cart: HttpTypes.StoreCart | null
  upsellProducts: CartUpsellProduct[]
  countryCode: string
  atlantaZipConfig?: Record<string, AtlantaZipDayConfig>
  initialDeliveryZip?: string | null
  productDetailsMap: CartProductDetailsMap
  /** #266: Strapi-editable UPS free-shipping thresholds. Null → constants. */
  inRegionThreshold?: number | null
  nationalThreshold?: number | null
}

const emptyPayload = (countryCode: string): SideCartPayload => ({
  cart: null,
  upsellProducts: [],
  countryCode,
  atlantaZipConfig: undefined,
  initialDeliveryZip: null,
  productDetailsMap: {},
  inRegionThreshold: null,
  nationalThreshold: null,
})

export default function SideCartWrapper({
  countryCode = "us",
}: {
  countryCode?: string
}) {
  const { isOpen } = useCart()
  const [payload, setPayload] = useState<SideCartPayload>(() =>
    emptyPayload(countryCode)
  )
  const [isLoading, setIsLoading] = useState(false)

  const refreshSideCart = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/storefront/side-cart?countryCode=${encodeURIComponent(
          countryCode
        )}`,
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      )

      if (!response.ok) return

      const nextPayload = (await response.json()) as SideCartPayload
      setPayload(nextPayload)
    } finally {
      setIsLoading(false)
    }
  }, [countryCode])

  useEffect(() => {
    if (isOpen) {
      void refreshSideCart()
    }
  }, [isOpen, refreshSideCart])

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail
      if (!detail?.action) return
      void refreshSideCart()
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    return () =>
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
  }, [refreshSideCart])

  useEffect(() => {
    const handleSessionUpdated = (event: Event) => {
      const detail = (event as CustomEvent<StorefrontSessionUpdatedDetail>)
        .detail
      if (!detail?.reason) return

      setPayload(emptyPayload(countryCode))
      if (isOpen) {
        void refreshSideCart()
      }
    }

    window.addEventListener(
      STOREFRONT_SESSION_UPDATED_EVENT,
      handleSessionUpdated
    )
    return () =>
      window.removeEventListener(
        STOREFRONT_SESSION_UPDATED_EVENT,
        handleSessionUpdated
      )
  }, [countryCode, isOpen, refreshSideCart])

  return <SideCart {...payload} isLoading={isLoading && isOpen} />
}
