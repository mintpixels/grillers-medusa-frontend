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

  it("allows managed variants with positive inventory", () => {
    expect(
      isVariantPurchasable({
        manage_inventory: true,
        allow_backorder: false,
        inventory_quantity: 3,
      })
    ).toBe(true)
  })

  it("fails open when inventory quantity is unobserved", () => {
    // No numeric quantity means enrichment has not run (or failed) for this
    // surface. Fail open so unenriched/transient surfaces don't render a
    // store-wide false "Out of stock"; the server-side ATP gate in place-order
    // is the authoritative oversell backstop.
    expect(isVariantPurchasable({ manage_inventory: true })).toBe(true)
    expect(isVariantPurchasable({})).toBe(true)
  })

  it("blocks a missing variant", () => {
    expect(isVariantPurchasable(null)).toBe(false)
    expect(isVariantPurchasable(undefined)).toBe(false)
  })
})
