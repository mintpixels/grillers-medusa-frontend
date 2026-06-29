jest.mock("server-only", () => ({}))

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { retrieveAuthenticatedCustomer } from "@lib/data/customer"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
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

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

const mockGetAuthHeaders = getAuthHeaders as jest.MockedFunction<
  typeof getAuthHeaders
>
const mockSdkFetch = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("authenticated customer load alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("does not alert when no auth token is present", async () => {
    mockGetAuthHeaders.mockResolvedValue({} as any)

    await expect(retrieveAuthenticatedCustomer()).resolves.toBeNull()

    expect(mockSdkFetch).not.toHaveBeenCalled()
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("alerts when an authenticated customer read fails with a server error", async () => {
    mockGetAuthHeaders.mockResolvedValue({ authorization: "Bearer test" } as any)
    mockSdkFetch.mockRejectedValueOnce({
      status: 503,
      message: "Medusa customer read failed for shopper@example.com pi_123",
    })

    await expect(retrieveAuthenticatedCustomer()).resolves.toBeNull()

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "account_customer_load_failed",
        severity: "page",
        title: "Authenticated customer context failed to load",
        path: "src/lib/data/customer.ts:retrieveAuthenticatedCustomer",
        source: "storefront-server",
        fingerprint: "account_customer_load_failed:503",
        meta: expect.objectContaining({
          account_surface: "authenticated_customer",
          route_dependency: "/store/customers/me",
          response_status: 503,
          error_message:
            "Medusa customer read failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })

  it("does not alert for ordinary auth denials", async () => {
    mockGetAuthHeaders.mockResolvedValue({ authorization: "Bearer expired" } as any)
    mockSdkFetch.mockRejectedValueOnce({
      status: 401,
      message: "Unauthorized",
    })

    await expect(retrieveAuthenticatedCustomer()).resolves.toBeNull()

    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})
