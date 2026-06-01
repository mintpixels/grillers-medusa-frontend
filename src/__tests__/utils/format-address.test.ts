import { formatCityStateZip, unscrambleAddress } from "@lib/util/format-address"

describe("address formatting", () => {
  it("repairs the historical city/state/ZIP scramble at read time", () => {
    const fixed = unscrambleAddress({
      address_1: "220 Glen Meadow Ct",
      city: "GA",
      province: "30328",
      postal_code: "Sandy Springs",
      country_code: "us",
    })

    expect(fixed).toMatchObject({
      city: "Sandy Springs",
      province: "GA",
      postal_code: "30328",
    })
    expect(formatCityStateZip(fixed)).toBe("Sandy Springs, GA 30328")
  })
})
