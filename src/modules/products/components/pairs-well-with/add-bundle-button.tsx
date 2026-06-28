"use client"

import { useState } from "react"
import { toast } from "@medusajs/ui"
import { addMultipleToCart } from "@lib/data/cart"
import { jitsuTrack } from "@lib/jitsu"
import { experimentCartMetadata } from "@lib/experiments/client-context"
import { reportClientOpsAlert } from "@lib/client-ops-alert"
import { dispatchCartUpdated } from "@lib/util/cart-events"
import { reportClientOpsAlert } from "@lib/client-error-reporter"

type BundleItem = {
  variantId: string
  title: string
  quantity: number
  metadata?: Record<string, unknown>
}

const SLOW_COLLECTION_ADD_MS = Number(
  process.env.NEXT_PUBLIC_CART_ACTION_SLOW_ALERT_MS || 5_000
)

export default function AddBundleButton({
  items,
  countryCode,
  bundleId,
  bundleTitle,
  bundleSlug,
  requiresAcknowledgement = false,
  acknowledgementLabel = "I understand this collection includes a substitution.",
  disabledReason,
  className = "space-y-3",
  buttonClassName = "",
  fullWidth = false,
}: {
  items: BundleItem[]
  countryCode: string
  bundleId: string
  bundleTitle: string
  bundleSlug?: string
  requiresAcknowledgement?: boolean
  acknowledgementLabel?: string
  disabledReason?: string | null
  className?: string
  buttonClassName?: string
  fullWidth?: boolean
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [acknowledged, setAcknowledged] = useState(!requiresAcknowledgement)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const addBundle = async () => {
    if (items.length === 0 || !acknowledged || disabledReason) return
    setIsAdding(true)
    const startedAt = Date.now()
    let addedQuantity = 0
    try {
      const experimentMetadata = experimentCartMetadata()
      const result = await addMultipleToCart(
        items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          countryCode,
          metadata: {
            ...experimentMetadata,
            ...(item.metadata || {}),
            bundle_id: bundleId,
            bundle_title: bundleTitle,
            curated_collection_id: bundleId,
            curated_collection_title: bundleTitle,
            curated_collection_slug: bundleSlug,
            bundle_quantity: item.quantity,
          },
        }))
      )

      addedQuantity = result.addedQuantity
      if (result.added === 0) {
        throw new Error("No collection items were added.")
      }

      dispatchCartUpdated({ action: "bundle-add", quantity: addedQuantity })
      if (result.failed > 0) {
        toast.error("Some items could not be added", {
          description: `${addedQuantity} items were added. Please review your cart before checkout.`,
        })
      } else {
        toast.success("Collection added", {
          description: `${totalQuantity} items added to cart.`,
        })
      }
      jitsuTrack("add_collection_to_cart", {
        collection_id: bundleId,
        collection_slug: bundleSlug,
        collection_title: bundleTitle,
        line_count: items.length,
        item_count: totalQuantity,
        item_count_added: addedQuantity,
        sku_count_added: result.added,
        sku_count_failed: result.failed,
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
      reportClientOpsAlert({
        alertKind: "client_cart_mutation_failed",
        title: "Storefront client cart mutation failed",
        surface: "pdp_pairs_well_with_bundle",
        action: "add_bundle_to_cart",
        error,
        productId: bundleId,
        productHandle: bundleSlug,
      })
      toast.error("Couldn't add collection", {
        description: "Please try again in a moment.",
      })
    } finally {
      const durationMs = Date.now() - startedAt
      if (durationMs >= SLOW_COLLECTION_ADD_MS) {
        reportClientOpsAlert({
          kind: "revenue_action_slow",
          severity: "warn",
          title: `Collection add took ${durationMs}ms`,
          message: `Collection add took ${durationMs}ms for ${items.length} SKUs.`,
          extra: {
            action: "add_collection_to_cart",
            collection_id: bundleId,
            collection_slug: bundleSlug || "",
            sku_count: items.length,
            quantity_requested: totalQuantity,
            quantity_added: addedQuantity,
            duration_ms: durationMs,
            threshold_ms: SLOW_COLLECTION_ADD_MS,
          },
        })
      }
      setIsAdding(false)
    }
  }

  return (
    <div className={className}>
      {requiresAcknowledgement && (
        <label className="flex items-start gap-2 font-maison-neue text-xs leading-snug text-Charcoal/70">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-Charcoal/30 text-Gold focus:ring-Gold"
          />
          <span>{acknowledgementLabel}</span>
        </label>
      )}
      <button
        type="button"
        onClick={addBundle}
        disabled={
          isAdding ||
          items.length === 0 ||
          !acknowledged ||
          Boolean(disabledReason)
        }
        className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-[5px] border border-Charcoal bg-Gold px-5 py-3 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 ${
          fullWidth ? "" : "sm:w-auto"
        } ${buttonClassName}`}
      >
        {isAdding ? "Adding..." : `Add ${totalQuantity} items`}
      </button>
      {disabledReason && (
        <p className="font-maison-neue text-xs leading-snug text-Charcoal/60">
          {disabledReason}
        </p>
      )}
    </div>
  )
}
