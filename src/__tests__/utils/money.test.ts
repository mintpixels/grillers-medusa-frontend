import { convertToLocale, formatAmount } from "@lib/util/money"

describe("Money Utilities", () => {
  describe("convertToLocale", () => {
    it("should format USD amounts correctly", () => {
      const result = convertToLocale({
        amount: 1999,
        currency_code: "usd",
      })
      expect(result).toMatch(/\$19\.99/)
    })

    it("should format EUR amounts correctly", () => {
      const result = convertToLocale({
        amount: 2500,
        currency_code: "eur",
      })
      expect(result).toMatch(/25/)
    })

    it("should handle zero amounts", () => {
      const result = convertToLocale({
        amount: 0,
        currency_code: "usd",
      })
      expect(result).toMatch(/\$0\.00/)
    })

    it("should handle large amounts", () => {
      const result = convertToLocale({
        amount: 100000,
        currency_code: "usd",
      })
      expect(result).toMatch(/1,000/)
    })
  })

  describe("formatAmount", () => {
    it("should format amount with default options", () => {
      const result = formatAmount(1999)
      expect(typeof result).toBe("string")
    })
  })
})
