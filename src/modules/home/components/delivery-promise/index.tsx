import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"
import DeliveryPromiseClient from "./client"
import DeliveryPromiseSession from "@modules/home/components/delivery-promise-session"

export type DeliveryZipSource = "cart" | "address" | "recent_order" | "saved"

export default async function DeliveryPromiseSection({
  countryCode,
  customerZip,
  customerZipSource,
  isLoggedIn = false,
  useStorefrontSession = false,
}: {
  countryCode: string
  customerZip?: string | null
  customerZipSource?: DeliveryZipSource | null
  isLoggedIn?: boolean
  useStorefrontSession?: boolean
}) {
  const atlantaZipConfig = await getAtlantaDeliveryZipConfig()

  if (useStorefrontSession) {
    return (
      <DeliveryPromiseSession
        countryCode={countryCode}
        atlantaZipCodes={Object.keys(atlantaZipConfig)}
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
    />
  )
}
