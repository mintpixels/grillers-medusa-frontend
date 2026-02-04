"use client"

import { HttpTypes } from "@medusajs/types"
import CartTrigger from "./cart-trigger"

type CartWrapperProps = {
  cart: HttpTypes.StoreCart | null
}

/**
 * Client-side wrapper for the cart trigger button.
 * CartProvider and SideCart are now at the Layout level.
 */
export default function CartWrapper({ cart }: CartWrapperProps) {
  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return <CartTrigger totalItems={totalItems} />
}
