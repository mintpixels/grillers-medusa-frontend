import { isVariantPurchasable } from "@lib/util/product-availability"

describe("isVariantPurchasable", () => {
  it("allows unmanaged inventory and backorder variants", () => {
    expect(isVariantPurchasable({ manage_inventory: false, inventory_quantity: 0 })).toBe(true)
    expect(isVariantPurchasable({ allow_backorder: true, inventory_quantity: 0 })).toBe(true)
  })

  it("blocks managed variants with zero inventory", () => {
    expect(
      isVariantPurchasable({
        manage_inventory: true,
        allow_backorder: false,
        inventory_quantity: 0,
      })
    ).toBe(false)
  })

  it("does not block when inventory quantity is not present", () => {
    expect(isVariantPurchasable({ manage_inventory: true })).toBe(true)
  })
})

