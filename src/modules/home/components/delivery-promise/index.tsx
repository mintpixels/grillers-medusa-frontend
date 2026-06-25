import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getFreeShippingThresholds } from "@lib/data/strapi/checkout"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"
import DeliveryPromiseClient from "./client"
import DeliveryPromiseSession from "@modules/home/components/delivery-promise-session"
import type { FreeShippingThresholdOverrides } from "@lib/util/free-shipping"

export type DeliveryZipSource = "cart" | "address" | "recent_order" | "saved"

export default async function DeliveryPromiseSection({
  countryCode,
  customerZip,
  customerZipSource,
  isLoggedIn = false,
  useStorefrontSession = false,
  freeShippingThresholds,
}: {
  countryCode: string
  customerZip?: string | null
  customerZipSource?: DeliveryZipSource | null
  isLoggedIn?: boolean
  useStorefrontSession?: boolean
  freeShippingThresholds?: FreeShippingThresholdOverrides
}) {
  const [atlantaZipConfig, resolvedThresholds] = await Promise.all([
    getAtlantaDeliveryZipConfig(),
    freeShippingThresholds
      ? Promise.resolve(freeShippingThresholds)
      : getFreeShippingThresholds(),
  ])

  if (useStorefrontSession) {
    return (
      <DeliveryPromiseSession
        countryCode={countryCode}
        atlantaZipCodes={Object.keys(atlantaZipConfig)}
        freeShippingThresholds={resolvedThresholds}
      />
    )
  }

  const savedZip = await getDeliveryZipCookie()
  const normalizedCustomerZip = normalizeDeliveryZip(customerZip)
  const normalizedSavedZip = normalizeDeliveryZip(savedZip)
  const initialZip = normalizedCustomerZip || normalizedSavedZip
  const initialZipSource = normalizedCustomerZip
    ? customerZipSource || "address"
    : normalizedSavedZip
    ? "saved"
    : null

  return (
    <DeliveryPromiseClient
      countryCode={countryCode}
      atlantaZipCodes={Object.keys(atlantaZipConfig)}
      initialZip={initialZip}
      initialZipSource={initialZipSource}
      isLoggedIn={isLoggedIn}
      freeShippingThresholds={resolvedThresholds}
    />
  )
}
