import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { getActiveStaffImpersonation } from "@lib/data/customer"
import { emitCheckoutPaymentSetupFailureAlert } from "@lib/checkout-payment-ops-alerts"
import {
  createPaymentMethodSetupIntent,
  deleteSavedPaymentMethod,
  getSavedPaymentMethods,
  listCartPaymentMethods,
  setDefaultPaymentMethod,
} from "@lib/data/payment"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(async () => ({ authorization: "Bearer customer" })),
  getCacheOptions: jest.fn(async () => ({ tags: ["payment_providers"] })),
}))

jest.mock("@lib/data/customer", () => ({
  getActiveStaffImpersonation: jest.fn(async () => null),
}))

jest.mock("@lib/server-soft-failure", () => ({
  reportServerSoftFailure: jest.fn(),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>
const sdkFetchMock = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const getAuthHeadersMock = getAuthHeaders as jest.MockedFunction<
  typeof getAuthHeaders
>
const getActiveStaffImpersonationMock =
  getActiveStaffImpersonation as jest.MockedFunction<
    typeof getActiveStaffImpersonation
  >

describe("checkout payment setup alerts", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    getAuthHeadersMock.mockResolvedValue({ authorization: "Bearer customer" })
    getActiveStaffImpersonationMock.mockResolvedValue(null)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("emits a redacted page alert for setup intent failures", async () => {
    await emitCheckoutPaymentSetupFailureAlert({
      stage: "setup_intent_request",
      reason: "request_failed",
      hasAuth: true,
      error: new Error(
        "Stripe setup failed for shopper@example.com cart_01ABC seti_secret_123"
      ),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_payment_setup_failed",
        severity: "page",
        title: "Checkout payment setup failed",
        path: "src/lib/data/payment.ts:createPaymentMethodSetupIntent",
        source: "storefront-server",
        fingerprint:
          "checkout_payment_setup_failed:setup_intent_request:request_failed",
        meta: expect.objectContaining({
          checkout_surface: "payment_setup",
          stage: "setup_intent_request",
          reason: "request_failed",
          has_auth: true,
          staff_impersonation: false,
          error_message: "Stripe setup failed for [email] [id] [id]",
        }),
      })
    )
  })

  it("alerts when the setup intent response is missing a client secret", async () => {
    sdkFetchMock.mockResolvedValueOnce({ account_holder_id: "acct_1" } as any)

    const result = await createPaymentMethodSetupIntent()

    expect(result).toEqual({
      error: "Could not start a card setup. Please try again.",
    })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_payment_setup_failed",
        severity: "page",
        fingerprint:
          "checkout_payment_setup_failed:setup_intent_response:missing_client_secret",
        meta: expect.objectContaining({
          stage: "setup_intent_response",
          reason: "missing_client_secret",
          has_auth: true,
          staff_impersonation: false,
        }),
      })
    )
  })

  it("alerts when setup intent creation throws after auth is present", async () => {
    sdkFetchMock.mockRejectedValueOnce(
      new Error("payment service unavailable for shopper@example.com")
    )

    const result = await createPaymentMethodSetupIntent()

    expect(result).toEqual({
      error: "payment service unavailable for shopper@example.com",
    })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_payment_setup_failed",
        severity: "page",
        fingerprint:
          "checkout_payment_setup_failed:setup_intent_request:request_failed",
        meta: expect.objectContaining({
          stage: "setup_intent_request",
          reason: "request_failed",
          has_auth: true,
          error_message: "payment service unavailable for [email]",
        }),
      })
    )
  })

  it("does not alert for the normal unsigned customer path", async () => {
    getAuthHeadersMock.mockResolvedValueOnce({})

    const result = await createPaymentMethodSetupIntent()

    expect(result).toEqual({ error: "You must be signed in to add a card." })
    expect(sdkFetchMock).not.toHaveBeenCalled()
    expect(emitStorefrontOpsAlertMock).not.toHaveBeenCalled()
  })

  it("alerts when checkout has no payment providers for the region", async () => {
    sdkFetchMock.mockResolvedValueOnce({ payment_providers: [] } as any)

    const result = await listCartPaymentMethods("reg_test")

    expect(result).toEqual([])
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_payment_methods_unavailable",
        severity: "page",
        title: "Checkout payment methods unavailable",
        path: "src/lib/data/payment.ts:listCartPaymentMethods",
        source: "storefront-server",
        fingerprint: "checkout_payment_methods_unavailable:no_payment_providers",
        meta: expect.objectContaining({
          checkout_surface: "payment_methods",
          reason: "no_payment_providers",
          region_id: "reg_test",
          provider_count: 0,
          provider_ids: [],
        }),
      })
    )
  })

  it("alerts when checkout payment providers do not include Stripe card", async () => {
    sdkFetchMock.mockResolvedValueOnce({
      payment_providers: [{ id: "pp_system_default" }],
    } as any)

    const result = await listCartPaymentMethods("reg_test")

    expect(result).toEqual([{ id: "pp_system_default" }])
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_payment_methods_unavailable",
        severity: "page",
        fingerprint:
          "checkout_payment_methods_unavailable:stripe_card_provider_missing",
        meta: expect.objectContaining({
          reason: "stripe_card_provider_missing",
          region_id: "reg_test",
          provider_count: 1,
          provider_ids: ["pp_system_default"],
        }),
      })
    )
  })

  it("does not alert when checkout has the Stripe card provider", async () => {
    sdkFetchMock.mockResolvedValueOnce({
      payment_providers: [{ id: "pp_stripe_stripe" }],
    } as any)

    const result = await listCartPaymentMethods("reg_test")

    expect(result).toEqual([{ id: "pp_stripe_stripe" }])
    expect(emitStorefrontOpsAlertMock).not.toHaveBeenCalled()
  })

  it("alerts when saved payment method listing fails after auth", async () => {
    sdkFetchMock.mockRejectedValueOnce(
      new Error("payment methods list failed for shopper@example.com pm_123")
    )

    const result = await getSavedPaymentMethods()

    expect(result).toEqual([])
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "saved_payment_method_failed",
        severity: "warn",
        title: "Saved payment method action failed",
        path: "src/lib/data/payment.ts:saved-payment-methods",
        source: "storefront-server",
        fingerprint: "saved_payment_method_failed:list:payment_methods_list",
        meta: expect.objectContaining({
          account_surface: "saved_payment_methods",
          operation: "list",
          stage: "payment_methods_list",
          has_auth: true,
          staff_impersonation: false,
          has_payment_method_id: false,
          error_message: "payment methods list failed for [email] [id]",
        }),
      })
    )
  })

  it("does not alert when saved payment methods are requested unsigned", async () => {
    getAuthHeadersMock.mockResolvedValueOnce({})

    const result = await getSavedPaymentMethods()

    expect(result).toEqual([])
    expect(sdkFetchMock).not.toHaveBeenCalled()
    expect(emitStorefrontOpsAlertMock).not.toHaveBeenCalled()
  })

  it("alerts with staff context when setting a saved payment method default fails", async () => {
    getActiveStaffImpersonationMock.mockResolvedValueOnce({
      session: {
        targetCustomerId: "cus_target",
        staffCustomerId: "cus_staff",
      },
    } as any)
    sdkFetchMock.mockRejectedValueOnce(
      new Error("default failed for staff@example.com pm_123")
    )

    const result = await setDefaultPaymentMethod("pm_123")

    expect(result).toEqual({
      success: false,
      error: "default failed for staff@example.com pm_123",
    })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "saved_payment_method_failed",
        severity: "warn",
        fingerprint:
          "saved_payment_method_failed:set_default:payment_method_default",
        meta: expect.objectContaining({
          account_surface: "saved_payment_methods",
          operation: "set_default",
          stage: "payment_method_default",
          has_auth: true,
          staff_impersonation: true,
          has_payment_method_id: true,
          error_message: "default failed for [email] [id]",
        }),
      })
    )
  })

  it("alerts and returns an error when deleting a saved payment method fails", async () => {
    sdkFetchMock.mockRejectedValueOnce(
      new Error("delete failed for shopper@example.com pm_456")
    )

    const result = await deleteSavedPaymentMethod("pm_456")

    expect(result).toEqual({
      success: false,
      error: "delete failed for shopper@example.com pm_456",
    })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "saved_payment_method_failed",
        severity: "warn",
        fingerprint:
          "saved_payment_method_failed:delete:payment_method_delete",
        meta: expect.objectContaining({
          account_surface: "saved_payment_methods",
          operation: "delete",
          stage: "payment_method_delete",
          has_auth: true,
          staff_impersonation: false,
          has_payment_method_id: true,
          error_message: "delete failed for [email] [id]",
        }),
      })
    )
  })
})
