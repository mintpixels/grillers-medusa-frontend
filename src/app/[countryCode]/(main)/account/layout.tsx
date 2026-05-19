import { Metadata } from "next"
import {
  retrieveAuthenticatedCustomerForStaffAccess,
  retrieveCustomer,
} from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
} from "@lib/util/seo"

// Force dynamic — every /us/account/* route depends on session cookies
// and was never suitable for prerender. (Parallel-routes setup used to
// live here; converted to a single page.tsx + nested children since
// Next.js 15's parallel-routes-in-dynamic-segment bug emits broken
// manifests that 500 the whole subtree in production.)
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const customer = await retrieveCustomer().catch(() => null)
  const accountMetadata = customer
    ? {
        title: "My Account | Griller's Pride",
        description: "Overview of your account activity.",
      }
    : {
        title: "Sign in | Griller's Pride",
        description: "Sign in to your Griller's Pride account.",
      }

  return {
    ...accountMetadata,
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
}

export default async function AccountPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)
  const staffCustomer = await retrieveAuthenticatedCustomerForStaffAccess().catch(
    () => null
  )
  const staffImpersonation = await getStaffImpersonationSession().catch(
    () => null
  )

  return (
    <AccountLayout
      customer={customer}
      staffCustomer={staffCustomer}
      staffImpersonation={staffImpersonation}
    >
      {children}
      <Toaster />
    </AccountLayout>
  )
}
