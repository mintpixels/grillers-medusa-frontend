import {
  formatFreeShippingThreshold,
  freeShippingPlainText,
  getFreeShippingState,
  getResolvedFreeShippingThresholds,
} from "@lib/util/free-shipping"

describe("free shipping threshold resolution", () => {
  it("honors editable in-region and national thresholds", () => {
    expect(
      getResolvedFreeShippingThresholds({
        inRegionThreshold: 350,
        nationalThreshold: 650,
      })
    ).toEqual({
      inRegionThreshold: 350,
      nationalThreshold: 650,
    })
  })

  it("falls back to safe defaults for missing or invalid thresholds", () => {
    expect(
      getResolvedFreeShippingThresholds({
        inRegionThreshold: 0,
        nationalThreshold: null,
      })
    ).toEqual({
      inRegionThreshold: 250,
      nationalThreshold: 500,
    })
  })

  it("uses the resolved threshold in progress state and plain copy", () => {
    const state = getFreeShippingState({
      subtotal: 260,
      shipState: "GA",
      inRegionThreshold: 350,
    })

    expect(state.threshold).toBe(350)
    expect(state.qualified).toBe(false)
    expect(state.remaining).toBe(90)
    expect(
      freeShippingPlainText({
        subtotal: 260,
        shipState: "GA",
        inRegionThreshold: 350,
      })
    ).toContain("$90 away")
  })

  it("formats threshold labels without cents", () => {
    expect(formatFreeShippingThreshold(350)).toBe("$350")
    expect(formatFreeShippingThreshold(1500)).toBe("$1,500")
  })
})
