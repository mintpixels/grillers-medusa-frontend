import {
  getCheckoutAnalyticsItems,
  getCheckoutAnalyticsValue,
} from "@modules/checkout/utils/analytics"

describe("checkout analytics value mapping", () => {
  it("passes Medusa v2 dollar amounts through for totals and item prices", () => {
    const cart = {
      total: 156.78,
      items: [
        {
          id: "line_1",
          product_id: "prod_1",
          product_title: "Ribeye",
          unit_price: 42.5,
          quantity: 2,
        },
      ],
    }

    expect(getCheckoutAnalyticsValue(cart)).toBe(156.78)
    expect(getCheckoutAnalyticsItems(cart)).toEqual([
      {
        id: "prod_1",
        title: "Ribeye",
        price: 42.5,
        quantity: 2,
      },
    ])
  })
})
