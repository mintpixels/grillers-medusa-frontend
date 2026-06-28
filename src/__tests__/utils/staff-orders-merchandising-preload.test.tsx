import type { ReactElement } from "react"

import StaffPhoneOrdersPage from "../../app/[countryCode]/(main)/account/staff/orders/page"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import { getProductMerchandisingTagsForStaff } from "@lib/data/staff/product-merchandising"
import { emitStaffMerchandisingPreloadFailureAlert } from "@lib/staff-merchandising-ops-alerts"

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound")
  }),
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess: jest.fn(),
}))

jest.mock("@lib/data/staff/impersonation", () => ({
  getStaffImpersonationSession: jest.fn(),
}))

jest.mock("@lib/data/staff/product-merchandising", () => ({
  getProductMerchandisingTagsForStaff: jest.fn(),
}))

jest.mock("@lib/staff-merchandising-ops-alerts", () => ({
  emitStaffMerchandisingPreloadFailureAlert: jest.fn(
    async () => ({ ok: true })
  ),
}))

jest.mock("@lib/util/seo", () => ({
  DEFAULT_SEO_DESCRIPTION: "Default description",
  DEFAULT_SEO_TITLE: "Default title",
  DEFAULT_SOCIAL_IMAGE: { url: "https://example.com/social.jpg" },
  SITE_NAME: "Griller's Pride",
}))

jest.mock("@lib/util/staff-access", () => ({
  canChargeFinalOrders: jest.fn(() => true),
  canManageOrderSupport: jest.fn(() => true),
  canPackCatchWeightOrders: jest.fn(() => true),
  canPickCatchWeightOrders: jest.fn(() => true),
  canReviewMerchandising: jest.fn(() => true),
  canUseOfficeConsole: jest.fn(() => true),
  isStaffCustomer: jest.fn(() => true),
  isSuperAdminCustomer: jest.fn(() => true),
}))

jest.mock("@modules/staff/components/phone-order-copilot", () => ({
  __esModule: true,
  default: () => null,
}))

const mockRetrieveAuthenticatedCustomer =
  retrieveAuthenticatedCustomerForStaffAccess as jest.MockedFunction<
    typeof retrieveAuthenticatedCustomerForStaffAccess
  >
const mockGetStaffImpersonationSession =
  getStaffImpersonationSession as jest.MockedFunction<
    typeof getStaffImpersonationSession
  >
const mockGetProductMerchandisingTagsForStaff =
  getProductMerchandisingTagsForStaff as jest.MockedFunction<
    typeof getProductMerchandisingTagsForStaff
  >
const mockEmitStaffMerchandisingPreloadFailureAlert =
  emitStaffMerchandisingPreloadFailureAlert as jest.MockedFunction<
    typeof emitStaffMerchandisingPreloadFailureAlert
  >

const staffCustomer = {
  id: "cus_staff",
  email: "staff@example.com",
  metadata: { gp_staff_role: "super_admin" },
}

const merchandisingTags = [
  {
    documentId: "L3%3A%20Brisket",
    name: "L3: Brisket",
    displayName: "Brisket",
    productCount: 2,
    imageCount: 4,
    reviewedImageCount: 1,
    approvedImageCount: 1,
    rejectedImageCount: 0,
    claimedImageCount: 0,
    noImageProductCount: 0,
    metadata: [],
    l2Parents: ["Beef"],
  },
]

function pagePropsFor(element: ReactElement) {
  return element.props as Record<string, unknown>
}

describe("staff orders merchandising preload", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRetrieveAuthenticatedCustomer.mockResolvedValue(staffCustomer as any)
    mockGetStaffImpersonationSession.mockResolvedValue(null)
    mockGetProductMerchandisingTagsForStaff.mockResolvedValue(
      merchandisingTags
    )
  })

  it("preloads merchandising tags for direct merchandising workspace requests", async () => {
    const element = (await StaffPhoneOrdersPage({
      params: Promise.resolve({ countryCode: "us" }),
      searchParams: Promise.resolve({ workspace: "merchandising" }),
    })) as ReactElement
    const props = pagePropsFor(element)

    expect(mockGetProductMerchandisingTagsForStaff).toHaveBeenCalledWith(
      staffCustomer
    )
    expect(props.initialWorkspace).toBe("merchandising")
    expect(props.initialMerchandisingTags).toEqual(merchandisingTags)
    expect(props.initialMerchandisingError).toBeNull()
  })

  it("keeps the staff console renderable when the merchandising preload fails", async () => {
    mockGetProductMerchandisingTagsForStaff.mockRejectedValueOnce(
      new Error("Strapi timed out")
    )

    const element = (await StaffPhoneOrdersPage({
      params: Promise.resolve({ countryCode: "us" }),
      searchParams: Promise.resolve({ workspace: "merchandising" }),
    })) as ReactElement
    const props = pagePropsFor(element)

    expect(props.initialWorkspace).toBe("merchandising")
    expect(props.initialMerchandisingTags).toBeNull()
    expect(props.initialMerchandisingError).toBe("Strapi timed out")
    expect(mockEmitStaffMerchandisingPreloadFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        countryCode: "us",
        error: expect.any(Error),
      })
    )
  })

  it("does not load merchandising data for other workspaces", async () => {
    const element = (await StaffPhoneOrdersPage({
      params: Promise.resolve({ countryCode: "us" }),
      searchParams: Promise.resolve({ workspace: "exceptions" }),
    })) as ReactElement
    const props = pagePropsFor(element)

    expect(mockGetProductMerchandisingTagsForStaff).not.toHaveBeenCalled()
    expect(props.initialWorkspace).toBe("exceptions")
    expect(props.initialMerchandisingTags).toBeNull()
    expect(props.initialMerchandisingError).toBeNull()
  })
})
