import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="border-r border-Charcoal py-6">
      <span className="text-h3 font-gyst text-Charcoal">
        {selectedPrice.calculated_price}
      </span>
      <span className="text-p-sm-mono font-maison-neue-mono uppercase text-Charcoal pl-5">
        per lb
      </span>
    </div>
  )
}
