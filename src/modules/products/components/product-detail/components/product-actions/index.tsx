import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import Button from "@modules/common/components/button"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  inStock?: boolean
  isAdding?: boolean
  isValidVariant?: boolean
  quantity: number
  increment: () => void
  decrement: () => void
  handleAddToCart: () => void
}

export default function ProductActions({
  product,
  variant,
  decrement,
  increment,
  quantity,
  inStock,
  isAdding,
  isValidVariant,
  handleAddToCart,
}: ProductActionsProps) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex flex-col md:flex-row items-center mb-6 gap-y-4 md:gap-y-0 md:gap-x-8">
      {/* qty selector */}
      <div className="flex border border-Charcoal h-full font-maison-neue text-p-lg">
        <button
          onClick={decrement}
          className="px-4 text-Charcoal hover:bg-SilverPlate transition w-[50px]"
        >
          –
        </button>
        <span className="inline-flex items-center justify-center px-4 border-x border-Charcoal text-Charcoal w-[50px]">
          {quantity}
        </span>
        <button
          onClick={increment}
          className="px-4 text-Charcoal hover:bg-SilverPlate transition w-[50px]"
        >
          +
        </button>
      </div>

      {/* add to cart */}
      <Button
        className="flex-1 btn-primary"
        type="button"
        disabled={!inStock || !variant || isAdding || !isValidVariant}
        onClick={handleAddToCart}
        isLoading={isAdding}
        data-testid="add-product-button"
      >
        Add to Cart – $
        {(selectedPrice.calculated_price_number * quantity).toFixed(2)}
      </Button>
    </div>
  )
}
