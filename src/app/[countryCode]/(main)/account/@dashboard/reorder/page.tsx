import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listOrdersWithPrices } from "@lib/data/orders"
import Divider from "@modules/common/components/divider"
import ReorderCard from "@modules/account/components/reorder-card"

export const metadata: Metadata = {
  title: "Quick Reorder",
  description:
    "To make reordering quick and effortless, we've displayed your recent purchases below. Simply select the quantity you need and proceed directly to checkout.",
}

export default async function Reorder() {
  const orders = await listOrdersWithPrices()
  if (!orders) {
    notFound()
  }

  const itemsWithDate = orders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderDate: order.created_at,
    }))
  )

  // Compute frequency map (by variant)
  const freqMap: Record<
    string,
    { count: number; item: (typeof itemsWithDate)[0] }
  > = {}
  itemsWithDate.forEach((itm) => {
    const key = itm.variant_id
    if (!freqMap[key]) {
      freqMap[key] = { count: itm.quantity, item: itm }
    } else {
      freqMap[key].count += itm.quantity
    }
  })

  // Pick top 4 most frequently purchased
  const mostFrequent = Object.values(freqMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((v) => v.item)

  // Sort all items by purchase date descending, take 8 most recent
  const recentItems = itemsWithDate
    .sort(
      (a, b) =>
        new Date(b.orderDate!).getTime() - new Date(a.orderDate!).getTime()
    )
    .slice(0, 8)

  return (
    <div className="w-full" data-testid="reorder-page-wrapper">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Quick Reorder</h1>
        <p className="text-base-regular">
          To make reordering quick and effortless, we've displayed your recent
          purchases below. Simply select the quantity you need and proceed
          directly to checkout.
        </p>
      </div>

      {/* Most Frequently Purchased Section */}
      <section className="my-12">
        <h2 className="text-large-semi mb-4">Most Frequently Purchased</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {mostFrequent?.map((item) => (
            <ReorderCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <Divider />

      {/* Recent Purchases Section */}
      <section className="mt-12">
        <h2 className="text-large-semi mb-4">Recent Purchases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {recentItems?.map((item) => (
            <ReorderCard
              key={`${item.id}-${item.orderDate}`}
              item={item}
              showDate
            />
          ))}
        </div>
      </section>
    </div>
  )
}
