jest.mock("server-only", () => ({}))

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag, getCartId } from "@lib/data/cookies"
import {
  loginWithCredentials,
  requestPasswordReset,
  retrieveAuthenticatedCustomer,
  saveCartAddressesToAccount,
} from "@lib/data/customer"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { revalidateTag } from "next/cache"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
    store: {
      customer: {
        createAddress: jest.fn(),
        retrieve: jest.fn(),
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
const mockGetCacheTag = getCacheTag as jest.MockedFunction<typeof getCacheTag>
const mockGetCartId = getCartId as jest.MockedFunction<typeof getCartId>
const mockSdkFetch = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const mockCreateAddress = sdk.store.customer.createAddress as jest.MockedFunction<
  typeof sdk.store.customer.createAddress
>
const mockRetrieveCustomer = sdk.store.customer.retrieve as jest.MockedFunction<
  typeof sdk.store.customer.retrieve
>
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>
const mockRevalidateTag = revalidateTag as jest.MockedFunction<
  typeof revalidateTag
>

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

describe("legacy login fallback alerts", () => {
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

  it("alerts when legacy login fallback gets a backend outage response", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Legacy DB failed for shopper@example.com auth_123",
    })) as unknown as typeof fetch

    await expect(
      loginWithCredentials("legacy-shopper", "correct horse battery staple")
    ).resolves.toEqual({
      success: false,
      error: "Invalid login or password",
    })

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "legacy_login_fallback_failed",
        severity: "page",
        title: "Legacy login fallback failed behind invalid-login response",
        path: "src/lib/data/customer.ts:requestLegacyAuthToken",
        source: "storefront-server",
        fingerprint: "legacy_login_fallback_failed:backend_rejected:500",
        meta: expect.objectContaining({
          account_surface: "legacy_login_fallback",
          route_dependency: "/store/legacy-auth/login",
          identifier_kind: "legacy_identifier",
          failure_stage: "backend_rejected",
          response_status: 500,
          response_body: "Legacy DB failed for [redacted-email] [redacted-id]",
          error_message: null,
        }),
      })
    )
  })

  it("alerts when legacy login fallback cannot reach the backend", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("legacy auth timeout for auth_123"))

    await expect(
      loginWithCredentials("legacy-shopper", "password")
    ).resolves.toEqual({
      success: false,
      error: "Invalid login or password",
    })

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "legacy_login_fallback_failed",
        fingerprint: "legacy_login_fallback_failed:request_failed:transport",
        meta: expect.objectContaining({
          identifier_kind: "legacy_identifier",
          failure_stage: "request_failed",
          response_status: null,
          response_body: null,
          error_message: "legacy auth timeout for [redacted-id]",
        }),
      })
    )
  })

  it("does not alert when legacy login rejects invalid credentials", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Invalid login or password",
    })) as unknown as typeof fetch

    await loginWithCredentials("legacy-shopper", "wrong-password")

    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})

describe("cart address persistence alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAuthHeaders.mockResolvedValue({ authorization: "Bearer test" } as any)
    mockGetCacheTag.mockResolvedValue("customers")
    mockGetCartId.mockResolvedValue("cart_123")
    mockSdkFetch.mockResolvedValue({
      cart: {
        shipping_address: {
          first_name: "Shopper",
          last_name: "Example",
          address_1: "1 Main St",
          city: "Atlanta",
          province: "GA",
          postal_code: "30328",
          country_code: "us",
          phone: "(404) 555-1212",
        },
        billing_address: null,
      },
    } as any)
    mockRetrieveCustomer.mockResolvedValue({
      customer: { addresses: [] },
    } as any)
    mockCreateAddress.mockResolvedValue({} as any)
  })

  it("does not alert when there is no cart address to persist", async () => {
    mockGetCartId.mockResolvedValueOnce(undefined)

    await saveCartAddressesToAccount()

    expect(mockSdkFetch).not.toHaveBeenCalled()
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("saves the shipping address without alerting when dependencies succeed", async () => {
    await saveCartAddressesToAccount()

    expect(mockCreateAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        address_1: "1 Main St",
        phone: "4045551212",
        is_default_shipping: true,
        is_default_billing: true,
      }),
      {},
      expect.objectContaining({ authorization: "Bearer test" })
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith("customers")
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("alerts and redacts when saving the cart address fails", async () => {
    mockCreateAddress.mockRejectedValueOnce(
      new Error("Medusa failed for shopper@example.com cus_123")
    )

    await saveCartAddressesToAccount()

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "account_cart_address_persist_failed",
        severity: "warn",
        title: "Cart address was not saved to customer account",
        path: "src/lib/data/customer.ts:saveCartAddressesToAccount",
        source: "storefront-server",
        fingerprint:
          "account_cart_address_persist_failed:shipping_address_create",
        meta: expect.objectContaining({
          account_surface: "signup_cart_address_persistence",
          stage: "shipping_address_create",
          cart_id: "cart_123",
          has_shipping_address: true,
          attempted_shipping_address: true,
          attempted_billing_address: false,
          error_message: "Medusa failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })
})
