import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-precentage-diff"
import { convertToLocale } from "./money"

export const getPricesForVariant = (variant: any) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  return {
    calculated_price_number: variant.calculated_price.calculated_amount,
    calculated_price: convertToLocale({
      amount: variant.calculated_price.calculated_amount,
      currency_code: variant.calculated_price.currency_code,
    }),
    original_price_number: variant.calculated_price.original_amount,
    original_price: convertToLocale({
      amount: variant.calculated_price.original_amount,
      currency_code: variant.calculated_price.currency_code,
    }),
    currency_code: variant.calculated_price.currency_code,
    price_type: variant.calculated_price.calculated_price.price_list_type,
    percentage_diff: getPercentageDiff(
      variant.calculated_price.original_amount,
      variant.calculated_price.calculated_amount
    ),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestVariant = (() => {
    if (!product || !product.variants?.length) {
      return null
    }
    return (
      (product.variants
        .filter((v: any) => !!v.calculated_price)
        .sort((a: any, b: any) => {
          return (
            a.calculated_price.calculated_amount -
            b.calculated_price.calculated_amount
          )
        })[0] as any) || null
    )
  })()

  const selectedVariant = (() => {
    if (!product || !variantId) {
      return null
    }
    return (
      (product.variants?.find(
        (v) => v.id === variantId || v.sku === variantId
      ) as any) || null
    )
  })()

  return {
    product,
    cheapestPrice: cheapestVariant ? getPricesForVariant(cheapestVariant) : null,
    variantPrice: selectedVariant ? getPricesForVariant(selectedVariant) : null,
    // Identity of the variant that owns each price. Lets price-display
    // surfaces resolve per-lb vs fixed-price against the SAME SKU that
    // produced the headline number, not against product.variants[0]
    // (which can have a different pricing mode — e.g. 8-01-11-1
    // fixed_price vs 8-01-11-1P per_lb). Codex review follow-up.
    cheapestVariantSku: (cheapestVariant?.sku ?? null) as string | null,
    selectedVariantSku: (selectedVariant?.sku ?? null) as string | null,
  }
}
