import { retrieveCart } from "@lib/data/cart"
import { withTimeout } from "@lib/util/promise-timeout"
import CartWrapper from "../side-cart/cart-wrapper"

export default async function CartButton() {
  const cart = await withTimeout(
    retrieveCart().catch(() => null),
    800,
    null,
    "cart button cart"
  )

  return <CartWrapper cart={cart} />
}
