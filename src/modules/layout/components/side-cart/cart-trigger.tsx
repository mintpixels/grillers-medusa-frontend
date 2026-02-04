"use client"

import Image from "next/image"
import { useCart } from "./cart-context"

type CartTriggerProps = {
  totalItems: number
}

export default function CartTrigger({ totalItems }: CartTriggerProps) {
  const { openCart } = useCart()

  return (
    <button
      type="button"
      onClick={openCart}
      className="hover:text-ui-fg-base inline-flex gap-1 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
      aria-label={`Shopping cart with ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
      data-testid="nav-cart-link"
    >
      <Image
        src="/images/icons/cart.svg"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
      <span aria-hidden="true">({totalItems})</span>
    </button>
  )
}
