import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import SideCart from "./index"
import { getCartUpsellProducts } from "@modules/cart/components/cart-upsells/server"

/**
 * Server component wrapper that fetches cart data and renders the SideCart.
 * This is placed at the Layout level so the side cart is always available.
 */
export default async function SideCartWrapper({
  countryCode = "us",
}: {
  countryCode?: string
}) {
  const [cart, atlantaZipConfig, savedZip, customer] = await Promise.all([
    retrieveCart().catch(() => null),
    getAtlantaDeliveryZipConfig().catch(() => undefined),
    getDeliveryZipCookie(),
    retrieveCustomer().catch(() => null),
  ])
  const upsellProducts = cart?.items?.length
    ? await getCartUpsellProducts(countryCode)
    : []
  const initialDeliveryZip =
    cart?.shipping_address?.postal_code ||
    savedZip ||
    getAddressBookDeliveryZip(customer?.addresses)

  return (
    <SideCart
      cart={cart}
      upsellProducts={upsellProducts}
      countryCode={countryCode}
      atlantaZipConfig={atlantaZipConfig}
      initialDeliveryZip={initialDeliveryZip}
    />
  )
}
