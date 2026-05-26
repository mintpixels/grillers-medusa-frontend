"use client"

import React, { useRef, useEffect, useCallback, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useAddToCart } from "@lib/hooks/use-add-to-cart"
import { trackViewItem } from "@lib/gtm"
import { jitsuTrack } from "@lib/jitsu"
import {
  getCartConversionState,
  type CartConversionState,
} from "@lib/data/conversion"
import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import type { PurchaseHistoryItem } from "@lib/data/orders"

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
  purchaseHistoryItem,
  pdpExperimentVariant,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiProductData: any
  purchaseHistoryItem?: PurchaseHistoryItem | null
  pdpExperimentVariant?: string | null
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
  } = useAddToCart(product, countryCode, strapiProductData)

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")
  const [cartConversion, setCartConversion] =
    useState<CartConversionState | null>(null)

  const refreshCartConversion = useCallback(async () => {
    try {
      setCartConversion(await getCartConversionState())
    } catch {
      setCartConversion(null)
    }
  }, [])

  useEffect(() => {
    refreshCartConversion()
  }, [refreshCartConversion])

  useEffect(() => {
    window.addEventListener(CART_UPDATED_EVENT, refreshCartConversion)
    return () =>
      window.removeEventListener(CART_UPDATED_EVENT, refreshCartConversion)
  }, [refreshCartConversion])

  const handleAddToCartAndRefresh = useCallback(async () => {
    await handleAddToCart()
    await refreshCartConversion()
  }, [handleAddToCart, refreshCartConversion])

  // Track view_item event when product is viewed
  useEffect(() => {
    if (product?.id) {
      try {
        const price = selectedVariant?.calculated_price?.calculated_amount
          ? selectedVariant.calculated_price.calculated_amount / 100
          : undefined

        trackViewItem({
          id: product.id,
          title: product.title || "",
          titleOverride: strapiProductData?.Title || undefined,
          price,
          currency: region?.currency_code?.toUpperCase() || "USD",
          category: product.collection?.title,
          variant: selectedVariant?.title || undefined,
        })

        jitsuTrack("product_viewed", {
          item_id: product.id,
          item_name: strapiProductData?.Title || product.title || "",
          variant_id: selectedVariant?.id,
          price,
          currency: region?.currency_code?.toUpperCase() || "USD",
          category: product.collection?.title,
          kosher_type: product.metadata?.kosher_type as string | undefined,
          cut_type: product.metadata?.cut_type as string | undefined,
        })
      } catch (error) {
        console.error("Failed to track PDP view:", error)
      }
    }
  }, [product?.id]) // Only track once on mount

  // Track PDP scroll depth at 25/50/75/100% thresholds
  useEffect(() => {
    if (!actionsRef.current || !product?.id) return
    const thresholds = [0.25, 0.5, 0.75, 1.0]
    const fired = new Set<number>()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          thresholds.forEach((t) => {
            const pct = t * 100
            if (entry.intersectionRatio >= t && !fired.has(pct)) {
              fired.add(pct)
              jitsuTrack("pdp_scroll_depth", {
                item_id: product.id,
                max_percent: pct,
                cta_visible: entry.isIntersecting,
              })
            }
          })
        })
      },
      { threshold: thresholds }
    )

    observer.observe(actionsRef.current)
    return () => observer.disconnect()
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      handleAddToCart={handleAddToCartAndRefresh}
      actionsRef={actionsRef}
      showMobileActions={!inView}
      cartConversion={cartConversion}
      purchaseHistoryItem={purchaseHistoryItem}
      pdpExperimentVariant={pdpExperimentVariant}
    />
  )
}
