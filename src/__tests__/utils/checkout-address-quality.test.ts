import {
  repairCheckoutAddressForWrite,
  reportCheckoutAddressRepair,
} from "@lib/checkout-address-quality"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("checkout address quality guard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("repairs the historical city/state/ZIP scramble before writes", () => {
    const result = repairCheckoutAddressForWrite({
      address_1: "220 Glen Meadow Ct",
      city: "GA",
      province: "30328",
      postal_code: "Sandy Springs",
    })

    expect(result.repaired).toBe(true)
    expect(result.address).toMatchObject({
      city: "Sandy Springs",
      province: "GA",
      postal_code: "30328",
    })
    expect(result.raw).toEqual({
      city: "GA",
      province: "30328",
      postal_code: "Sandy Springs",
    })
    expect(result.normalized).toEqual({
      city: "Sandy Springs",
      province: "GA",
      postal_code: "30328",
    })
  })

  it("leaves correctly shaped addresses alone", () => {
    const address = {
      address_1: "143 South Hayworth Avenue",
      city: "Los Angeles",
      province: "CA",
      postal_code: "90048",
    }

    const result = repairCheckoutAddressForWrite(address)

    expect(result.repaired).toBe(false)
    expect(result.address).toBe(address)
  })

  it("emits a fail-open ops alert when a scrambled write is repaired", () => {
    const result = repairCheckoutAddressForWrite({
      city: "GA",
      province: "30328",
      postal_code: "Sandy Springs",
    })

    reportCheckoutAddressRepair({
      surface: "checkout_submit_shipping",
      path: "src/lib/data/cart.ts:setAddresses",
      result,
      cartId: "cart_123",
      staffContext: true,
      targetCustomerId: "cus_target",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_address_scramble_repaired",
        severity: "info",
        path: "src/lib/data/cart.ts:setAddresses",
        meta: expect.objectContaining({
          surface: "checkout_submit_shipping",
          cart_id: "cart_123",
          staff_context: true,
          target_customer_id: "cus_target",
          raw_city: "GA",
          raw_province: "30328",
          raw_postal_code: "Sandy Springs",
          normalized_city: "Sandy Springs",
          normalized_province: "GA",
          normalized_postal_code: "30328",
        }),
      })
    )
  })

  it("does not alert for correctly shaped address writes", () => {
    const result = repairCheckoutAddressForWrite({
      city: "Los Angeles",
      province: "CA",
      postal_code: "90048",
    })

    reportCheckoutAddressRepair({
      surface: "checkout_submit_shipping",
      path: "src/lib/data/cart.ts:setAddresses",
      result,
    })

    expect(emitStorefrontOpsAlertMock).not.toHaveBeenCalled()
  })
})
