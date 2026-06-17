import {
  ATLANTA_THRESHOLD,
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
  getFreeShippingState,
} from "@lib/util/free-shipping"

describe("getFreeShippingState threshold policy", () => {
  it("exposes the split thresholds: Atlanta $250, in-region $350, national $500", () => {
    expect(ATLANTA_THRESHOLD).toBe(250)
    expect(IN_REGION_THRESHOLD).toBe(350)
    expect(NATIONAL_THRESHOLD).toBe(500)
  })

  it("keeps Atlanta home delivery free at $250 (its own lower threshold)", () => {
    const below = getFreeShippingState({
      subtotal: 249.99,
      fulfillmentType: "atlanta_delivery",
    })
    expect(below.kind).toBe("atlanta_delivery")
    expect(below.threshold).toBe(250)
    expect(below.qualified).toBe(false)

    const at = getFreeShippingState({
      subtotal: 250,
      fulfillmentType: "atlanta_delivery",
    })
    expect(at.kind).toBe("atlanta_delivery")
    expect(at.threshold).toBe(250)
    expect(at.qualified).toBe(true)
  })

  it("Atlanta delivery does NOT use the $350 in-region threshold", () => {
    // A $300 Atlanta-delivery order qualifies (>= $250) even though it's
    // below the in-region $350 threshold.
    const s = getFreeShippingState({
      subtotal: 300,
      fulfillmentType: "atlanta_delivery",
    })
    expect(s.threshold).toBe(250)
    expect(s.qualified).toBe(true)
  })

  it("honors a Strapi-editable atlantaThreshold, falling back to $250 on null/invalid", () => {
    expect(
      getFreeShippingState({
        subtotal: 260,
        fulfillmentType: "atlanta_delivery",
        atlantaThreshold: 300,
      }).qualified
    ).toBe(false)
    expect(
      getFreeShippingState({
        subtotal: 300,
        fulfillmentType: "atlanta_delivery",
        atlantaThreshold: 300,
      }).qualified
    ).toBe(true)
    // 0/invalid override → falls back to the $250 constant.
    expect(
      getFreeShippingState({
        subtotal: 250,
        fulfillmentType: "atlanta_delivery",
        atlantaThreshold: 0,
      }).threshold
    ).toBe(250)
  })

  it("Southeast pickup is free at $350, not $250", () => {
    const below = getFreeShippingState({
      subtotal: 250,
      fulfillmentType: "southeast_pickup",
    })
    expect(below.kind).toBe("southeast_pickup")
    expect(below.threshold).toBe(350)
    expect(below.qualified).toBe(false)

    const at = getFreeShippingState({
      subtotal: 350,
      fulfillmentType: "southeast_pickup",
    })
    expect(at.kind).toBe("southeast_pickup")
    expect(at.threshold).toBe(350)
    expect(at.qualified).toBe(true)
  })

  it("in-region UPS Ground (ship-to in-region state) is free at $350", () => {
    const below = getFreeShippingState({
      subtotal: 250,
      fulfillmentType: "ups_shipping",
      shipState: "GA",
    })
    expect(below.kind).toBe("in_region_ups")
    expect(below.threshold).toBe(350)
    expect(below.qualified).toBe(false)

    const at = getFreeShippingState({
      subtotal: 350,
      fulfillmentType: "ups_shipping",
      shipState: "TX",
    })
    expect(at.kind).toBe("in_region_ups")
    expect(at.threshold).toBe(350)
    expect(at.qualified).toBe(true)
  })

  it("national UPS Ground is free at $500 (unchanged)", () => {
    const below = getFreeShippingState({
      subtotal: 350,
      fulfillmentType: "ups_shipping",
      shipState: "CA",
    })
    expect(below.kind).toBe("national_ups")
    expect(below.threshold).toBe(500)
    expect(below.qualified).toBe(false)

    const at = getFreeShippingState({
      subtotal: 500,
      fulfillmentType: "ups_shipping",
      shipState: "CA",
    })
    expect(at.kind).toBe("national_ups")
    expect(at.threshold).toBe(500)
    expect(at.qualified).toBe(true)
  })

  it("plant pickup is always free with a $7.50 credit at >= $150 (unchanged)", () => {
    const s = getFreeShippingState({
      subtotal: 150,
      fulfillmentType: "plant_pickup",
    })
    expect(s.kind).toBe("plant_pickup")
    expect(s.qualified).toBe(true)
    expect(s.threshold).toBeNull()
    expect(s.pickupBonusEarned).toBe(true)
  })
})
