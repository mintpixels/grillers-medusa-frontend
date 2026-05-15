import { ATLANTA_DELIVERY_ZIP_DAYS } from "@lib/data/strapi/checkout"
import DeliveryPromiseClient from "./client"

export default function DeliveryPromiseSection({
  countryCode,
}: {
  countryCode: string
}) {
  return (
    <DeliveryPromiseClient
      countryCode={countryCode}
      atlantaZipCodes={Object.keys(ATLANTA_DELIVERY_ZIP_DAYS)}
    />
  )
}
