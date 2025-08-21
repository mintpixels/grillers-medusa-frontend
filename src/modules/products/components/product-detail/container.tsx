"use client"

import React, { useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useAddToCart } from "@lib/hooks/use-add-to-cart"

import ProductDetail from "./components"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductDetailContainer({
  product,
  region,
  countryCode,
  strapiProductData,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiProductData: any
}) {
  const {
    quantity,
    increment,
    decrement,
    options,
    setOptionValue,
    selectedVariant,
    isValidVariant,
    inStock,
    isAdding,
    handleAddToCart,
  } = useAddToCart(product, countryCode)

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  return (
    <ProductDetail
      product={product}
      region={region}
      countryCode={countryCode}
      strapiProductData={strapiProductData}
      selectedVariant={selectedVariant}
      options={options}
      setOptionValue={setOptionValue}
      inStock={inStock}
      isAdding={isAdding}
      isValidVariant={isValidVariant}
      quantity={quantity}
      increment={increment}
      decrement={decrement}
      handleAddToCart={handleAddToCart}
    />
  )
}
