import {
  applyStaffCustomerAccountAction,
  saveStaffCustomerAddress,
  updateStaffCustomerProfile,
} from "@lib/data/staff/order-entry"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess: jest.fn(),
}))

jest.mock("@lib/util/staff-access", () => ({
  canUseOfficeConsole: jest.fn(() => true),
  staffDisplayName: jest.fn(() => "Avi Swerdlow"),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    auth: {
      register: jest.fn(),
      resetPassword: jest.fn(),
    },
    store: {
      cart: {},
      customer: {
        create: jest.fn(),
      },
    },
  },
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

const mockRetrieveAuthenticatedCustomer =
  retrieveAuthenticatedCustomerForStaffAccess as jest.MockedFunction<
    typeof retrieveAuthenticatedCustomerForStaffAccess
  >
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

function response(
  ok: boolean,
  status: number,
  body: Record<string, unknown>
): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Service Unavailable",
    json: async () => body,
  } as Response
}

function currentCustomerResponse() {
  return response(true, 200, {
    customer: {
      id: "cus_target",
      email: "customer@example.com",
      metadata: {},
      addresses: [],
    },
  })
}

describe("staff order-entry customer context mutation alerts", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MEDUSA_ADMIN_API_TOKEN = "admin-token"
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = "pk_test"
    mockRetrieveAuthenticatedCustomer.mockResolvedValue({
      id: "cus_staff",
      email: "staff@example.com",
      first_name: "Avi",
      last_name: "Swerdlow",
      metadata: { gp_staff_role: "super_admin" },
    } as any)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("alerts when a staff customer profile write fails", async () => {
    global.fetch = jest.fn(async (_url, init) => {
      if ((init as RequestInit | undefined)?.method === "POST") {
        return response(false, 503, {
          message: "Medusa write failed for customer@example.com cus_target",
        })
      }
      return currentCustomerResponse()
    }) as unknown as typeof fetch

    const result = await updateStaffCustomerProfile({
      customerId: "cus_target",
      email: "customer@example.com",
      firstName: "Test",
      lastName: "Customer",
    })

    expect(result).toEqual({
      ok: false,
      error: "Medusa write failed for customer@example.com cus_target",
    })
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_customer_context_mutation_failed",
        severity: "warn",
        title: "Staff customer profile update failed",
        path: "src/lib/data/staff/order-entry.ts",
        source: "medusa-server",
        fingerprint: "staff_customer_context:profile_update:failed",
        meta: expect.objectContaining({
          staff_module: "phone_order",
          action: "profile_update",
          has_customer_id: true,
          has_address_id: false,
          has_amount: false,
          has_related_order: false,
          qbd_posting_required: false,
          error_message:
            "Medusa write failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })

  it("alerts when a staff customer address write fails", async () => {
    global.fetch = jest.fn(async (_url, init) => {
      if ((init as RequestInit | undefined)?.method === "POST") {
        return response(false, 503, {
          message: "Address write failed for customer@example.com addr_123",
        })
      }
      return currentCustomerResponse()
    }) as unknown as typeof fetch

    const result = await saveStaffCustomerAddress({
      customerId: "cus_target",
      address: {
        id: "addr_123",
        firstName: "Test",
        lastName: "Customer",
        address1: "123 Main St",
        city: "Atlanta",
        province: "GA",
        postalCode: "30338",
        countryCode: "us",
        phone: "4045551212",
      },
    })

    expect(result.ok).toBe(false)
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_customer_context_mutation_failed",
        severity: "warn",
        fingerprint: "staff_customer_context:address_update:failed",
        meta: expect.objectContaining({
          action: "address_update",
          has_customer_id: true,
          has_address_id: true,
          error_message: "Address write failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })

  it("does not alert on local address validation errors", async () => {
    global.fetch = jest.fn() as unknown as typeof fetch

    const result = await saveStaffCustomerAddress({
      customerId: "cus_target",
      address: {
        firstName: "Test",
        lastName: "",
        address1: "",
        city: "Atlanta",
        province: "GA",
        postalCode: "30338",
        countryCode: "us",
      },
    })

    expect(result).toEqual({
      ok: false,
      error: "Customer address needs a first and last name.",
    })
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("pages when a staff customer credit write fails", async () => {
    global.fetch = jest.fn(async (_url, init) => {
      if ((init as RequestInit | undefined)?.method === "POST") {
        return response(false, 503, {
          message: "Credit write failed for customer@example.com cus_target",
        })
      }
      return currentCustomerResponse()
    }) as unknown as typeof fetch

    const result = await applyStaffCustomerAccountAction({
      customerId: "cus_target",
      action: "customer_credit",
      amount: 12.5,
      reasonCode: "other",
      staffNote: "Make good credit",
      relatedOrderId: "order_123",
    })

    expect(result.ok).toBe(false)
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_customer_context_mutation_failed",
        severity: "page",
        title: "Staff customer customer credit failed",
        fingerprint: "staff_customer_context:customer_credit:failed",
        meta: expect.objectContaining({
          action: "customer_credit",
          has_customer_id: true,
          has_amount: true,
          has_related_order: true,
          qbd_posting_required: true,
          error_message: "Credit write failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })
})
