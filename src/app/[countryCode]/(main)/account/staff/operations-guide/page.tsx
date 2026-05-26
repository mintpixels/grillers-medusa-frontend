import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { isStaffCustomer } from "@lib/util/staff-access"
import StaffOperationsGuide from "@modules/staff/templates/operations-guide"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Operations guide | Griller's Pride",
  description: "Staff-only operating guide for the Griller's Pride site.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function StaffOperationsGuidePage({
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

  return <StaffOperationsGuide />
}
