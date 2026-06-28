import Overview from "@modules/account/components/overview"
import LoginTemplate from "@modules/account/templates/login-template"
import { retrieveCustomer } from "@lib/data/customer"
import { listAllOrders, listLegacyCustomerOrders } from "@lib/data/orders"
import { emitOrderHistoryDataFailureAlert } from "@lib/order-history-ops-alerts"

// /us/account branches on session: signed-in customers see the account
// overview, everyone else sees the sign-in form. Previously this was a
// parallel-routes setup (@login + @dashboard slots picked by the
// layout), but Next.js 15's bug with parallel routes nested inside a
// dynamic segment (#76148) emits broken client-reference manifests for
// every slot page → every /us/account/* route 500s in production. A
// plain branching page.tsx avoids the parallel-routes path entirely.
export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return <LoginTemplate />
  }

  const [orders, legacyOrderHistory] = await Promise.all([
    listAllOrders().catch((error) => {
      void emitOrderHistoryDataFailureAlert({
        stage: "account_recent_orders",
        mode: "customer",
        error,
      }).catch(() => {
        // Fail open: the overview already renders without recent orders.
      })
      return null
    }),
    listLegacyCustomerOrders(5, 0).catch(() => ({ orders: [], count: 0 })),
  ])

  return (
    <Overview
      customer={customer}
      orders={orders || null}
      legacyOrders={legacyOrderHistory.orders || []}
      legacyOrderCount={legacyOrderHistory.count || 0}
    />
  )
}
