import {
  formatStaffMoney,
  staffCapturedCurrencyAmount,
  staffCurrencyAmount,
  staffMinorUnitsFromCurrency,
  staffPositiveCurrencyAmount,
} from "@lib/data/staff/money"

describe("staff money helpers", () => {
  it("keeps Medusa dollar amounts as dollars for display", () => {
    expect(staffCurrencyAmount(169.8)).toBe(169.8)
    expect(formatStaffMoney(169.8, "usd")).toBe("$169.80")
  })

  it("rounds tax-precision amounts to currency cents", () => {
    expect(staffCurrencyAmount(91.47975)).toBe(91.48)
    expect(formatStaffMoney(91.47975, "usd")).toBe("$91.48")
  })

  it("only converts to minor units for QuickBooks posting metadata", () => {
    expect(staffPositiveCurrencyAmount("25.00")).toBe(25)
    expect(staffMinorUnitsFromCurrency("25.00")).toBe(2500)
  })

  it("does not treat authorized-only payments as captured", () => {
    expect(
      staffCapturedCurrencyAmount({
        paymentAmount: 91.47975,
        status: "authorized",
      })
    ).toBe(0)
    expect(
      staffCapturedCurrencyAmount({
        paymentAmount: 91.47975,
        status: "captured",
      })
    ).toBe(91.48)
    expect(
      staffCapturedCurrencyAmount({
        capturedAmount: 50,
        paymentAmount: 91.47975,
        status: "authorized",
      })
    ).toBe(50)
  })

  it("rejects non-positive staff action amounts", () => {
    expect(() => staffPositiveCurrencyAmount(0)).toThrow(
      "Enter a positive amount."
    )
    expect(() => staffMinorUnitsFromCurrency("-1.00")).toThrow(
      "Enter a positive amount."
    )
  })
})
