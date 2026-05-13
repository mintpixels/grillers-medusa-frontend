import Overview from "@modules/account/components/overview"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

// Title / description live on the parent layout's generateMetadata (#22).
// Static metadata here would override the layout and break auth-aware
// tab titles for parallel-route slots.

// force-dynamic on the parent layout doesn't propagate to parallel
// slot pages — without it here, Vercel prerenders this slot at build
// time and the whole /us/account subtree was serving a static 500.
export const dynamic = "force-dynamic"

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null

  // The parent layout picks @dashboard vs @login based on `customer`, so
  // when we're logged out this slot is never rendered. Return null here
  // instead of notFound() — notFound() in a parallel slot bubbles up to
  // the parent and 500s the whole /us/account route on Vercel, taking
  // sign-in down with it.
  if (!customer) {
    return null
  }

  return <Overview customer={customer} orders={orders} />
}
