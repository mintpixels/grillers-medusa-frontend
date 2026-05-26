import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getCommunicationOverview } from "@lib/data/staff/communications"
import { isStaffCustomer } from "@lib/util/staff-access"
import StaffCommunicationsConsole from "@modules/staff/components/communications-console"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Customer communications | Griller's Pride",
  description: "Staff-only customer communication, lifecycle, and campaign console.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function StaffCommunicationsPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!isStaffCustomer(customer)) {
    notFound()
  }

  const overview = await getCommunicationOverview()

  return (
    <StaffCommunicationsConsole
      countryCode={countryCode}
      overview={overview}
      staffEmail={customer.email}
    />
  )
}
