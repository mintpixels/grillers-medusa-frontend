import {
  parsePerLbUnitPrice,
  replacementPriceLabel,
  replacementUnitPrice,
} from "@modules/staff/components/catch-weight-finalization-console/replacement-pricing"

describe("staff replacement pricing", () => {
  it("extracts per-pound replacement prices from customer-safe product titles", () => {
    expect(
      parsePerLbUnitPrice(
        "First Cut Brisket (2-3 lb) American Angus Uncooked, Kosher for Passover. $14.99 lb."
      )
    ).toBe(14.99)

    expect(
      parsePerLbUnitPrice(
        "Kosher Packer Brisket, Deckel On, Untrimmed, 14-17 lb., American Angus.$13.55/lb."
      )
    ).toBe(13.55)
  })

  it("prefers per-pound price over estimated pack amount", () => {
    const product = {
      title:
        "First Cut Brisket (2-3 lb) American Angus Uncooked, Kosher for Passover. $14.99 lb.",
      calculatedAmount: 37.47,
      currencyCode: "usd",
    }

    expect(replacementUnitPrice(product)).toBe(14.99)
    expect(replacementPriceLabel(product)).toBe("$14.99 / lb")
  })

  it("falls back to calculated amount for fixed-price replacements", () => {
    const product = {
      title: "Prepared side dish",
      calculatedAmount: 18,
      currencyCode: "usd",
    }

    expect(replacementUnitPrice(product)).toBe(18)
    expect(replacementPriceLabel(product)).toBe("$18.00")
  })
})
