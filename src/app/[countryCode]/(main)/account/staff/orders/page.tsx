import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import { isStaffCustomer } from "@lib/util/staff-access"
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
} from "@lib/util/seo"
import PhoneOrderCopilot from "@modules/staff/components/phone-order-copilot"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Staff console | Griller's Pride",
  description: "Staff-only Griller's Pride customer support tools.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
}

export default async function StaffPhoneOrdersPage({
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

  const impersonation = await getStaffImpersonationSession()

  return (
    <PhoneOrderCopilot
      countryCode={countryCode}
      staffCustomer={customer}
      initialImpersonation={impersonation}
    />
  )
}
