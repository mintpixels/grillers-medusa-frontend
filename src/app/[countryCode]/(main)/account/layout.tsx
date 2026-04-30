import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"

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
