import {
  buildCatchWeightFulfillmentItems,
  catchWeightReadyForFulfillment,
  hasActiveFulfillment,
} from "@lib/util/catch-weight-fulfillment"

describe("catch-weight fulfillment helpers", () => {
  it("allows fulfillment after final charge release", () => {
    expect(
      catchWeightReadyForFulfillment({
        finalization: { status: "charged_ready_to_ship" },
        order: { metadata: {} },
      })
    ).toBe(true)

    expect(
      catchWeightReadyForFulfillment({
        finalization: { status: "packing" },
        order: { metadata: { fulfillment_gate_status: "blocked" } },
      })
    ).toBe(false)
  })

  it("skips removed lines and caps fulfillment quantity to the original order", () => {
    const items = buildCatchWeightFulfillmentItems(
      {
        items: [
          { id: "item_1", quantity: 2 },
          { id: "item_2", detail: { quantity: 1 }, quantity: 1 },
          { id: "item_3", quantity: 1 },
        ],
      },
      [
        { line_item_id: "item_1", actual_quantity: 4, status: "ready" },
        { line_item_id: "item_2", actual_quantity: 1, status: "removed" },
        { line_item_id: "item_3", actual_quantity: 0, status: "ready" },
      ]
    )

    expect(items).toEqual([{ id: "item_1", quantity: 2 }])
  })

  it("recognizes active fulfillments", () => {
    expect(
      hasActiveFulfillment({
        fulfillments: [{ id: "ful_1", canceled_at: null }],
      })
    ).toBe(true)

    expect(
      hasActiveFulfillment({
        fulfillments: [{ id: "ful_1", canceled_at: "2026-06-01T12:00:00Z" }],
      })
    ).toBe(false)
  })
})
