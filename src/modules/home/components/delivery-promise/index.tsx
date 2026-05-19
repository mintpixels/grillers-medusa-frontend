import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"
import DeliveryPromiseClient from "./client"

export type DeliveryZipSource = "cart" | "address" | "recent_order" | "saved"

export default async function DeliveryPromiseSection({
  countryCode,
  customerZip,
  customerZipSource,
  isLoggedIn = false,
}: {
  countryCode: string
  customerZip?: string | null
  customerZipSource?: DeliveryZipSource | null
  isLoggedIn?: boolean
}) {
  const savedZip = await getDeliveryZipCookie()
  const atlantaZipConfig = await getAtlantaDeliveryZipConfig()
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
