import { getProductPrice } from "@lib/util/get-product-price"
import { formatProductPriceDisplay } from "@lib/util/price-display"
import { HttpTypes } from "@medusajs/types"
import type { Metadata } from "types/strapi"

/**
 * PDP price block. Resolves per-lb vs fixed-price via
 * `formatProductPriceDisplay` (sourced from Strapi `PricingMode`, then
 * the bundled SKU map, then a weight heuristic) and renders the
 * "Estimated $X for a ~Y lb pack" sub-line for catch-weight items.
 *
 * `$3.98 / LB`               (per-lb)        |   `$25.00`        (fixed)
 * `Estimated $4.78 for ~1.2 lb pack`        |   `Each — fixed price`
 */
export default function ProductPrice({
  product,
  variant,
  metadata,
  explicitMode,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  metadata?: Metadata | null
  explicitMode?: "per_lb" | "fixed_price" | null
}) {
  const {
    cheapestPrice,
    variantPrice,
    cheapestVariantSku,
    selectedVariantSku,
  } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  // Resolve mode against the SKU that OWNS the displayed price.
  //
  // On SSR (no variant picked yet), the displayed price is the
  // cheapest variant's price — so we resolve the SKU map against
  // that same variant's SKU, not product.variants[0]. Codex review
  // flagged that for products like 8-01-11-1 (fixed_price) /
  // 8-01-11-1P (per_lb), cheapest can be either, and resolving
  // against [0] silently rendered the wrong format.
  const resolvedSku =
    variant?.sku ??
    selectedVariantSku ??
    cheapestVariantSku ??
    product.variants?.[0]?.sku ??
    null

  const display = formatProductPriceDisplay(
    selectedPrice.calculated_price_number ?? 0,
    metadata,
    resolvedSku,
    explicitMode
  )

  return (
    <div className="py-6">
      <div className="flex items-baseline gap-3">
        <span className="text-h3 font-gyst text-Charcoal">{display.primary}</span>
        {display.primaryLabel && (
          <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal">
            {display.primaryLabel}
          </span>
        )}
      </div>
      {display.secondary && (
        <p className="text-p-sm font-maison-neue text-Charcoal/60 mt-1">
          {display.secondary}
        </p>
      )}
    </div>
  )
}
