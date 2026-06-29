import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { emitCheckoutFulfillmentOptionsFailureAlert } from "@lib/checkout-fulfillment-options-alerts"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { sdk } from "@lib/config"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(async () => ({ authorization: "Bearer test" })),
  getCacheOptions: jest.fn(async () => ({ tags: ["fulfillment"] })),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>
const sdkFetchMock = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>

describe("checkout fulfillment options alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a redacted warning when checkout fulfillment options fail", async () => {
    await emitCheckoutFulfillmentOptionsFailureAlert({
      stage: "all_fulfillment_options",
      cartId: "cart_123",
      error: new Error(
        "Shipping lookup failed for shopper@example.com and cart_abc123"
      ),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_fulfillment_options_failed",
        severity: "warn",
        title: "Checkout fulfillment options unavailable",
        path: "src/lib/data/fulfillment.ts",
        source: "storefront-server",
        fingerprint: "checkout:fulfillment_options:all_fulfillment_options",
        meta: expect.objectContaining({
          checkout_surface: "checkout",
          stage: "all_fulfillment_options",
          cart_id: "cart_123",
          error_message:
            "Shipping lookup failed for [email] and [id]",
        }),
      })
    )
  })

  it("returns the existing null fallback and schedules an alert when cart shipping methods cannot load", async () => {
    sdkFetchMock.mockRejectedValueOnce(
      new Error("Medusa unavailable for cart_failed")
    )

    const result = await listCartShippingMethods("cart_failed")
    await Promise.resolve()

    expect(result).toBeNull()
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_fulfillment_options_failed",
        title: "Checkout cart shipping methods unavailable",
        fingerprint: "checkout:fulfillment_options:cart_shipping_methods",
        meta: expect.objectContaining({
          stage: "cart_shipping_methods",
          cart_id: "cart_failed",
          error_message: "Medusa unavailable for [id]",
        }),
      })
    )
  })
})
