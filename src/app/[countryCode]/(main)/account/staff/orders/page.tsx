import { retrieveCustomer } from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import { isStaffCustomer } from "@lib/util/staff-access"
import PhoneOrderCopilot from "@modules/staff/components/phone-order-copilot"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Staff phone orders",
  description: "Create Grillers Pride phone orders for customers.",
}

export default async function StaffPhoneOrdersPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!isStaffCustomer(customer)) {
    notFound()
  }

  const impersonation = await getStaffImpersonationSession()

  return (
    <PhoneOrderCopilot
      countryCode={countryCode}
      staffCustomer={customer}
      initialImpersonation={impersonation}
    />
  )
}
