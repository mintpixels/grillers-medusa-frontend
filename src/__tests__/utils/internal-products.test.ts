import { hitToProduct } from "@lib/algolia/hit-to-product"
import {
  isInternalRawMaterialSku,
  medusaProductHasInternalRawMaterialSku,
  strapiProductHasInternalRawMaterialSku,
} from "@lib/util/internal-products"
import { compactCollectionProducts } from "@lib/util/collection-product"

describe("internal raw-material products", () => {
  it("recognizes RM SKUs case-insensitively", () => {
    expect(isInternalRawMaterialSku("RM-05-MVMR")).toBe(true)
    expect(isInternalRawMaterialSku(" rm-as-1750 ")).toBe(true)
    expect(isInternalRawMaterialSku("10-17-03-1")).toBe(false)
    expect(isInternalRawMaterialSku(null)).toBe(false)
  })

  it("detects RM SKUs on Medusa products and Strapi products", () => {
    expect(
      medusaProductHasInternalRawMaterialSku({
        variants: [{ sku: "RM-91-BS" }],
      } as any)
    ).toBe(true)
    expect(
      strapiProductHasInternalRawMaterialSku({
        MedusaProduct: { Variants: [{ Sku: "RM-91-BS" }] },
      } as any)
    ).toBe(true)
  })

  it("filters RM products out of collection adapters", () => {
    const products = compactCollectionProducts([
      {
        documentId: "customer-facing",
        Title: "Ground Beef",
        MedusaProduct: {
          ProductId: "prod_1",
          Handle: "ground-beef",
          Variants: [{ VariantId: "variant_1", Sku: "1-01-01-1" }],
        },
      },
      {
        documentId: "raw-material",
        Title: "Raw Material",
        MedusaProduct: {
          ProductId: "prod_rm",
          Handle: "raw-material",
          Variants: [{ VariantId: "variant_rm", Sku: "RM-05-MVMR" }],
        },
      },
    ] as any)

    expect(products.map((product) => product.documentId)).toEqual([
      "customer-facing",
    ])
  })

  it("drops RM Algolia hits", () => {
    expect(
      hitToProduct({
        objectID: "raw-material",
        Title: "Raw Material",
        MedusaProduct: {
          ProductId: "prod_rm",
          Handle: "raw-material",
          Variants: [{ VariantId: "variant_rm", Sku: "RM-AS-1750" }],
        },
      })
    ).toBeNull()
  })
})
