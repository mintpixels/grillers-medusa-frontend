"use client"

import DeliveryPromiseClient from "@modules/home/components/delivery-promise/client"
import { useStorefrontSession } from "@modules/layout/components/storefront-session"

export default function DeliveryPromiseSession({
  countryCode,
  atlantaZipCodes,
}: {
  countryCode: string
  atlantaZipCodes: string[]
}) {
  const { customer, deliveryZip, deliveryZipSource } = useStorefrontSession()

  return (
    <DeliveryPromiseClient
      countryCode={countryCode}
      atlantaZipCodes={atlantaZipCodes}
      initialZip={deliveryZip}
      initialZipSource={deliveryZipSource}
      isLoggedIn={Boolean(customer)}
    />
  )
}
