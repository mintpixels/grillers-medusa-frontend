import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { normalizeDeliveryZip } from "@lib/util/delivery-zip"
import DeliveryPromiseClient from "./client"

export default async function DeliveryPromiseSection({
  countryCode,
  customerZip,
  isLoggedIn = false,
}: {
  countryCode: string
  customerZip?: string | null
  isLoggedIn?: boolean
}) {
  const savedZip = await getDeliveryZipCookie()
  const atlantaZipConfig = await getAtlantaDeliveryZipConfig()
  const initialZip = normalizeDeliveryZip(customerZip) || savedZip

  return (
    <DeliveryPromiseClient
      countryCode={countryCode}
      atlantaZipCodes={Object.keys(atlantaZipConfig)}
      initialZip={initialZip}
      isLoggedIn={isLoggedIn}
    />
  )
}
