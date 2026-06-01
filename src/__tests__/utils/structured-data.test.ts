import {
  absoluteSiteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  localizedPath,
  webPageJsonLd,
} from "@lib/util/structured-data"

describe("structured data helpers", () => {
  it("normalizes localized URLs without duplicate slashes", () => {
    expect(absoluteSiteUrl("https://example.com/", "/us/store")).toBe(
      "https://example.com/us/store"
    )
    expect(localizedPath("us", "/collections/kosher-beef")).toBe(
      "/us/collections/kosher-beef"
    )
  })

  it("builds breadcrumb and item lists with stable positions", () => {
    const breadcrumbs = breadcrumbJsonLd("https://example.com", "us", [
      { name: "Store", path: "/store" },
    ])
    const list = itemListJsonLd("https://example.com", "us", "Products", [
      { type: "Product", name: "Rib steak", path: "/products/rib-steak" },
    ])

    expect(breadcrumbs.itemListElement).toHaveLength(2)
    expect(list.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "Product",
        name: "Rib steak",
        url: "https://example.com/us/products/rib-steak",
      },
    })
  })

  it("builds page and FAQ schemas for AEO page structure", () => {
    const page = webPageJsonLd({
      baseUrl: "https://example.com",
      countryCode: "us",
      path: "/customer-service",
      name: "Customer Service",
      description: "Contact Grillers Pride.",
      breadcrumbs: [{ name: "Customer Service", path: "/customer-service" }],
      about: ["Kosher meat"],
    })
    const faq = faqPageJsonLd([
      { Question: "How do I order?", Answer: "Use the storefront." },
    ])

    expect(page).toMatchObject({
      "@type": "WebPage",
      "@id": "https://example.com/us/customer-service#webpage",
      breadcrumb: { "@type": "BreadcrumbList" },
    })
    expect(faq.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "How do I order?",
    })
  })
})
