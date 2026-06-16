import { applyPromotions } from "@lib/data/cart"
import { sdk } from "@lib/config"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { syncFreeShippingPromotion } from "@lib/data/free-shipping-promo"

jest.mock("@lib/data/cart", () => ({
  applyPromotions: jest.fn(),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    store: {
      cart: {
        retrieve: jest.fn(),
      },
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(async () => ({})),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

// #266: free-shipping-promo now reads the Strapi UPS thresholds. Mock it so the
// suite doesn't pull graphql-request (ESM) into Jest; null → the constant
// thresholds, which is what this alerting test already assumes.
jest.mock("@lib/data/strapi/checkout", () => ({
  getFreeShippingThresholds: jest.fn(async () => ({
    inRegionThreshold: null,
    nationalThreshold: null,
  })),
}))

describe("syncFreeShippingPromotion alerting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits ops.alert when promotion application fails", async () => {
    ;(applyPromotions as jest.Mock).mockRejectedValue(new Error("promo api down"))

    await expect(
      syncFreeShippingPromotion({
        id: "cart_alert_apply",
        subtotal: 200,
        items: [{ subtotal: 200, metadata: {} }],
        metadata: { fulfillmentType: "plant_pickup" },
        promotions: [],
      } as any)
    ).rejects.toThrow("Free-shipping promotion sync failed")

    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "free_shipping_promo_apply_failed",
        path: "src/lib/data/free-shipping-promo.ts",
        meta: expect.objectContaining({
          cart_id: "cart_alert_apply",
          desired_auto_codes: ["PLANTPICKUP750"],
        }),
      })
    )
  })

  it("emits ops.alert when attached promotions do not match the requested auto codes", async () => {
    ;(applyPromotions as jest.Mock).mockResolvedValue(undefined)
    ;(sdk.store.cart.retrieve as jest.Mock).mockResolvedValue({
      cart: {
        promotions: [],
      },
    })

    await expect(
      syncFreeShippingPromotion({
        id: "cart_alert_mismatch",
        subtotal: 200,
        items: [{ subtotal: 200, metadata: {} }],
        metadata: { fulfillmentType: "plant_pickup" },
        promotions: [],
      } as any)
    ).rejects.toThrow("Free-shipping promotion sync failed")

    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "free_shipping_promo_mismatch",
        path: "src/lib/data/free-shipping-promo.ts",
        meta: expect.objectContaining({
          cart_id: "cart_alert_mismatch",
          expected_auto_codes: ["PLANTPICKUP750"],
          attached_after: [],
        }),
      })
    )
  })
})
