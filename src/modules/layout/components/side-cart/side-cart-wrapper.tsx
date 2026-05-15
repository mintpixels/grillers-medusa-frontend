import { retrieveCart } from "@lib/data/cart"
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
  const cart = await retrieveCart().catch(() => null)
  const upsellProducts = cart?.items?.length
    ? await getCartUpsellProducts(countryCode)
    : []

  return (
    <SideCart
      cart={cart}
      upsellProducts={upsellProducts}
      countryCode={countryCode}
    />
  )
}
