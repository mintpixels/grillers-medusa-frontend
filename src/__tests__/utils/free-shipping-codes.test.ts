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
    expect(
      pickFreeShippingCode({
        eligibleSubtotalDollars: 250,
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

  it("uses the documented Southeast Pickup credit amount", () => {
    expect(SE_PICKUP_CREDIT_AMOUNT).toBe(20)
  })
})
