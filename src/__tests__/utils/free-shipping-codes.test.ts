import {
  FREE_SHIP_IN_REGION_CODE,
  FREE_SHIP_NATIONAL_CODE,
  SE_PICKUP_CREDIT_AMOUNT,
  isUpsServiceEligibleForFreeShipping,
  pickFreeShippingCode,
} from "@lib/util/free-shipping-codes"

describe("UPS free-shipping service selection", () => {
  it("makes Ground the free baseline when Ground is cold-chain safe", () => {
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "GROUND",
        destinationZip: "23220",
      })
    ).toBe(true)
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "3_DAY_SELECT",
        destinationZip: "23220",
      })
    ).toBe(false)
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "2ND_DAY_AIR",
        destinationZip: "23220",
      })
    ).toBe(false)
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "OVERNIGHT",
        destinationZip: "23220",
      })
    ).toBe(false)
  })

  it("makes 3 Day Select the free baseline when Ground is too slow", () => {
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "GROUND",
        destinationZip: "90048",
      })
    ).toBe(false)
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "3_DAY_SELECT",
        destinationZip: "90048",
      })
    ).toBe(true)
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "2ND_DAY_AIR",
        destinationZip: "90048",
      })
    ).toBe(false)
    expect(
      isUpsServiceEligibleForFreeShipping({
        serviceCode: "OVERNIGHT",
        destinationZip: "90048",
      })
    ).toBe(false)
  })

  it("does not attach the free-shipping promo to premium UPS services", () => {
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 500,
        fulfillmentType: "ups_shipping",
        shipState: "VA",
        destinationZip: "23220",
        selectedUpsServiceCode: "2ND_DAY_AIR",
      })
    ).toBeNull()

    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 500,
        fulfillmentType: "ups_shipping",
        shipState: "CA",
        destinationZip: "90048",
        selectedUpsServiceCode: "2ND_DAY_AIR",
      })
    ).toBeNull()

    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 500,
        fulfillmentType: "ups_shipping",
        shipState: "CA",
        destinationZip: "90048",
        selectedUpsServiceCode: "OVERNIGHT",
      })
    ).toBeNull()
  })

  it("attaches the correct regional or national code to the cheapest valid UPS service", () => {
    // In-region UPS Ground is now free at $350 (was $250) — a $250 order no
    // longer qualifies.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 250,
        fulfillmentType: "ups_shipping",
        shipState: "GA",
        destinationZip: "30340",
        selectedUpsServiceCode: "GROUND",
      })
    ).toBeNull()

    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 350,
        fulfillmentType: "ups_shipping",
        shipState: "GA",
        destinationZip: "30340",
        selectedUpsServiceCode: "GROUND",
      })
    ).toBe(FREE_SHIP_IN_REGION_CODE)

    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 500,
        fulfillmentType: "ups_shipping",
        shipState: "CA",
        destinationZip: "90048",
        selectedUpsServiceCode: "3_DAY_SELECT",
      })
    ).toBe(FREE_SHIP_NATIONAL_CODE)
  })

  it("keeps Atlanta home delivery free at $250 while in-region UPS / SE pickup move to $350", () => {
    // Atlanta delivery: free at $250 (its own lower local threshold).
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 250,
        fulfillmentType: "atlanta_delivery",
      })
    ).toBe(FREE_SHIP_IN_REGION_CODE)
    // $249.99 Atlanta delivery does not qualify.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 249.99,
        fulfillmentType: "atlanta_delivery",
      })
    ).toBeNull()

    // Southeast pickup: free at $350, NOT $250.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 250,
        fulfillmentType: "southeast_pickup",
      })
    ).toBeNull()
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 350,
        fulfillmentType: "southeast_pickup",
      })
    ).toBe(FREE_SHIP_IN_REGION_CODE)
  })

  it("uses the documented Southeast Pickup credit amount", () => {
    expect(SE_PICKUP_CREDIT_AMOUNT).toBe(20)
  })

  it("honors a Strapi-editable threshold so the applied promo matches the UI (#266)", () => {
    // In-region threshold raised to $300: a $260 order no longer qualifies.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 260,
        fulfillmentType: "ups_shipping",
        shipState: "GA",
        destinationZip: "30340",
        selectedUpsServiceCode: "GROUND",
        inRegionThreshold: 300,
      })
    ).toBeNull()
    // $300 clears the raised threshold.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 300,
        fulfillmentType: "ups_shipping",
        shipState: "GA",
        destinationZip: "30340",
        selectedUpsServiceCode: "GROUND",
        inRegionThreshold: 300,
      })
    ).toBe(FREE_SHIP_IN_REGION_CODE)
  })

  it("ignores a 0/invalid Strapi threshold and falls back to the constant (#266 safety)", () => {
    // A bogus 0 threshold must NOT make a sub-$350 order free.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 100,
        fulfillmentType: "ups_shipping",
        shipState: "GA",
        destinationZip: "30340",
        selectedUpsServiceCode: "GROUND",
        inRegionThreshold: 0,
      })
    ).toBeNull()
    // At the constant $350 it qualifies again.
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 350,
        fulfillmentType: "ups_shipping",
        shipState: "GA",
        destinationZip: "30340",
        selectedUpsServiceCode: "GROUND",
        inRegionThreshold: 0,
      })
    ).toBe(FREE_SHIP_IN_REGION_CODE)
  })
})
