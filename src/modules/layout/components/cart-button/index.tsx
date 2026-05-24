import { retrieveCart } from "@lib/data/cart"
import { withTimeout } from "@lib/util/promise-timeout"
import { HttpTypes } from "@medusajs/types"
import CartWrapper from "../side-cart/cart-wrapper"

type CartButtonProps = {
  cart?: HttpTypes.StoreCart | null
}

export default async function CartButton({
  cart: prefetchedCart,
}: CartButtonProps = {}) {
  const cart =
    prefetchedCart !== undefined
      ? prefetchedCart
      : await withTimeout(
          retrieveCart().catch(() => null),
          800,
          null,
          "cart button cart"
        )

  return <CartWrapper cart={cart} />
}
