import {
  isCatalogLifecyclePurchasable,
  isWaitlistEligible,
  shouldShowBackInStockForm,
} from "@lib/util/waitlist-eligibility"

const baseProduct = {
  id: "prod_123",
  handle: "ground-beef",
}

const baseVariant = {
  id: "variant_123",
}

describe("waitlist eligibility", () => {
  it("shows the back-in-stock form for normal zero-inventory products", () => {
    expect(
      shouldShowBackInStockForm({
        inStock: false,
        product: baseProduct,
        selectedVariant: baseVariant,
      })
    ).toBe(true)
  })

  it("does not show the form while a selected variant is in stock", () => {
    expect(
      shouldShowBackInStockForm({
        inStock: true,
        product: baseProduct,
        selectedVariant: baseVariant,
      })
    ).toBe(false)
  })

  it("blocks waitlist capture when Strapi product metadata disables it", () => {
    expect(
      shouldShowBackInStockForm({
        inStock: false,
        product: baseProduct,
        selectedVariant: baseVariant,
        strapiProduct: { WaitlistEnabled: false },
      })
    ).toBe(false)
  })

  it("lets variant-level metadata override product-level defaults", () => {
    expect(
      isWaitlistEligible({
        strapiProduct: { WaitlistEnabled: false },
        strapiVariant: { WaitlistEnabled: true },
      })
    ).toBe(true)
  })

  it("blocks seasonal inactive catalog items even if inventory is zero", () => {
    expect(
      shouldShowBackInStockForm({
        inStock: false,
        product: baseProduct,
        selectedVariant: baseVariant,
        strapiProduct: { AvailabilityLifecycle: "seasonal_inactive" },
      })
    ).toBe(false)
  })

  it("keeps active out-of-stock products purchasable-gated only by inventory", () => {
    expect(
      isCatalogLifecyclePurchasable({
        strapiProduct: { AvailabilityLifecycle: "active" },
      })
    ).toBe(true)

    expect(
      isCatalogLifecyclePurchasable({
        strapiProduct: { AvailabilityLifecycle: "seasonal_inactive" },
      })
    ).toBe(false)
  })

  it("reads Medusa metadata flags when Strapi fields are absent", () => {
    expect(
      shouldShowBackInStockForm({
        inStock: false,
        product: {
          ...baseProduct,
          metadata: { waitlist_enabled: "false" },
        },
        selectedVariant: baseVariant,
      })
    ).toBe(false)
  })
})
