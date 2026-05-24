import {
  buildIngredientDisclosureContent,
  selectIngredientDisclosure,
} from "@modules/products/components/product-ingredient-disclosures"

describe("product ingredient disclosures", () => {
  it("selects the approved disclosure for the selected SKU", () => {
    const selected = selectIngredientDisclosure(
      [
        {
          Sku: "10-14-02-1P",
          Ingredients: "Chicken, Apricot Jam",
          ReviewStatus: "approved",
        },
        {
          Sku: "10-14-03-1P",
          Ingredients: "Chicken, Lemon, Herbs",
          ReviewStatus: "approved",
        },
      ],
      "10-14-03-1p"
    )

    expect(selected?.Ingredients).toBe("Chicken, Lemon, Herbs")
  })

  it("does not expose unapproved disclosures", () => {
    const selected = selectIngredientDisclosure(
      [
        {
          Sku: "10-14-02-1P",
          Ingredients: "Chicken, Apricot Jam",
          ReviewStatus: "needs_review",
        },
      ],
      "10-14-02-1P"
    )

    expect(selected).toBeNull()
  })

  it("splits a trailing contains statement out of the ingredient copy", () => {
    const content = buildIngredientDisclosureContent({
      Ingredients:
        "Ingredients: Chicken, Matzo Meal, Eggs. Contains: Eggs, Wheat",
      ReviewStatus: "approved",
    })

    expect(content).toEqual({
      ingredients: "Chicken, Matzo Meal, Eggs",
      contains: "Eggs, Wheat",
    })
  })
})
