"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { isEqual } from "lodash"
import { addToCart } from "@lib/data/cart"

/**
 * Maps an array of variant options to a key/value object
 */
const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

/**
 * Custom hook to manage adding a product to the cart
 */
export function useAddToCart(
  product: HttpTypes.StoreProduct,
  countryCode: string = "us"
) {
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  // Derive the selected variant based on chosen options
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Check if the current option selection matches a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Determine stock availability for the selected variant
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  // Handlers for quantity adjustments
  const increment = () => setQuantity((q) => q + 1)
  const decrement = () => setQuantity((q) => Math.max(1, q - 1))

  // Update a specific option
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  // Add to cart action
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) {
      return
    }
    setIsAdding(true)
    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })
    setIsAdding(false)
  }

  return {
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
  }
}
