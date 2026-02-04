import { retrieveCart } from "@lib/data/cart"
import SideCart from "./index"

/**
 * Server component wrapper that fetches cart data and renders the SideCart.
 * This is placed at the Layout level so the side cart is always available.
 */
export default async function SideCartWrapper() {
  const cart = await retrieveCart().catch(() => null)

  return <SideCart cart={cart} />
}
