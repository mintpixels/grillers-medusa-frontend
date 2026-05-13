import { getProductPrice } from "@lib/util/get-product-price"
import { formatProductPriceDisplay } from "@lib/util/price-display"
import { HttpTypes } from "@medusajs/types"

/**
 * PDP price block. Branches on the catalog's AvgPackWeight signal so
 * catch-weight items (e.g. brisket "14-17 lb.") render `$X.XX / lb`
 * with the est. pack subtotal below, single-lb items render `/lb`
 * cleanly, and oz / count-based items render `$Y.YY` with no `/lb`
 * (Mike Salguero's lamb-chop case from #104).
 */
export default function ProductPrice({
  product,
  variant,
  avgPackWeight,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  avgPackWeight?: string | null
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  // `calculated_price_number` is the raw amount in dollars — use it for
  // the per-lb math instead of parsing the locale-formatted string.
  const display = formatProductPriceDisplay(
    selectedPrice.calculated_price_number ?? 0,
    avgPackWeight
  )

  return (
    <div className="border-b sm:border-b-0 sm:border-r border-Charcoal py-6">
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
