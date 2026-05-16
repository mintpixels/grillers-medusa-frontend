import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import SideCart from "./index"

/**
 * Server component wrapper that fetches cart data and renders the SideCart.
 * This is placed at the Layout level so the side cart is always available.
 */
export default async function SideCartWrapper() {
  const [cart, atlantaZipConfig, savedZip, customer] = await Promise.all([
    retrieveCart().catch(() => null),
    getAtlantaDeliveryZipConfig().catch(() => undefined),
    getDeliveryZipCookie(),
    retrieveCustomer().catch(() => null),
  ])
  const initialDeliveryZip =
    cart?.shipping_address?.postal_code ||
    savedZip ||
    getAddressBookDeliveryZip(customer?.addresses)

  return (
    <SideCart
      cart={cart}
      atlantaZipConfig={atlantaZipConfig}
      initialDeliveryZip={initialDeliveryZip}
    />
  )
}
