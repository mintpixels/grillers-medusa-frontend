"use client"

import React, { useRef, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useAddToCart } from "@lib/hooks/use-add-to-cart"
import { trackViewItem } from "@lib/gtm"

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

  // Track view_item event when product is viewed
  useEffect(() => {
    if (product?.id) {
      const price = selectedVariant?.calculated_price?.calculated_amount
        ? selectedVariant.calculated_price.calculated_amount / 100
        : undefined
      
      trackViewItem({
        id: product.id,
        title: product.title || '',
        price,
        currency: region?.currency_code?.toUpperCase() || 'USD',
        category: product.collection?.title,
        variant: selectedVariant?.title,
      })
    }
  }, [product?.id]) // Only track once on mount

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
