import {
  isAtlantaZip,
  isFulfillmentTypeRegionValid,
} from "@lib/util/fulfillment-eligibility"

const ATLANTA = ["30328", "30342", "30009"]

describe("isAtlantaZip", () => {
  it("matches a clean 5-digit Atlanta ZIP", () => {
    expect(isAtlantaZip("30328", ATLANTA)).toBe(true)
  })

  it("matches a ZIP+4 Atlanta ZIP (normalizes to 5 digits)", () => {
    expect(isAtlantaZip("30328-1234", ATLANTA)).toBe(true)
  })

  it("rejects a non-Atlanta ZIP", () => {
    expect(isAtlantaZip("90048", ATLANTA)).toBe(false)
  })

  it("rejects blank / short / nullish input", () => {
    expect(isAtlantaZip("", ATLANTA)).toBe(false)
    expect(isAtlantaZip("303", ATLANTA)).toBe(false)
    expect(isAtlantaZip(null, ATLANTA)).toBe(false)
    expect(isAtlantaZip(undefined, ATLANTA)).toBe(false)
  })

  it("normalizes the configured list too", () => {
    expect(isAtlantaZip("30328", ["30328-9999"])).toBe(true)
  })
})

describe("isFulfillmentTypeRegionValid", () => {
  const opts = { atlantaZipCodes: ATLANTA }

  it("UPS is INVALID for an Atlanta-area ZIP (the reported bug)", () => {
    expect(isFulfillmentTypeRegionValid("ups_shipping", "30328", opts)).toBe(
      false
    )
  })

  it("UPS is valid for an out-of-region ZIP", () => {
    expect(isFulfillmentTypeRegionValid("ups_shipping", "90048", opts)).toBe(
      true
    )
  })

  it("Atlanta delivery is valid only for an Atlanta ZIP", () => {
    expect(
      isFulfillmentTypeRegionValid("atlanta_delivery", "30328", opts)
    ).toBe(true)
    expect(
      isFulfillmentTypeRegionValid("atlanta_delivery", "90048", opts)
    ).toBe(false)
  })

  it("pickups are always region-valid (address-independent)", () => {
    expect(isFulfillmentTypeRegionValid("plant_pickup", "90048", opts)).toBe(
      true
    )
    expect(isFulfillmentTypeRegionValid("plant_pickup", "30328", opts)).toBe(
      true
    )
    expect(
      isFulfillmentTypeRegionValid("southeast_pickup", "90048", opts)
    ).toBe(true)
  })

  it("never blocks before the ZIP is known (incomplete / undefined)", () => {
    expect(isFulfillmentTypeRegionValid("ups_shipping", "303", opts)).toBe(true)
    expect(isFulfillmentTypeRegionValid("ups_shipping", "", opts)).toBe(true)
    expect(isFulfillmentTypeRegionValid("ups_shipping", null, opts)).toBe(true)
    expect(isFulfillmentTypeRegionValid(undefined, "30328", opts)).toBe(true)
  })

  it("treats a ZIP+4 Atlanta address as in-region for UPS exclusion", () => {
    expect(
      isFulfillmentTypeRegionValid("ups_shipping", "30328-1234", opts)
    ).toBe(false)
  })
})
