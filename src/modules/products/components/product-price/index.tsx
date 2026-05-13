import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { formatProductPriceDisplay } from "@lib/util/price-display"
import { HttpTypes } from "@medusajs/types"
import type { Metadata } from "types/strapi"

/**
 * Used by the PDP mobile sticky actions and the in-cart sticky action.
 * Shares the per-lb vs fixed-price decision logic from
 * `formatProductPriceDisplay` so the sticky never shows `$227` next to
 * a cart line that the catch-weight-aware blocks elsewhere already
 * show as `$15.99/lb · est. $227/pack` (#31 / #104).
 */
export default function ProductPrice({
  product,
  variant,
  metadata,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  metadata?: Metadata | null
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

  // Resolve mode against the SKU that owns the displayed price. See
  // product-detail/components/product-price/index.tsx for the rationale.
  const resolvedSku =
    variant?.sku ??
    selectedVariantSku ??
    cheapestVariantSku ??
    product.variants?.[0]?.sku ??
    null

  const display = formatProductPriceDisplay(
    selectedPrice.calculated_price_number ?? 0,
    metadata,
    resolvedSku
  )

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-xl-semi inline-flex items-baseline gap-2", {
          "text-ui-fg-interactive": selectedPrice.price_type === "sale",
        })}
      >
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {display.primary}
        </span>
        {display.primaryLabel && (
          <span className="text-xs uppercase text-Charcoal/60 font-maison-neue-mono">
            {display.primaryLabel}
          </span>
        )}
      </span>
      {display.secondary && (
        <span className="text-xs text-Charcoal/60 font-maison-neue mt-0.5">
          {display.secondary}
        </span>
      )}
      {selectedPrice.price_type === "sale" && (
        <>
          <p>
            <span className="text-ui-fg-subtle">Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-ui-fg-interactive">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
