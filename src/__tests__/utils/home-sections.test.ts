import {
  resolveHomeSections,
  FALLBACK_HOME_SECTIONS,
} from "@lib/util/home-sections"

// Regression guard for the homepage "blank on normal load, appears on hard
// reload" bug. The route is force-dynamic and the body is driven entirely by
// the Strapi `home.Sections` query (3s timeout + .catch(()=>null)). Every
// Strapi publish busts the cached query; if the next live re-fetch is slow or
// errors, Sections is null and the page used to render an empty <section>.
// The page must FAIL OPEN: render a usable homepage rather than nothing.

describe("resolveHomeSections (homepage fails open, never blank)", () => {
  it("falls open to fallback Hero + Bestsellers when Strapi home data is null", () => {
    const { sections, usedFallback } = resolveHomeSections(null)

    expect(usedFallback).toBe(true)
    expect(sections.length).toBeGreaterThan(0)
    const typenames = sections.map((s) => s.__typename)
    expect(typenames).toContain("ComponentHomeHero")
    expect(typenames).toContain("ComponentHomeBestsellers")
  })

  it("falls open when Strapi returns home with an empty Sections array", () => {
    const { sections, usedFallback } = resolveHomeSections({
      home: { Sections: [] },
    })

    expect(usedFallback).toBe(true)
    expect(sections.length).toBeGreaterThan(0)
  })

  it("uses the CMS sections unchanged when Strapi returns them", () => {
    const cmsSections = [
      { __typename: "ComponentHomeHero", HeroTitle: "Editorial title" },
      { __typename: "ComponentHomeBestsellers", BestsellersTitle: "Picks" },
    ]

    const { sections, usedFallback } = resolveHomeSections({
      home: { Sections: cmsSections },
    })

    expect(usedFallback).toBe(false)
    expect(sections).toBe(cmsSections)
  })

  it("ships fallback bestseller product handles so the rail is not empty", () => {
    const bestsellers = FALLBACK_HOME_SECTIONS.find(
      (s) => s.__typename === "ComponentHomeBestsellers"
    )

    expect(bestsellers).toBeDefined()
    const products = (bestsellers as { Products?: Array<{ Slug?: string }> })
      .Products
    expect(Array.isArray(products)).toBe(true)
    expect(products!.length).toBeGreaterThan(0)
    expect(
      products!.every((p) => typeof p.Slug === "string" && p.Slug!.length > 0)
    ).toBe(true)
  })

  it("fallback Hero carries a title so the H1 is never empty", () => {
    const hero = FALLBACK_HOME_SECTIONS.find(
      (s) => s.__typename === "ComponentHomeHero"
    )

    expect(hero).toBeDefined()
    const title = (hero as { HeroTitle?: string }).HeroTitle
    expect(typeof title).toBe("string")
    expect(title!.length).toBeGreaterThan(0)
  })
})
