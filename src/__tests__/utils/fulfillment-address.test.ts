import {
  formatFulfillmentAddressLine,
  fulfillmentAddressesMatch,
  getActiveFulfillmentAddress,
  hasUsableFulfillmentAddress,
  normalizeFulfillmentAddress,
} from "@lib/util/fulfillment-address"

const scrambledSandySpringsAddress = {
  id: "addr_scrambled",
  address_1: "220 Glen Meadow Ct",
  city: "GA",
  province: "30328",
  postal_code: "Sandy Springs",
}

const normalizedSandySpringsAddress = {
  id: "addr_clean",
  address_1: "220 Glen Meadow Ct",
  city: "Sandy Springs",
  province: "GA",
  postal_code: "30328",
}

describe("fulfillment address helpers", () => {
  it("normalizes historically scrambled saved addresses before fulfillment checks", () => {
    expect(normalizeFulfillmentAddress(scrambledSandySpringsAddress)).toMatchObject({
      city: "Sandy Springs",
      province: "GA",
      postal_code: "30328",
    })
  })

  it("uses the normalized cart ZIP when choosing the active fulfillment address", () => {
    const activeAddress = getActiveFulfillmentAddress(
      scrambledSandySpringsAddress,
      null
    )

    expect(activeAddress?.postal_code).toBe("30328")
    expect(hasUsableFulfillmentAddress(activeAddress)).toBe(true)
  })

  it("matches scrambled and clean copies of the same saved address", () => {
    expect(
      fulfillmentAddressesMatch(
        scrambledSandySpringsAddress,
        normalizedSandySpringsAddress
      )
    ).toBe(true)
  })

  it("formats the repaired address line consistently with account address cards", () => {
    expect(formatFulfillmentAddressLine(scrambledSandySpringsAddress)).toBe(
      "220 Glen Meadow Ct, Sandy Springs, GA 30328"
    )
  })
})
