import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import { isStaffCustomer } from "@lib/util/staff-access"
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
} from "@lib/util/seo"
import PhoneOrderCopilot, {
  type StaffWorkspace,
} from "@modules/staff/components/phone-order-copilot"
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

const STAFF_WORKSPACES = new Set<StaffWorkspace>([
  "phone_order",
  "new_customer",
  "customer_account",
  "finalization",
  "exceptions",
  "team_access",
])

function staffWorkspaceFromSearchParam(
  value?: string | string[]
): StaffWorkspace {
  const candidate = Array.isArray(value) ? value[0] : value
  return STAFF_WORKSPACES.has(candidate as StaffWorkspace)
    ? (candidate as StaffWorkspace)
    : "exceptions"
}

export default async function StaffPhoneOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { countryCode } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const initialWorkspace = staffWorkspaceFromSearchParam(
    resolvedSearchParams.workspace
  )
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
      initialWorkspace={initialWorkspace}
    />
  )
}
