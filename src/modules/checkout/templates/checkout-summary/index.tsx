"use client"

import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { useProductFeaturedImageSrc } from "@lib/hooks/use-product-featured-image"
import { useProductTitle } from "@lib/hooks/use-product-title"
import DiscountCode from "@modules/checkout/components/discount-code"
import Thumbnail from "@modules/products/components/thumbnail"
import type { FulfillmentType } from "@lib/data/cart"

type CheckoutSummaryProps = {
  cart: HttpTypes.StoreCart
}

// Item component that fetches Strapi image and title
const CheckoutItem = ({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) => {
  const imgSrc = useProductFeaturedImageSrc(
    item?.product?.id,
    "https://placehold.co/64x64"
  )
  const title = useProductTitle(item?.product?.id, item.title)

  return (
    <div className="flex gap-4">
      {/* Thumbnail with quantity badge */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-700">
          <Thumbnail thumbnail={imgSrc} size="square" />
        </div>
        {/* Quantity badge */}
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {item.quantity}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white line-clamp-2">{title}</p>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-white">
          {convertToLocale({
            amount: (item.unit_price ?? 0) * item.quantity,
            currency_code: currencyCode,
          })}
        </p>
      </div>
    </div>
  )
}

const CheckoutSummary = ({ cart }: CheckoutSummaryProps) => {
  const items = cart.items || []
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  
  // Check if this is a pickup order (no shipping needed)
  const fulfillmentType = cart.metadata?.fulfillmentType as FulfillmentType | undefined
  const isPickup = fulfillmentType === "plant_pickup" || fulfillmentType === "southeast_pickup"

  return (
    <div className="small:sticky small:top-24 small:max-h-[calc(100vh-8rem)] small:overflow-y-auto">
      {/* Header */}
      <h2 className="text-xl font-semibold text-white mb-6">
        Order Summary
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({totalItems} {totalItems === 1 ? "item" : "items"})
        </span>
      </h2>

      {/* Promo Code */}
      <div className="mb-6">
        <DiscountCode cart={cart} variant="dark" />
      </div>

      {/* Totals */}
      <div className="space-y-3 pb-6 border-b border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-white">
            {convertToLocale({
              amount: cart.subtotal ?? 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
        {/* Only show shipping for delivery orders, not pickup */}
        {!isPickup && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Shipping</span>
            <span className="text-gray-300">
              {cart.shipping_total
                ? convertToLocale({
                    amount: cart.shipping_total,
                    currency_code: cart.currency_code,
                  })
                : "Calculated at checkout"}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Taxes</span>
          <span className="text-white">
            {convertToLocale({
              amount: cart.tax_total ?? 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
        {(cart.discount_total ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Discount</span>
            <span className="text-green-400">
              -
              {convertToLocale({
                amount: cart.discount_total ?? 0,
                currency_code: cart.currency_code,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between py-4 border-b border-gray-700">
        <span className="text-lg font-semibold text-white">Total</span>
        <span className="text-lg font-semibold text-white">
          {convertToLocale({
            amount: cart.total ?? 0,
            currency_code: cart.currency_code,
          })}
        </span>
      </div>

      {/* Items */}
      <div className="mt-6 space-y-4">
        {items
          .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
          .map((item) => (
            <CheckoutItem
              key={item.id}
              item={item}
              currencyCode={cart.currency_code}
            />
          ))}
      </div>
    </div>
  )
}

export default CheckoutSummary
