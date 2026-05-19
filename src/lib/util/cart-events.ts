"use client"

export const CART_UPDATED_EVENT = "gp:cart-updated"

export type CartUpdatedDetail = {
  action:
    | "add"
    | "bundle-add"
    | "quantity"
    | "remove"
    | "cart-page-quantity"
  lineId?: string
  variantId?: string
  quantity?: number
}

export function dispatchCartUpdated(detail: CartUpdatedDetail) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail }))
}
