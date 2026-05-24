"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
  CART_UPDATED_EVENT,
  type CartUpdatedDetail,
} from "@lib/util/cart-events"

type CartContextType = {
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const openCart = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleCart = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail
      if (detail?.action === "add" || detail?.action === "bundle-add") {
        setIsOpen(true)
        router.refresh()
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    return () =>
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
  }, [router])

  return (
    <CartContext.Provider value={{ isOpen, openCart, closeCart, toggleCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export default CartContext
