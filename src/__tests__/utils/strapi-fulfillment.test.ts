jest.mock("@lib/strapi", () => ({
  __esModule: true,
  default: { request: jest.fn() },
}))

jest.mock("graphql-request", () => ({
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce(
      (acc, part, index) => `${acc}${part}${values[index] ?? ""}`,
      ""
    ),
}))

import { zonesToAtlantaZipConfig } from "@lib/data/strapi/fulfillment"

describe("Strapi Atlanta delivery zones", () => {
  it("uses explicit weekday arrays when editors provide them", () => {
    expect(
      zonesToAtlantaZipConfig([
        {
          documentId: "1",
          ZipCode: "30329",
          DeliveryDay: "Tuesday",
          Weekdays: [2, 3],
          CutoffHourLocal: 11,
        },
      ])
    ).toEqual({
      "30329": { weekdays: [2, 3], cutoffHour: 11 },
    })
  })

  it("falls back to DeliveryDay when Weekdays is empty", () => {
    expect(
      zonesToAtlantaZipConfig([
        {
          documentId: "1",
          ZipCode: "30062",
          DeliveryDay: "Thursday",
          Weekdays: [],
          CutoffHourLocal: null,
        },
      ])
    ).toEqual({
      "30062": { weekdays: [4], cutoffHour: 12 },
    })
  })

  it("drops inactive-looking malformed rows before they reach checkout", () => {
    expect(
      zonesToAtlantaZipConfig([
        {
          documentId: "bad",
          ZipCode: "abc",
          DeliveryDay: "Wednesday",
          Weekdays: [3],
          CutoffHourLocal: 12,
        },
      ])
    ).toEqual({})
  })

  it("verifies an Atlanta ZIP is included and a non-Atlanta ZIP is absent", () => {
    const config = zonesToAtlantaZipConfig([
      {
        documentId: "atlanta",
        ZipCode: "30329",
        DeliveryDay: "Wednesday",
        Weekdays: [],
        CutoffHourLocal: 12,
      },
    ])

    expect(config["30329"]).toEqual({ weekdays: [3], cutoffHour: 12 })
    expect(config["10001"]).toBeUndefined()
  })
})
