jest.mock("server-only", () => ({}))

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import {
  requestPasswordReset,
  retrieveAuthenticatedCustomer,
} from "@lib/data/customer"
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
  const originalFetch = global.fetch
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      MEDUSA_BACKEND_URL: "https://backend.example.test",
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test_unit",
    }
    global.fetch = originalFetch
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
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

describe("password reset request alerts", () => {
  const originalFetch = global.fetch
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      MEDUSA_BACKEND_URL: "https://backend.example.test",
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test_unit",
    }
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it("does not alert when the backend accepts the neutral password reset request", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 201,
      statusText: "Created",
    })) as unknown as typeof fetch

    await requestPasswordReset("shopper@example.com")

    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.test/store/forgot-password",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-publishable-api-key": "pk_test_unit",
        }),
      })
    )
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("alerts when the backend rejects a password reset request after submission", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Postmark rejected reset for shopper@example.com",
    })) as unknown as typeof fetch

    await requestPasswordReset("shopper@example.com")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "password_reset_request_failed",
        severity: "warn",
        title: "Password reset request failed behind neutral response",
        path: "src/lib/data/customer.ts:requestPasswordReset",
        source: "storefront-server",
        fingerprint: "password_reset_request_failed:backend_rejected:500",
        meta: expect.objectContaining({
          account_surface: "password_reset_request",
          route_dependency: "/store/forgot-password",
          failure_stage: "backend_rejected",
          response_status: 500,
          response_body: "Postmark rejected reset for [redacted-email]",
          error_message: null,
        }),
      })
    )
  })

  it("alerts when the password reset request cannot reach the backend", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("network timeout for shopper@example.com"))

    await requestPasswordReset("shopper@example.com")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "password_reset_request_failed",
        fingerprint: "password_reset_request_failed:request_failed:transport",
        meta: expect.objectContaining({
          failure_stage: "request_failed",
          response_status: null,
          response_body: null,
          error_message: "network timeout for [redacted-email]",
        }),
      })
    )
  })

  it("does not alert on backend validation denials that do not indicate an outage", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "email is required",
    })) as unknown as typeof fetch

    await requestPasswordReset("not-an-email")

    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})
