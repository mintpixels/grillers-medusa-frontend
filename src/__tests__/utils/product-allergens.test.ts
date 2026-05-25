import {
  detectAllergensInText,
  getProductAllergenKeys,
} from "@lib/util/product-allergens"
import {
  filterProducts,
  getEmptyFilters,
} from "@modules/collections/components/collection-filters"

describe("product allergen detection", () => {
  it("detects FDA major allergens from approved disclosure copy", () => {
    expect(
      detectAllergensInText(
        "Beef, eggs, panko bread crumbs, soybean oil, sesame seeds."
      )
    ).toEqual(["eggs", "wheat", "soybeans", "sesame"])
  })

  it("uses only approved Strapi ingredient disclosures", () => {
    const product = {
      IngredientDisclosures: [
        {
          Ingredients: "Chicken, Wheat Flour",
          ReviewStatus: "needs_review" as const,
        },
        {
          Contains: "Eggs, Soy",
          ReviewStatus: "approved" as const,
        },
      ],
    }

    expect(getProductAllergenKeys(product)).toEqual(["eggs", "soybeans"])
  })

  it("keeps only approved-disclosure products without selected allergens", () => {
    const products = [
      {
        documentId: "contains-wheat",
        Title: "Pocket pies",
        IngredientDisclosures: [
          {
            Ingredients: "Chicken, Pastry, Wheat Flour",
            ReviewStatus: "approved",
          },
        ],
      },
      {
        documentId: "contains-eggs",
        Title: "Potato kugel",
        IngredientDisclosures: [
          {
            Ingredients: "Potatoes, Onions, Eggs",
            ReviewStatus: "approved",
          },
        ],
      },
      {
        documentId: "no-disclosure",
        Title: "Raw rib steak",
      },
    ] as any

    const filtered = filterProducts(products, {
      ...getEmptyFilters(),
      avoidAllergens: ["wheat"],
    })

    expect(filtered.map((product: any) => product.documentId)).toEqual([
      "contains-eggs",
    ])
  })
})
