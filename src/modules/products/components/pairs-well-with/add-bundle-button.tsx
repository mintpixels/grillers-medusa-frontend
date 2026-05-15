"use client"

import { useState } from "react"
import { toast } from "@medusajs/ui"
import { addToCart } from "@lib/data/cart"
import { jitsuTrack } from "@lib/jitsu"
import { dispatchCartUpdated } from "@lib/util/cart-events"

type BundleItem = {
  variantId: string
  title: string
  quantity: number
}

export default function AddBundleButton({
  items,
  countryCode,
  bundleId,
  bundleTitle,
  bundleSlug,
}: {
  items: BundleItem[]
  countryCode: string
  bundleId: string
  bundleTitle: string
  bundleSlug?: string
}) {
  const [isAdding, setIsAdding] = useState(false)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const addBundle = async () => {
    if (items.length === 0) return
    setIsAdding(true)
    let addedQuantity = 0
    try {
      for (const item of items) {
        await addToCart({
          variantId: item.variantId,
          quantity: item.quantity,
          countryCode,
          metadata: {
            bundle_id: bundleId,
            bundle_title: bundleTitle,
            curated_collection_id: bundleId,
            curated_collection_title: bundleTitle,
            curated_collection_slug: bundleSlug,
            bundle_quantity: item.quantity,
          },
        })
        addedQuantity += item.quantity
      }
      dispatchCartUpdated({ action: "bundle-add", quantity: addedQuantity })
      toast.success("Collection added", {
        description: `${totalQuantity} items added to cart.`,
      })
      jitsuTrack("add_collection_to_cart", {
        collection_id: bundleId,
        collection_slug: bundleSlug,
        collection_title: bundleTitle,
        line_count: items.length,
        item_count: totalQuantity,
        sku_count_added: items.length,
        items: items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
        })),
      })
    } catch (error) {
      if (addedQuantity > 0) {
        dispatchCartUpdated({ action: "bundle-add", quantity: addedQuantity })
      }
      console.error("Failed to add bundle:", error)
      toast.error("Couldn't add collection", {
        description: "Please try again in a moment.",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      type="button"
      onClick={addBundle}
      disabled={isAdding || items.length === 0}
      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[5px] border border-Charcoal bg-Gold px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {isAdding ? "Adding..." : `Add ${totalQuantity} items`}
    </button>
  )
}
