import { ATLANTA_DELIVERY_ZIP_DAYS } from "@lib/data/strapi/checkout"
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
  const initialZip = normalizeDeliveryZip(customerZip) || savedZip

  return (
    <DeliveryPromiseClient
      countryCode={countryCode}
      atlantaZipCodes={Object.keys(ATLANTA_DELIVERY_ZIP_DAYS)}
      initialZip={initialZip}
      isLoggedIn={isLoggedIn}
    />
  )
}
