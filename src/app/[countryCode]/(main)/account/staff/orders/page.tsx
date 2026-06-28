import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import {
  getProductMerchandisingTagsForStaff,
  type ProductMerchandisingTagSummary,
} from "@lib/data/staff/product-merchandising"
import type { HttpTypes } from "@medusajs/types"
import {
  canManageOrderSupport,
  canPackCatchWeightOrders,
  canPickCatchWeightOrders,
  canReviewMerchandising,
  canUseOfficeConsole,
  isStaffCustomer,
  isSuperAdminCustomer,
} from "@lib/util/staff-access"
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
export const maxDuration = 60

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
  "quickbooks_sync",
  "team_access",
  "merchandising",
])

const DEFAULT_MERCHANDISING_PRELOAD_TIMEOUT_MS = 12000

function merchandisingPreloadTimeoutMs() {
  const configured = Number(process.env.STAFF_MERCHANDISING_PRELOAD_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MERCHANDISING_PRELOAD_TIMEOUT_MS
}

function merchandisingPreloadTimeout() {
  return new Promise<ProductMerchandisingTagSummary[]>((_resolve, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          "Merchandising data is still loading; retrying through the staff feed."
        )
      )
    }, merchandisingPreloadTimeoutMs())
  })
}

function loadInitialMerchandisingTags(customer: HttpTypes.StoreCustomer) {
  return Promise.race([
    getProductMerchandisingTagsForStaff(customer),
    merchandisingPreloadTimeout(),
  ])
}

function requestedWorkspace(
  value?: string | string[]
): StaffWorkspace | null {
  const candidate = Array.isArray(value) ? value[0] : value
  return STAFF_WORKSPACES.has(candidate as StaffWorkspace)
    ? (candidate as StaffWorkspace)
    : null
}

// A workspace may only be entered if the staff member holds the matching
// capability, so a hand-crafted ?workspace= URL can never render chrome the
// role is not allowed to use.
function canAccessWorkspace(
  customer: HttpTypes.StoreCustomer,
  workspace: StaffWorkspace
): boolean {
  switch (workspace) {
    case "phone_order":
    case "new_customer":
    case "customer_account":
      return canUseOfficeConsole(customer)
    case "exceptions":
    case "quickbooks_sync":
      return canManageOrderSupport(customer)
    case "finalization":
      return (
        canPickCatchWeightOrders(customer) ||
        canPackCatchWeightOrders(customer)
      )
    case "merchandising":
      return canReviewMerchandising(customer)
    case "team_access":
      return isSuperAdminCustomer(customer)
    default:
      return false
  }
}

// When no explicit workspace is requested, land each staff member on a
// workspace they can actually use. Without this, narrow roles (merchandising
// reviewer, picker, packer) would briefly render the order-support fallback
// before the client corrects itself.
function defaultWorkspaceForCustomer(
  customer: HttpTypes.StoreCustomer
): StaffWorkspace {
  if (canManageOrderSupport(customer)) return "exceptions"
  if (canReviewMerchandising(customer)) return "merchandising"
  if (canPickCatchWeightOrders(customer) || canPackCatchWeightOrders(customer)) {
    return "finalization"
  }
  return "exceptions"
}

function staffPageErrorMessage(
  value: unknown,
  fallback = "Could not load merchandising data."
) {
  if (value instanceof Error) return value.message
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const record = value as Record<string, any>
    return (
      String(record.message || "").trim() ||
      String(record.error?.message || "").trim() ||
      String(record.error || "").trim() ||
      fallback
    )
  }
  return fallback
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
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!isStaffCustomer(customer)) {
    notFound()
  }

  const requested = requestedWorkspace(resolvedSearchParams.workspace)
  const initialWorkspace =
    requested && canAccessWorkspace(customer, requested)
      ? requested
      : defaultWorkspaceForCustomer(customer)

  const impersonation = await getStaffImpersonationSession()
  let initialMerchandisingTags: ProductMerchandisingTagSummary[] | null = null
  let initialMerchandisingError: string | null = null

  if (initialWorkspace === "merchandising" && canReviewMerchandising(customer)) {
    try {
      initialMerchandisingTags = await loadInitialMerchandisingTags(customer)
    } catch (error) {
      initialMerchandisingError = staffPageErrorMessage(error)
    }
  }

  return (
    <PhoneOrderCopilot
      countryCode={countryCode}
      staffCustomer={customer}
      initialImpersonation={impersonation}
      initialMerchandisingError={initialMerchandisingError}
      initialMerchandisingTags={initialMerchandisingTags}
      initialWorkspace={initialWorkspace}
    />
  )
}
