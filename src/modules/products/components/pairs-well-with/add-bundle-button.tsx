"use client"

import { useState } from "react"
import { toast } from "@medusajs/ui"
import { addToCart } from "@lib/data/cart"
import { jitsuTrack } from "@lib/jitsu"

type BundleItem = {
  variantId: string
  title: string
}

export default function AddBundleButton({
  items,
  countryCode,
  bundleId,
  bundleTitle,
}: {
  items: BundleItem[]
  countryCode: string
  bundleId: string
  bundleTitle: string
}) {
  const [isAdding, setIsAdding] = useState(false)

  const addBundle = async () => {
    if (items.length === 0) return
    setIsAdding(true)
    try {
      for (const item of items) {
        await addToCart({
          variantId: item.variantId,
          quantity: 1,
          countryCode,
          metadata: {
            bundle_id: bundleId,
            bundle_title: bundleTitle,
          },
        })
      }
      toast.success("Bundle added", {
        description: `${items.length} items added to cart.`,
      })
      jitsuTrack("bundle_added_to_cart", {
        bundle_id: bundleId,
        bundle_title: bundleTitle,
        item_count: items.length,
        items: items.map((item) => item.title),
      })
    } catch (error) {
      console.error("Failed to add bundle:", error)
      toast.error("Couldn't add bundle", {
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
      {isAdding ? "Adding..." : `Add ${items.length} items`}
    </button>
  )
}
