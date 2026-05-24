import { augmentHeaderNav, sectionHref } from "@lib/util/header-nav"
import type { HeaderNavLink } from "@lib/data/strapi/header"
import { WAYS_TO_SHOP_MISSIONS } from "@lib/content/ways-to-shop"

const baseNav: HeaderNavLink[] = [
  {
    id: "main",
    slug: "shop",
    title: "Shop",
    sections: [
      {
        title: "Beef",
        items: [{ Text: "Ground Beef", Url: "/search?q=ground%20beef" }],
      },
      {
        title: "Offal and Bones",
        items: [{ Text: "Offal & Bones", Url: "/search?q=offal" }],
      },
    ],
    featured: {
      title: "",
      description: "",
      badge: "",
    },
    bottomBar: {
      certifications: [],
      viewAllText: "",
      viewAllUrl: "",
    },
  },
]

describe("header nav augmentation", () => {
  it("promotes ways-to-shop to top-level filtered hub destinations and preserves beef cuts", () => {
    const navLinks = augmentHeaderNav(baseNav)
    const [waysToShop, nav] = navLinks
    const beef = nav.sections.find((section) => section.title === "Beef")
    const expectedUrls = [
      ...WAYS_TO_SHOP_MISSIONS.map((mission) => mission.shopHref),
      ...WAYS_TO_SHOP_MISSIONS.map((mission) => mission.cookHref),
      ...WAYS_TO_SHOP_MISSIONS.map((mission) => mission.learnHref),
    ]

    expect(waysToShop.title).toBe("Ways to Shop")
    expect(waysToShop.sections.map((section) => section.title)).toEqual([
      "Shop Collections",
      "Cook Recipes",
      "Learn Before Ordering",
    ])
    expect(nav.sections.map((section) => section.title)).not.toContain(
      "Ways to Shop"
    )
    expect(
      waysToShop.sections.flatMap((section) =>
        section.items.map((item) => item.Url)
      )
    ).toEqual(expectedUrls)
    expect(beef?.items.map((item) => item.Text)).toEqual(
      expect.arrayContaining([
        "Ground Beef",
        "Ribeye",
        "Strip Steak",
        "Filet",
        "Brisket",
      ])
    )
  })

  it("standardizes bones and offal naming", () => {
    const nav = augmentHeaderNav(baseNav).find((item) => item.title === "Shop")
    expect(nav?.sections.map((section) => section.title)).toContain(
      "Bones & Offal"
    )
  })

  it("keeps explicit section URLs", () => {
    expect(
      sectionHref({ title: "Ways to Shop", Url: "/collections", items: [] })
    ).toBe("/collections")
  })

  it("provides a resilient fallback nav when Strapi is unavailable", () => {
    const navLinks = augmentHeaderNav([])
    expect(navLinks.map((nav) => nav.title)).toEqual(["Ways to Shop", "Shop"])
    expect(navLinks[1].featured.image?.url).toContain("media.strapiapp.com")
  })

  it("moves explicit ways-to-shop before the primary butcher menu", () => {
    const explicitWaysToShop: HeaderNavLink = {
      ...baseNav[0],
      id: "ways-to-shop",
      slug: "ways-to-shop",
      title: "Ways to Shop",
      sections: [],
    }

    const navLinks = augmentHeaderNav([
      {
        ...baseNav[0],
        slug: "butcher-counter",
        title: "Butcher Counter",
      },
      explicitWaysToShop,
    ])

    expect(navLinks.map((nav) => nav.title)).toEqual([
      "Ways to Shop",
      "Butcher Counter",
    ])
  })
})
