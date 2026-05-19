import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import SideCart from "./index"
import { getCartUpsellProducts } from "@modules/cart/components/cart-upsells/server"
import { withTimeout } from "@lib/util/promise-timeout"

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
    withTimeout(
      retrieveCart().catch(() => null),
      800,
      null,
      "side cart cart"
    ),
    withTimeout(
      getAtlantaDeliveryZipConfig().catch(() => undefined),
      800,
      undefined,
      "side cart delivery config"
    ),
    getDeliveryZipCookie(),
    withTimeout(
      retrieveCustomer().catch(() => null),
      800,
      null,
      "side cart customer"
    ),
  ])
  const upsellProducts = cart?.items?.length
    ? await withTimeout(
        getCartUpsellProducts(countryCode).catch(() => []),
        800,
        [],
        "side cart upsells"
      )
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
