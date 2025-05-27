"use client"

import Image from "next/image"
import Button from "@modules/common/components/button"
import { getProductPrice } from "@lib/util/get-product-price"
import { useAddToCart } from "@lib/hooks/use-add-to-cart"
import { useProductFeaturedImageSrc } from "@lib/hooks/use-product-featured-image"

interface LineItemWithDate {
  id: string
  title: string
  product_title: string
  thumbnail: string
  unit_price: number
  unit: string
  quantity: number
  variant_id: string
  orderDate?: string
  product?: any
  variant?: any
}

export default function ReorderCard({
  item,
  showDate = false,
}: {
  item: LineItemWithDate
  showDate?: boolean
}) {
  const imgSrc = useProductFeaturedImageSrc(
    item.product.id,
    "https://placehold.co/600x400"
  )
  const {
    quantity,
    increment,
    decrement,
    selectedVariant,
    isValidVariant,
    inStock,
    isAdding,
    handleAddToCart,
  } = useAddToCart(item.product)

  const { cheapestPrice, variantPrice } = getProductPrice({
    product: item.product,
    variantId: item.variant?.id,
  })

  const selectedPrice = item?.variant ? variantPrice : cheapestPrice

  return (
    <div className="border flex flex-col">
      <div className="relative h-80 w-full">
        <Image
          src={imgSrc}
          alt={item.product_title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <span className="bg-Black text-White font-maison-neue-mono leading-none text-p-sm px-4 pt-2 pb-1.5 rounded-full uppercase tracking-wide">
            Kosher for Passover
          </span>

          {showDate && item.orderDate && (
            <span
              className="text-p-sm-bold font-maison-neue text-Charcoal font-bold"
              suppressHydrationWarning={true}
            >
              Last Purchased: {new Date(item.orderDate).toLocaleDateString()}
            </span>
          )}
        </div>
        <h3 className="text-h4 font-gyst font-bold text-Charcoal pb-4">
          {item.product_title}
        </h3>
        {selectedPrice && (
          <p className="text-Charcoal">
            <span className="text-h3 font-gyst">
              {selectedPrice.calculated_price}
            </span>
            <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-2">
              per lb
            </span>
          </p>
        )}
        {selectedPrice && (
          <div className="flex flex-col xl:flex-row items-center mb-6 mt-6 gap-y-4 xl:gap-y-0 xl:gap-x-6">
            {/* qty selector */}
            <div className="flex border border-Charcoal font-maison-neue text-p-lg min-h-[54px] h-full">
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
              disabled={
                !inStock || !selectedVariant || isAdding || !isValidVariant
              }
              onClick={handleAddToCart}
              isLoading={isAdding}
              data-testid="add-product-button"
            >
              Add to Cart – $
              {(selectedPrice.calculated_price_number * quantity).toFixed(2)}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
