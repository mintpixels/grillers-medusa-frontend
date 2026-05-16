import type { CuratedCollectionItem } from "@lib/data/strapi/curated-collections"
import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import {
  formatProductPriceDisplay,
  parseAvgPackWeight,
  type PriceDisplay,
} from "@lib/util/price-display"
import {
  freeDeliveryEligibilityMetadata,
  getProductFreeDeliveryEligibility,
} from "@lib/util/free-delivery-eligibility"

export type ResolvedCuratedCollectionItem = CuratedCollectionItem & {
  Product: StrapiCollectionProduct
}

export type SubstitutionImpact = {
  originalQuantity: number
  originalTotal: number | null
  replacementTotal: number
  originalWeight: number | null
  replacementWeight: number | null
  priceDelta: number | null
  weightDelta: number | null
  originalRevenuePerLb: number | null
  replacementRevenuePerLb: number | null
  revenuePerLbDelta: number | null
  incrementalRevenuePerAddedLb: number | null
}

export type SubstitutionGuardrail = {
  requiresAcknowledgement: boolean
  needsBusinessReview: boolean
  acknowledgementReasons: string[]
  reviewReasons: string[]
}

const LOWER_VALUE_PRICE_TOLERANCE = 0.5
const LOWER_VALUE_WEIGHT_TOLERANCE_LB = 0.25
const MATERIAL_HEAVIER_SUBSTITUTION_LB = 2
const MATERIAL_RELATIVE_HEAVIER_SUBSTITUTION_LB = 1
const MATERIAL_HEAVIER_SUBSTITUTION_RATIO = 0.35
const MAX_REVENUE_DENSITY_DROP_RATIO = 0.15
const MIN_INCREMENTAL_REVENUE_PER_ADDED_LB = 8

export function productPriceDisplay(
  product: StrapiCollectionProduct
): PriceDisplay | null {
  const variant = product.MedusaProduct?.Variants?.[0]
  const price = variant?.Price?.CalculatedPriceNumber
  if (typeof price !== "number") return null
  return formatProductPriceDisplay(
    price,
    product.Metadata,
    variant?.Sku,
    (
      product.MedusaProduct as
        | { PricingMode?: "per_lb" | "fixed_price" }
        | undefined
    )?.PricingMode
  )
}

export function lineEstimatedTotal(
  product: StrapiCollectionProduct,
  quantity: number
): number {
  return (productPriceDisplay(product)?.estimatedPackPrice ?? 0) * quantity
}

export function lineEstimatedWeightLb(
  product: StrapiCollectionProduct | null | undefined,
  quantity: number
): number | null {
  const parsed = parseAvgPackWeight(product?.Metadata?.AvgPackWeight)
  return parsed ? parsed.avg * quantity : null
}

export function isSubstitutionItem(item: CuratedCollectionItem): boolean {
  return Boolean(item.SubstitutionStatus && item.SubstitutionStatus !== "none")
}

function revenuePerLb(total: number | null, weight: number | null) {
  if (total == null || weight == null || weight <= 0) return null
  return total / weight
}

function isMaterialWeightIncrease(
  originalWeight: number | null,
  replacementWeight: number | null
) {
  if (
    originalWeight == null ||
    replacementWeight == null ||
    originalWeight <= 0
  ) {
    return false
  }
  const delta = replacementWeight - originalWeight
  if (delta <= 0) return false
  return (
    delta > MATERIAL_HEAVIER_SUBSTITUTION_LB ||
    (delta >= MATERIAL_RELATIVE_HEAVIER_SUBSTITUTION_LB &&
      delta / originalWeight >= MATERIAL_HEAVIER_SUBSTITUTION_RATIO)
  )
}

function productFreeDeliveryEligible(product: StrapiCollectionProduct): boolean {
  const variant = product.MedusaProduct?.Variants?.[0]
  return getProductFreeDeliveryEligibility(product, variant?.Sku).qualifies
}

export function getSubstitutionImpact(
  item: ResolvedCuratedCollectionItem
): SubstitutionImpact {
  const originalQuantity = item.OriginalQuantity || item.Quantity
  const originalTotal = item.OriginalProduct
    ? lineEstimatedTotal(item.OriginalProduct, originalQuantity)
    : null
  const replacementTotal = lineEstimatedTotal(item.Product, item.Quantity)
  const originalWeight = lineEstimatedWeightLb(
    item.OriginalProduct,
    originalQuantity
  )
  const replacementWeight = lineEstimatedWeightLb(item.Product, item.Quantity)
  const priceDelta =
    originalTotal == null ? null : replacementTotal - originalTotal
  const weightDelta =
    originalWeight == null || replacementWeight == null
      ? null
      : replacementWeight - originalWeight
  const originalRevenuePerLb = revenuePerLb(originalTotal, originalWeight)
  const replacementRevenuePerLb = revenuePerLb(
    replacementTotal,
    replacementWeight
  )

  return {
    originalQuantity,
    originalTotal,
    replacementTotal,
    originalWeight,
    replacementWeight,
    priceDelta,
    weightDelta,
    originalRevenuePerLb,
    replacementRevenuePerLb,
    revenuePerLbDelta:
      originalRevenuePerLb == null || replacementRevenuePerLb == null
        ? null
        : replacementRevenuePerLb - originalRevenuePerLb,
    incrementalRevenuePerAddedLb:
      priceDelta != null && weightDelta != null && weightDelta > 0
        ? priceDelta / weightDelta
        : null,
  }
}

export function getSubstitutionGuardrail(
  item: ResolvedCuratedCollectionItem
): SubstitutionGuardrail {
  if (!isSubstitutionItem(item)) {
    return {
      requiresAcknowledgement: false,
      needsBusinessReview: false,
      acknowledgementReasons: [],
      reviewReasons: [],
    }
  }

  const acknowledgementReasons = ["customer should see and accept substitution"]
  const reviewReasons: string[] = []
  const impact = getSubstitutionImpact(item)
  const materiallyHeavier = isMaterialWeightIncrease(
    impact.originalWeight,
    impact.replacementWeight
  )
  const originalFreeDeliveryEligible = item.OriginalProduct
    ? productFreeDeliveryEligible(item.OriginalProduct)
    : null
  const replacementFreeDeliveryEligible = productFreeDeliveryEligible(
    item.Product
  )

  if (item.RequiresSubstitutionAcknowledgement) {
    acknowledgementReasons.push("editor requires acknowledgement")
  }

  if (item.SubstitutionValuePolicy === "smaller_pack_acknowledged") {
    acknowledgementReasons.push("replacement is a smaller pack")
    if (!item.SubstitutionNote) {
      reviewReasons.push("smaller-pack substitution needs customer-facing note")
    }
  }

  if (item.SubstitutionValuePolicy === "requires_editor_review") {
    reviewReasons.push("value policy requires editor review")
  }

  if (item.RequiresBusinessReview) {
    reviewReasons.push("editor marked substitution for business review")
  }

  if (item.ShippingCostRisk === "margin_review_required") {
    reviewReasons.push("shipping or margin risk requires review")
  }

  if (item.ShippingCostRisk === "heavier_or_bulkier") {
    acknowledgementReasons.push("replacement may be heavier or bulkier")
    if (impact.weightDelta == null) {
      reviewReasons.push("shipping-risk substitution needs comparable weights")
    }
  }

  if (materiallyHeavier) {
    acknowledgementReasons.push("replacement materially changes shipped weight")
    if (impact.incrementalRevenuePerAddedLb == null) {
      reviewReasons.push(
        "materially heavier substitution needs comparable price and weight"
      )
    } else if (
      impact.incrementalRevenuePerAddedLb < MIN_INCREMENTAL_REVENUE_PER_ADDED_LB
    ) {
      reviewReasons.push(
        "replacement adds material weight without enough incremental revenue"
      )
    }
  }

  if (
    impact.originalRevenuePerLb != null &&
    impact.replacementRevenuePerLb != null &&
    impact.originalRevenuePerLb > 0
  ) {
    const revenueDensityDrop =
      (impact.originalRevenuePerLb - impact.replacementRevenuePerLb) /
      impact.originalRevenuePerLb
    if (revenueDensityDrop > MAX_REVENUE_DENSITY_DROP_RATIO) {
      reviewReasons.push(
        "replacement lowers estimated revenue per shipped pound"
      )
    }
  }

  if (originalFreeDeliveryEligible === true && !replacementFreeDeliveryEligible) {
    reviewReasons.push(
      "substitution changes free-delivery eligibility from eligible to excluded"
    )
  }

  if (item.SubstitutionValuePolicy === "equal_or_better_value") {
    if (impact.originalTotal == null) {
      reviewReasons.push(
        "equal-or-better substitution needs original estimated value"
      )
    }
    if (impact.originalWeight == null || impact.replacementWeight == null) {
      reviewReasons.push("equal-or-better substitution needs comparable weights")
    }
    if (
      impact.priceDelta != null &&
      impact.priceDelta < -LOWER_VALUE_PRICE_TOLERANCE
    ) {
      reviewReasons.push("equal-or-better substitution is lower estimated value")
    }
    if (
      impact.weightDelta != null &&
      impact.weightDelta < -LOWER_VALUE_WEIGHT_TOLERANCE_LB
    ) {
      reviewReasons.push("equal-or-better substitution is materially smaller")
    }
  }

  return {
    requiresAcknowledgement: acknowledgementReasons.length > 0,
    needsBusinessReview: reviewReasons.length > 0,
    acknowledgementReasons,
    reviewReasons,
  }
}

export function getCollectionSubstitutionGuardrails(
  items: ResolvedCuratedCollectionItem[]
): SubstitutionGuardrail {
  return items.reduce<SubstitutionGuardrail>(
    (acc, item) => {
      const guardrail = getSubstitutionGuardrail(item)
      return {
        requiresAcknowledgement:
          acc.requiresAcknowledgement || guardrail.requiresAcknowledgement,
        needsBusinessReview:
          acc.needsBusinessReview || guardrail.needsBusinessReview,
        acknowledgementReasons: [
          ...acc.acknowledgementReasons,
          ...guardrail.acknowledgementReasons,
        ],
        reviewReasons: [...acc.reviewReasons, ...guardrail.reviewReasons],
      }
    },
    {
      requiresAcknowledgement: false,
      needsBusinessReview: false,
      acknowledgementReasons: [],
      reviewReasons: [],
    }
  )
}

export function formatMoneyDelta(delta: number) {
  if (Math.abs(delta) < 0.005) return "same estimated subtotal"
  return `${delta > 0 ? "+" : "-"}$${Math.abs(delta).toFixed(2)} estimated`
}

export function formatWeightDelta(delta: number | null) {
  if (delta == null || Math.abs(delta) < 0.05) return null
  return `${delta > 0 ? "+" : "-"}${Math.abs(delta).toFixed(1)} lb estimated`
}

export function lineFreeDeliveryEligible(
  item: ResolvedCuratedCollectionItem
): boolean {
  return productFreeDeliveryEligible(item.Product)
}

export function collectionEstimatedSubtotals(
  items: ResolvedCuratedCollectionItem[]
) {
  return items.reduce(
    (totals, item) => {
      const subtotal = lineEstimatedTotal(item.Product, item.Quantity)
      totals.total += subtotal
      if (lineFreeDeliveryEligible(item)) {
        totals.eligible += subtotal
      } else {
        totals.excluded += subtotal
      }
      return totals
    },
    { total: 0, eligible: 0, excluded: 0 }
  )
}

export function lineCartMetadata(
  item: ResolvedCuratedCollectionItem
): Record<string, unknown> {
  const variant = item.Product.MedusaProduct?.Variants?.[0]
  const impact = getSubstitutionImpact(item)

  return {
    ...freeDeliveryEligibilityMetadata(
      getProductFreeDeliveryEligibility(item.Product, variant?.Sku)
    ),
    ...(isSubstitutionItem(item)
      ? {
          substitution_status: item.SubstitutionStatus,
          substitution_note: item.SubstitutionNote || undefined,
          original_product_name:
            item.OriginalProduct?.Title ||
            item.OriginalProductName ||
            undefined,
          original_quantity: impact.originalQuantity,
          replacement_quantity: item.Quantity,
          substitution_price_delta:
            impact.priceDelta == null
              ? undefined
              : Math.round(impact.priceDelta * 100),
          substitution_weight_delta_lb:
            impact.weightDelta == null
              ? undefined
              : Number(impact.weightDelta.toFixed(2)),
        }
      : {}),
  }
}
