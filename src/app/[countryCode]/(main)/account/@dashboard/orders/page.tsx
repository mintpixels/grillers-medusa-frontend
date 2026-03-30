import { Metadata } from "next"
import { listOrders } from "@lib/data/orders"
import { notFound } from "next/navigation"
import OrdersList from "@modules/account/components/orders-list"

export const metadata: Metadata = {
  title: "Orders | Grillers Pride",
  description: "View your order history.",
}

export default async function Orders() {
  const orders = await listOrders(100, 0)

  if (!orders) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 font-gyst font-bold text-Charcoal">My Orders</h1>
        <p className="text-sm font-maison-neue text-Charcoal/50 mt-1">
          View and manage your order history
        </p>
      </div>
      <OrdersList orders={orders} />
    </div>
  )
}
