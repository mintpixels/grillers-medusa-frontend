"use client"

import DeliveryPromiseClient from "@modules/home/components/delivery-promise/client"
import { useStorefrontSession } from "@modules/layout/components/storefront-session"
import type { FreeShippingThresholdOverrides } from "@lib/util/free-shipping"

export default function DeliveryPromiseSession({
  countryCode,
  atlantaZipCodes,
  freeShippingThresholds,
}: {
  countryCode: string
  atlantaZipCodes: string[]
  freeShippingThresholds?: FreeShippingThresholdOverrides
}) {
  const { customer, deliveryZip, deliveryZipSource } = useStorefrontSession()

  return (
    <DeliveryPromiseClient
      countryCode={countryCode}
      atlantaZipCodes={atlantaZipCodes}
      initialZip={deliveryZip}
      initialZipSource={deliveryZipSource}
      isLoggedIn={Boolean(customer)}
      freeShippingThresholds={freeShippingThresholds}
    />
  )
}
