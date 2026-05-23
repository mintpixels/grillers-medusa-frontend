import React from "react"
import { render, screen } from "@testing-library/react"

import ProductFacts from "@modules/products/components/product-facts"
import { buildProductFactGroups } from "@modules/products/components/product-facts"
import { buildProductFactHighlights } from "@modules/products/components/product-facts"

const productData = (overrides: Record<string, any> = {}) =>
  ({
    Title: "Flank Steak",
    Metadata: {},
    Categorization: {
      ProductTags: [],
      ProductCollections: [],
    },
    MedusaProduct: {
      ProductId: "prod_1",
      Title: "Flank Steak",
      Description: "",
      Handle: "flank-steak",
    },
    ...overrides,
  } as any)

describe("product facts", () => {
  it("renders only rows backed by Strapi fields", () => {
    const groups = buildProductFactGroups({
      strapiProductData: productData({
        Metadata: {
          AvgPackSize: "2 x 8 oz",
          PiecesPerPack: 2,
          OU: true,
          Angus: true,
        },
        Categorization: {
          ProductTags: [{ Name: "L3: Flank Steak" }],
          ProductCollections: [{ Name: "Kosher Beef", Slug: "kosher-beef" }],
        },
      }),
    })

    expect(groups.map((group) => group.title)).toEqual([
      "Item",
      "Pack",
      "Kashruth and sourcing",
    ])
    expect(groups.flatMap((group) => group.rows)).toEqual(
      expect.arrayContaining([
        { label: "Cut family", value: "Flank Steak" },
        { label: "Pack size", value: "2 x 8 oz" },
        { label: "Pieces per pack", value: "2" },
        { label: "Hechsher", value: "OU" },
        { label: "Sourcing flags", value: "American Angus" },
      ])
    )
  })

  it("does not add generic kashruth or availability fallback facts", () => {
    const groups = buildProductFactGroups({
      strapiProductData: productData(),
    })
    const rows = groups.flatMap((group) => group.rows)

    expect(rows).not.toContainEqual({
      label: "Hechsher",
      value: "Certified kosher",
    })
    expect(rows.some((row) => row.label === "Availability")).toBe(false)
  })

  it("builds compact visual highlights from product metadata", () => {
    const highlights = buildProductFactHighlights({
      strapiProductData: productData({
        Metadata: {
          AvgPackSize: "2 x 8 oz",
          OU: true,
          KosherForPassover: true,
          Angus: true,
          GlutenFree: true,
          MSG: true,
          Uncooked: true,
        },
        Categorization: {
          ProductTags: [{ Name: "L3: Flank Steak" }],
          ProductCollections: [],
        },
      }),
    })

    expect(highlights).toEqual(
      expect.arrayContaining([
        {
          key: "AvgPackSize",
          label: "Pack size",
          value: "2 x 8 oz",
          iconSrc: "/images/pdp/attribute-icons/avg-pack-size.png",
        },
        {
          key: "KosherForPassover",
          label: "Kosher for Passover",
          iconSrc: "/images/pdp/attribute-icons/kosher-for-passover.png",
        },
        {
          key: "OU",
          label: "OU",
          iconSrc: "/images/pdp/attribute-icons/hechsher-ou.png",
        },
        {
          key: "GlutenFree",
          label: "Gluten free",
          iconSrc: "/images/pdp/attribute-icons/gluten-free.png",
        },
        {
          key: "MSG",
          label: "No MSG",
          iconSrc: "/images/pdp/attribute-icons/no-msg.png",
        },
        {
          key: "Uncooked",
          label: "Raw",
          iconSrc: "/images/pdp/attribute-icons/raw.png",
        },
        {
          key: "Angus",
          label: "American Angus",
          iconSrc: "/images/pdp/attribute-icons/american-angus.png",
        },
      ])
    )
  })

  it("keeps secondary details collapsed by default", () => {
    render(
      React.createElement(ProductFacts, {
        strapiProductData: productData({
          Metadata: {
            AvgPackSize: "2 x 8 oz",
            OU: true,
          },
          Categorization: {
            ProductTags: [{ Name: "L3: Flank Steak" }],
            ProductCollections: [],
          },
        }),
      })
    )

    expect(screen.getByText("Product details")).toBeInTheDocument()
    expect(screen.getByText("At a glance")).toBeInTheDocument()
    document.querySelectorAll("details").forEach((element) => {
      expect(element).not.toHaveAttribute("open")
    })
  })

  it("keeps description and kashruth policy inside product details", () => {
    render(
      React.createElement(ProductFacts, {
        strapiProductData: productData({
          Metadata: {
            OU: true,
          },
        }),
        description: "Sear hard, then braise covered until tender.",
        countryCode: "us",
      })
    )

    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Kashruth and sourcing")).toBeInTheDocument()
    expect(screen.queryByText("Catalog hechsher key:")).not.toBeInTheDocument()
    expect(screen.getByText("view our kashruth policy")).toHaveAttribute(
      "href",
      "/us/kashruth/hechsherim"
    )
  })
})
