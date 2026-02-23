"use client"

import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import OrderItem from "@modules/order/components/item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="divide-y divide-Charcoal/5">
      {items
        ?.sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
        .map((item) => (
          <OrderItem
            key={item.id}
            item={item}
            currencyCode={order.currency_code}
          />
        ))}
    </div>
  )
}

export default Items
