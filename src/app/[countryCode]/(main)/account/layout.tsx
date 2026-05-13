import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"

// Force dynamic rendering for the entire /us/account/* subtree. The
// parallel @dashboard slot calls notFound() when there's no signed-in
// customer, and at build time (no cookies = no customer) Vercel's
// prerender baked a 500 into every account route. /us/account/wishlist
// already sets force-dynamic and was the only account route still
// serving 200 in production — pulling the same setting up to the layout
// fixes the whole subtree.
export const dynamic = "force-dynamic"

// /us/account renders @login or @dashboard via parallel routes. Each slot's
// metadata is static, so without overriding here Next.js picks one slot's
// title even after auth flips. Compute from session so the tab title
// matches what the customer is actually seeing.
export async function generateMetadata(): Promise<Metadata> {
  const customer = await retrieveCustomer().catch(() => null)
  return customer
    ? {
        title: "My Account | Griller's Pride",
        description: "Overview of your account activity.",
      }
    : {
        title: "Sign in | Griller's Pride",
        description: "Sign in to your Griller's Pride account.",
      }
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      <Toaster />
    </AccountLayout>
  )
}
