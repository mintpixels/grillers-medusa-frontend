import {
  collectionEstimatedSubtotals,
  getCollectionSubstitutionGuardrails,
  lineCartMetadata,
} from "@lib/util/collection-substitutions"

const product = ({
  title,
  price,
  avgPackWeight,
  sku,
  qualifies = true,
}: {
  title: string
  price: number
  avgPackWeight: string
  sku: string
  qualifies?: boolean
}) =>
  ({
    documentId: sku,
    Title: title,
    Metadata: {
      AvgPackWeight: avgPackWeight,
      PricingMode: "fixed_price",
      QualifiesForFreeDeliveryOffers: qualifies,
      FreeDeliveryExclusionReason: qualifies ? null : "Cheap bulky item",
    },
    MedusaProduct: {
      Handle: sku.toLowerCase(),
      Variants: [
        {
          VariantId: `variant-${sku}`,
          Sku: sku,
          QualifiesForFreeDeliveryOffers: qualifies,
          FreeDeliveryExclusionReason: qualifies ? null : "Cheap bulky item",
          Price: { CalculatedPriceNumber: price },
        },
      ],
    },
  }) as any

describe("curated collection substitutions", () => {
  it("keeps excluded replacement items out of the free-delivery subtotal", () => {
    const eligible = {
      Product: product({
        title: "Brisket",
        price: 120,
        avgPackWeight: "8 lb",
        sku: "BRISKET",
      }),
      Quantity: 1,
    } as any
    const excluded = {
      Product: product({
        title: "Bulky soup bones",
        price: 25,
        avgPackWeight: "12 lb",
        sku: "BONES",
        qualifies: false,
      }),
      Quantity: 2,
    } as any

    expect(collectionEstimatedSubtotals([eligible, excluded])).toEqual({
      total: 170,
      eligible: 120,
      excluded: 50,
    })
    expect(lineCartMetadata(excluded)).toMatchObject({
      free_delivery_eligible: false,
      free_delivery_exclusion_reason: "Cheap bulky item",
    })
  })

  it("blocks equal-or-better substitutions that are lower estimated value", () => {
    const item = {
      Product: product({
        title: "Replacement",
        price: 40,
        avgPackWeight: "3 lb",
        sku: "REPLACE",
      }),
      OriginalProduct: product({
        title: "Original",
        price: 75,
        avgPackWeight: "4 lb",
        sku: "ORIGINAL",
      }),
      Quantity: 1,
      OriginalQuantity: 1,
      SubstitutionStatus: "editor_substituted",
      SubstitutionValuePolicy: "equal_or_better_value",
      ShippingCostRisk: "normal",
    } as any

    const guardrails = getCollectionSubstitutionGuardrails([item])
    expect(guardrails.requiresAcknowledgement).toBe(true)
    expect(guardrails.needsBusinessReview).toBe(true)
    expect(guardrails.reviewReasons).toContain(
      "equal-or-better substitution is lower estimated value"
    )
  })

  it("blocks materially heavier substitutions when revenue does not offset shipping risk", () => {
    const item = {
      Product: product({
        title: "Heavier replacement",
        price: 35,
        avgPackWeight: "7 lb",
        sku: "HEAVY",
      }),
      OriginalProduct: product({
        title: "Original compact item",
        price: 35,
        avgPackWeight: "3 lb",
        sku: "COMPACT",
      }),
      Quantity: 1,
      OriginalQuantity: 1,
      SubstitutionStatus: "editor_substituted",
      SubstitutionValuePolicy: "actual_replacement_price",
      ShippingCostRisk: "heavier_or_bulkier",
    } as any

    const guardrails = getCollectionSubstitutionGuardrails([item])
    expect(guardrails.requiresAcknowledgement).toBe(true)
    expect(guardrails.needsBusinessReview).toBe(true)
    expect(guardrails.reviewReasons).toContain(
      "replacement adds material weight without enough incremental revenue"
    )
    expect(guardrails.reviewReasons).toContain(
      "replacement lowers estimated revenue per shipped pound"
    )
  })

  it("blocks heavier substitutions that add dollars but worsen shipped-weight economics", () => {
    const item = {
      Product: product({
        title: "Higher subtotal but much heavier replacement",
        price: 60,
        avgPackWeight: "6 lb",
        sku: "HEAVIER-VALUE",
      }),
      OriginalProduct: product({
        title: "Original high-density item",
        price: 50,
        avgPackWeight: "2 lb",
        sku: "DENSE",
      }),
      Quantity: 1,
      OriginalQuantity: 1,
      SubstitutionStatus: "editor_substituted",
      SubstitutionValuePolicy: "actual_replacement_price",
      ShippingCostRisk: "normal",
    } as any

    const guardrails = getCollectionSubstitutionGuardrails([item])
    expect(guardrails.needsBusinessReview).toBe(true)
    expect(guardrails.reviewReasons).toEqual(
      expect.arrayContaining([
        "replacement adds material weight without enough incremental revenue",
        "replacement lowers estimated revenue per shipped pound",
      ])
    )
  })

  it("allows heavier substitutions when estimated revenue scales with shipped weight", () => {
    const item = {
      Product: product({
        title: "Larger replacement",
        price: 125,
        avgPackWeight: "5 lb",
        sku: "LARGER",
      }),
      OriginalProduct: product({
        title: "Original high-density item",
        price: 50,
        avgPackWeight: "2 lb",
        sku: "DENSE",
      }),
      Quantity: 1,
      OriginalQuantity: 1,
      SubstitutionStatus: "editor_substituted",
      SubstitutionValuePolicy: "actual_replacement_price",
      ShippingCostRisk: "normal",
    } as any

    const guardrails = getCollectionSubstitutionGuardrails([item])
    expect(guardrails.requiresAcknowledgement).toBe(true)
    expect(guardrails.needsBusinessReview).toBe(false)
  })

  it("blocks substitutions that change a free-delivery-eligible item into an excluded item", () => {
    const item = {
      Product: product({
        title: "Cheap bulky replacement",
        price: 35,
        avgPackWeight: "8 lb",
        sku: "BULKY",
        qualifies: false,
      }),
      OriginalProduct: product({
        title: "Eligible original",
        price: 45,
        avgPackWeight: "3 lb",
        sku: "ELIGIBLE",
      }),
      Quantity: 1,
      OriginalQuantity: 1,
      SubstitutionStatus: "editor_substituted",
      SubstitutionValuePolicy: "actual_replacement_price",
      ShippingCostRisk: "normal",
    } as any

    const guardrails = getCollectionSubstitutionGuardrails([item])
    expect(guardrails.needsBusinessReview).toBe(true)
    expect(guardrails.reviewReasons).toContain(
      "substitution changes free-delivery eligibility from eligible to excluded"
    )
  })
})
