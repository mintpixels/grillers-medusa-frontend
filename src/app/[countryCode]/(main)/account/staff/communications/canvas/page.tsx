import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import {
  getCommunicationOverview,
  getCommunicationTemplate,
} from "@lib/data/staff/communications"
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
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ key?: string }>
}) {
  const { countryCode } = await params
  const { key } = await searchParams
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!canUseOfficeConsole(customer)) {
    notFound()
  }

  const overview = await getCommunicationOverview().catch(() => null)
  const existing = key
    ? await getCommunicationTemplate(key).catch(() => null)
    : null

  return (
    <CampaignCanvas
      countryCode={countryCode}
      staffEmail={customer.email || ""}
      segments={overview?.segments || []}
      templates={overview?.templates || []}
      initialTemplate={
        existing?.template
          ? {
              key: existing.template.key,
              name: existing.template.name,
              subject: existing.template.subject,
              mjml_source:
                existing.template.metadata?.mjml_source || null,
            }
          : null
      }
    />
  )
}
