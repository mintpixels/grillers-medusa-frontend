import { clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex items-baseline gap-2">
      {price.price_type === "sale" && (
        <span
          className="line-through text-gray-500 text-p-sm font-maison-neue"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
      <span
        className={clx("text-h4 font-gyst text-Charcoal", {
          "text-VibrantRed": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
      <span className="text-p-sm-mono font-maison-neue-mono uppercase text-gray-600">
        per lb
      </span>
    </div>
  )
}
