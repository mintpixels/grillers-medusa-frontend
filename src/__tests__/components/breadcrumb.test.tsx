import {
  buildProductBreadcrumbs,
  normalizeCollectionHandle,
} from "@modules/common/components/breadcrumb"

describe("buildProductBreadcrumbs", () => {
  it("never emits /categories links when categories are present", () => {
    const items = buildProductBreadcrumbs(
      { title: "Beef", handle: "beef" },
      "us",
      [
        {
          name: "Beef",
          handle: "beef",
          parent_category: null,
        },
      ]
    )

    expect(items).toEqual([
      { name: "Home", href: "/us" },
      { name: "Beef", href: "/us/collections/kosher-beef" },
    ])
    expect(items.some((item) => item.href.includes("/categories/"))).toBe(
      false
    )
  })

  it.each([
    ["beef", "kosher-beef"],
    ["kosher-beef", "kosher-beef"],
    ["L2%3A%20Beef", "kosher-beef"],
    ["L2%3A%20Franks%20%26%20Dogs", "kosher-franks-dogs"],
    ["L2%3A%20Poultry", "kosher-chicken"],
    ["L2%3A%20Prepared", "prepared-and-provisions"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeCollectionHandle(input)).toBe(expected)
  })
})
