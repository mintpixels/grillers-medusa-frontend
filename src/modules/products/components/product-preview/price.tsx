import { clx } from "@medusajs/ui"
import FormattedPrice from "@modules/common/components/formatted-price"
import { formatProductPriceDisplay } from "@lib/util/price-display"
import { VariantPrice } from "types/global"

/**
 * Preview-card price (used by Bestsellers / Specialty / related rows
 * when the product comes through the Medusa-only path). Renders the
 * same per-lb vs per-pack decision used by the PDP and PLP (#31 / #104),
 * driven by an optional `avgPackWeight` string from Strapi metadata.
 *
 * Callers without an avgPackWeight fall through to per-pack display
 * (no `/lb` label) — strictly safer than the previous unconditional
 * "per lb" suffix, which mislabeled every catch-weight brisket.
 */
export default async function PreviewPrice({
  price,
  avgPackWeight,
}: {
  price: VariantPrice
  avgPackWeight?: string | null
}) {
  if (!price) {
    return null
  }

  const display = formatProductPriceDisplay(
    price.calculated_price_number ?? 0,
    avgPackWeight
  )

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        {price.price_type === "sale" && (
          <FormattedPrice
            value={price.original_price}
            className="line-through text-gray-500 text-p-sm font-maison-neue"
          />
        )}
        <span
          className={clx("text-h4 font-gyst text-Charcoal", {
            "text-VibrantRed": price.price_type === "sale",
          })}
        >
          {display.primary}
        </span>
        {display.primaryLabel && (
          <span className="text-p-sm-mono font-maison-neue-mono uppercase text-gray-600">
            {display.primaryLabel}
          </span>
        )}
      </div>
      {display.secondary && (
        <span className="text-xs text-Charcoal/60 font-maison-neue">
          {display.secondary}
        </span>
      )}
    </div>
  )
}
