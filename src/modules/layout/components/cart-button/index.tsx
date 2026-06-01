"use client"

import { useStorefrontSession } from "@modules/layout/components/storefront-session"
import CartTrigger from "../side-cart/cart-trigger"

export default function CartButton() {
  const { cartItemCount } = useStorefrontSession()

  return <CartTrigger totalItems={cartItemCount} />
}
