import { retrieveCart } from "@lib/data/cart"
import CartWrapper from "../side-cart/cart-wrapper"

export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)

  return <CartWrapper cart={cart} />
}
