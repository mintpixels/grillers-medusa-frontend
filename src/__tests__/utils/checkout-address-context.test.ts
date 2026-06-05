import { saveAddressToProfileAndCart } from "@lib/data/customer"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag, getStaffImpersonationCartId } from "@lib/data/cookies"
import { readStaffImpersonationCookie } from "@lib/data/staff/session-cookie"
import { adminFetch, retrieveAdminCustomer } from "@lib/data/staff/admin"
import { revalidateTag } from "next/cache"

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
    store: {
      cart: {
        update: jest.fn(),
      },
      customer: {
        createAddress: jest.fn(),
        updateAddress: jest.fn(),
      },
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(),
  getCacheTag: jest.fn(),
  getCartId: jest.fn(),
  getStaffImpersonationCartId: jest.fn(),
  removeAuthToken: jest.fn(),
  removeCartId: jest.fn(),
  setAuthToken: jest.fn(),
  setCartId: jest.fn(),
}))

jest.mock("@lib/data/staff/session-cookie", () => ({
  clearStaffImpersonationCookie: jest.fn(),
  readStaffImpersonationCookie: jest.fn(),
}))

jest.mock("@lib/data/staff/admin", () => ({
  adminFetch: jest.fn(),
  appendStaffAuditLog: (metadata: Record<string, unknown> = {}, entry: any) => ({
    ...metadata,
    staff_audit_log: JSON.stringify([entry]),
  }),
  retrieveAdminCustomer: jest.fn(),
  staffAuditFields: (_session: any, action: string, extra = {}) => ({
    staff_action: action,
    ...extra,
  }),
}))

const mockedSdk = sdk as jest.Mocked<typeof sdk>
const mockedClientFetch = mockedSdk.client.fetch as jest.Mock
const mockedCartUpdate = mockedSdk.store.cart.update as jest.Mock
const mockedGetAuthHeaders = getAuthHeaders as jest.MockedFunction<
  typeof getAuthHeaders
>
const mockedGetCacheTag = getCacheTag as jest.MockedFunction<typeof getCacheTag>
const mockedGetStaffImpersonationCartId =
  getStaffImpersonationCartId as jest.MockedFunction<
    typeof getStaffImpersonationCartId
  >
const mockedReadStaffImpersonationCookie =
  readStaffImpersonationCookie as jest.MockedFunction<
    typeof readStaffImpersonationCookie
  >
const mockedAdminFetch = adminFetch as jest.MockedFunction<typeof adminFetch>
const mockedRetrieveAdminCustomer =
  retrieveAdminCustomer as jest.MockedFunction<typeof retrieveAdminCustomer>
const mockedRevalidateTag = revalidateTag as jest.MockedFunction<
  typeof revalidateTag
>

describe("checkout address customer context", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetAuthHeaders.mockResolvedValue({ authorization: "Bearer staff" })
    mockedGetCacheTag.mockImplementation(async (tag) => tag)
    mockedClientFetch.mockResolvedValue({
      customer: {
        id: "cus_staff",
        email: "staff@example.com",
        metadata: { gp_staff_role: "office" },
      },
    })
    mockedReadStaffImpersonationCookie.mockResolvedValue({
      staffCustomerId: "cus_staff",
      staffEmail: "staff@example.com",
      staffName: "Staff",
      targetCustomerId: "cus_target",
      targetEmail: "meyer@example.com",
      targetName: "Meyer Greenberg",
      startedAt: "2026-06-04T20:00:00.000Z",
      expiresAt: Date.parse("2026-06-04T21:00:00.000Z"),
    })
    mockedRetrieveAdminCustomer.mockResolvedValue({
      id: "cus_target",
      email: "meyer@example.com",
      metadata: {},
      addresses: [
        {
          id: "addr_1",
          address_1: "143 South Hayworth Avenue",
          city: "Los Angeles",
          province: "CA",
          postal_code: "90048",
        },
      ],
    })
    mockedGetStaffImpersonationCartId.mockResolvedValue("cart_staff")
    mockedAdminFetch.mockResolvedValue({} as never)
    mockedCartUpdate.mockResolvedValue({})
  })

  it("updates the target customer's saved address and the staff-context cart", async () => {
    const result = await saveAddressToProfileAndCart({
      address_id: "addr_1",
      first_name: "Meyer",
      last_name: "Greenberg",
      address_1: "143 South Hayworth Avenue",
      city: "Los Angeles",
      province: "CA",
      postal_code: "90048",
      phone: "(404) 643-1567",
    })

    expect(result).toEqual({ success: true, error: null })
    expect(mockedAdminFetch).toHaveBeenCalledWith(
      "/admin/customers/cus_target/addresses/addr_1",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"phone\":\"4046431567\""),
      })
    )
    expect(mockedCartUpdate).toHaveBeenCalledWith(
      "cart_staff",
      expect.objectContaining({
        shipping_address: expect.objectContaining({
          address_1: "143 South Hayworth Avenue",
          phone: "4046431567",
        }),
        billing_address: expect.objectContaining({
          postal_code: "90048",
        }),
      }),
      {},
      expect.objectContaining({
        authorization: "Bearer staff",
        "x-gp-staff-actor-customer-id": "cus_staff",
        "x-gp-staff-target-customer-id": "cus_target",
      })
    )
    expect(mockedRevalidateTag).toHaveBeenCalledWith("customers")
    expect(mockedRevalidateTag).toHaveBeenCalledWith("carts")
    expect(mockedRevalidateTag).toHaveBeenCalledWith("fulfillment")
  })
})
