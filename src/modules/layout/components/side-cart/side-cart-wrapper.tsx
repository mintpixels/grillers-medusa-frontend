import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import type { HttpTypes } from "@medusajs/types"
import SideCart from "./index"
import { getCartUpsellProducts } from "@modules/cart/components/cart-upsells/server"
import { withTimeout } from "@lib/util/promise-timeout"
import { buildCartProductDetailsMap } from "@lib/util/cart-product-details"

/**
 * Server component wrapper that fetches cart data and renders the SideCart.
 * This is placed at the Layout level so the side cart is always available.
 */
export default async function SideCartWrapper({
  countryCode = "us",
  cart: prefetchedCart,
  customer: prefetchedCustomer,
}: {
  countryCode?: string
  cart?: HttpTypes.StoreCart | null
  customer?: HttpTypes.StoreCustomer | null
}) {
  const [cart, atlantaZipConfig, savedZip, customer] = await Promise.all([
    prefetchedCart !== undefined
      ? prefetchedCart
      : withTimeout(
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
    prefetchedCustomer !== undefined
      ? prefetchedCustomer
      : withTimeout(
          retrieveCustomer().catch(() => null),
          800,
          null,
          "side cart customer"
        ),
  ])
  const [upsellProducts, productDetailsMap] = cart?.items?.length
    ? await Promise.all([
        withTimeout(
          getCartUpsellProducts(countryCode).catch(() => []),
          800,
          [],
          "side cart upsells"
        ),
        withTimeout(
          buildCartProductDetailsMap(cart.items),
          1000,
          {},
          "side cart product details"
        ),
      ])
    : [[], {}]
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
      productDetailsMap={productDetailsMap}
    />
  )
}
