"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { convertToLocale } from "@lib/util/money"
import { useProductFeaturedImageSrc } from "@lib/hooks/use-product-featured-image"
import { useProductTitle } from "@lib/hooks/use-product-title"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const OrderItem = ({ item, currencyCode }: ItemProps) => {
  const productId = (item as any).product_id || (item as any).product?.id
  const imgSrc = useProductFeaturedImageSrc(productId, "https://placehold.co/80x80")
  const title = useProductTitle(productId, item.product_title)

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
        <Image
          src={imgSrc}
          alt={title || "Product"}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-maison-neue font-semibold text-Charcoal line-clamp-1">
          {title}
        </p>
        <p className="text-xs font-maison-neue text-Charcoal/50 mt-0.5">
          Qty: {item.quantity} &times;{" "}
          {convertToLocale({
            amount: item.unit_price ?? 0,
            currency_code: currencyCode,
          })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-maison-neue font-bold text-Charcoal">
          {convertToLocale({
            amount: (item.unit_price ?? 0) * item.quantity,
            currency_code: currencyCode,
          })}
        </p>
      </div>
    </div>
  )
}

export default OrderItem
