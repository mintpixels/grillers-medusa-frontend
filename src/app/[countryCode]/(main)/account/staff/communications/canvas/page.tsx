import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getCommunicationOverview } from "@lib/data/staff/communications"
import { canUseOfficeConsole } from "@lib/util/staff-access"
import CampaignCanvas from "@modules/staff/components/campaign-canvas"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Campaign Canvas | Griller's Pride",
  description: "Design and send GP Comms campaigns.",
  robots: { index: false, follow: false },
}

export default async function CampaignCanvasPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!canUseOfficeConsole(customer)) {
    notFound()
  }

  const overview = await getCommunicationOverview().catch(() => null)

  return (
    <CampaignCanvas
      countryCode={countryCode}
      staffEmail={customer.email || ""}
      segments={overview?.segments || []}
      templates={overview?.templates || []}
    />
  )
}
