"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useProductFeaturedImageSrc } from "@lib/hooks/use-product-featured-image"
import { useProductTitle } from "@lib/hooks/use-product-title"
import { useCart } from "./cart-context"
import { updateLineItem } from "@lib/data/cart"
import Spinner from "@modules/common/icons/spinner"

// Cart item image with fallback
const CartItemImage = ({ item }: { item: HttpTypes.StoreCartLineItem }) => {
  const imgSrc = useProductFeaturedImageSrc(
    item?.product?.id,
    "https://placehold.co/96x96"
  )

  return (
    <Thumbnail
      thumbnail={imgSrc}
      images={item.variant?.product?.images}
      size="square"
    />
  )
}

// Cart item title with Strapi fallback
const CartItemTitle = ({ 
  item, 
  closeCart 
}: { 
  item: HttpTypes.StoreCartLineItem
  closeCart: () => void 
}) => {
  const title = useProductTitle(item?.product?.id, item.title)

  return (
    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        onClick={closeCart}
        className="hover:text-Gold"
      >
        {title}
      </LocalizedClientLink>
    </h3>
  )
}

// Quantity selector component
const QuantitySelector = ({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) => {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [optimisticQuantity, setOptimisticQuantity] = useState(item.quantity)

  useEffect(() => {
    setOptimisticQuantity(item.quantity)
  }, [item.quantity])

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || isUpdating) return

    setIsUpdating(true)
    setOptimisticQuantity(newQuantity)

    try {
      await updateLineItem({ lineId: item.id, quantity: newQuantity })
      // Refresh to get updated cart data from server
      router.refresh()
    } catch (error) {
      // Revert on error
      setOptimisticQuantity(item.quantity)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleQuantityChange(optimisticQuantity - 1)}
        disabled={isUpdating || optimisticQuantity <= 1}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <span className="text-lg leading-none">−</span>
      </button>
      <span className="w-8 text-center tabular-nums" aria-label={`Quantity: ${optimisticQuantity}`}>
        {isUpdating ? <Spinner size={16} /> : optimisticQuantity}
      </span>
      <button
        type="button"
        onClick={() => handleQuantityChange(optimisticQuantity + 1)}
        disabled={isUpdating}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  )
}

type SideCartProps = {
  cart?: HttpTypes.StoreCart | null
}

export default function SideCart({ cart }: SideCartProps) {
  const { isOpen, closeCart, openCart } = useCart()
  const [announcement, setAnnouncement] = useState("")
  const previousItemCount = useRef<number | null>(null)
  const isInitialMount = useRef(true)

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const subtotal = cart?.subtotal ?? 0

  // Always go to checkout - fulfillment selection is now step 1 of checkout
  const checkoutUrl = "/checkout"

  // Auto-open cart when items are added (but not on initial page load)
  useEffect(() => {
    // Skip the initial mount to avoid opening cart on page load
    if (isInitialMount.current) {
      isInitialMount.current = false
      previousItemCount.current = totalItems
      return
    }

    // Open cart if items were added
    if (previousItemCount.current !== null && totalItems > previousItemCount.current) {
      openCart()
      const diff = totalItems - previousItemCount.current
      setAnnouncement(
        `${diff} item${diff > 1 ? "s" : ""} added to cart. Cart now has ${totalItems} item${totalItems > 1 ? "s" : ""}.`
      )
    }
    previousItemCount.current = totalItems
  }, [totalItems, openCart])

  return (
    <>
      {/* ARIA live region for cart updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={closeCart} className="relative z-[60]">
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </TransitionChild>

          {/* Panel container */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in duration-200"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-6 h-6 text-gray-900"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Your Cart
                            {totalItems > 0 && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({totalItems} {totalItems === 1 ? "item" : "items"})
                              </span>
                            )}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={closeCart}
                          className="p-2 -mr-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-Gold rounded-md"
                          aria-label="Close cart"
                        >
                          <XMark className="h-6 w-6" />
                        </button>
                      </div>

                      {/* Cart content */}
                      {cart && cart.items?.length ? (
                        <>
                          {/* Items list - scrollable */}
                          <div className="flex-1 overflow-y-auto px-4 py-4">
                            <ul className="divide-y divide-gray-200">
                              {cart.items
                                .sort((a, b) =>
                                  (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                                )
                                .map((item) => (
                                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex gap-4">
                                      {/* Product image */}
                                      <LocalizedClientLink
                                        href={`/products/${item.product_handle}`}
                                        className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-gray-100"
                                        onClick={closeCart}
                                      >
                                        <CartItemImage item={item} />
                                      </LocalizedClientLink>

                                      {/* Product details */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                          <div className="pr-2">
                                            <CartItemTitle item={item} closeCart={closeCart} />
                                          </div>
                                          <div className="flex-shrink-0 text-right">
                                            <LineItemPrice
                                              item={item}
                                              style="tight"
                                              currencyCode={cart.currency_code}
                                            />
                                          </div>
                                        </div>

                                        {/* Quantity and remove */}
                                        <div className="mt-3 flex items-center justify-between">
                                          <QuantitySelector
                                            item={item}
                                            currencyCode={cart.currency_code}
                                          />
                                          <DeleteButton
                                            id={item.id}
                                            className="text-sm text-gray-500 hover:text-red-600"
                                          >
                                            Remove
                                          </DeleteButton>
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>

                          {/* Footer - sticky */}
                          <div className="border-t border-gray-200 px-4 py-4 space-y-4">
                            {/* Subtotal */}
                            <div className="flex items-center justify-between">
                              <span className="text-base font-medium text-gray-900">
                                Subtotal
                              </span>
                              <span className="text-lg font-semibold text-gray-900">
                                {convertToLocale({
                                  amount: subtotal,
                                  currency_code: cart.currency_code,
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Shipping and taxes calculated at checkout.
                            </p>

                            {/* Action buttons */}
                            <div className="space-y-2">
                              <LocalizedClientLink
                                href={checkoutUrl}
                                onClick={closeCart}
                                className="block"
                              >
                                <Button className="w-full" size="large">
                                  Checkout
                                </Button>
                              </LocalizedClientLink>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Empty state */
                        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Your cart is empty
                          </h3>
                          <p className="text-sm text-gray-500 text-center mb-6">
                            Looks like you haven&apos;t added any items to your cart yet.
                          </p>
                          <LocalizedClientLink href="/store" onClick={closeCart}>
                            <Button>Start Shopping</Button>
                          </LocalizedClientLink>
                        </div>
                      )}
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
