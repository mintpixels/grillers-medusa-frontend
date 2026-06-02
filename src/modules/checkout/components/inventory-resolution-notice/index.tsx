"use client"

import {
  getCartInventoryReview,
  submitInventoryResolution,
} from "@lib/data/cart"
import { requestBackInStockNotification } from "@lib/data/back-in-stock"
import type { InventoryAvailabilityLine } from "@lib/data/inventory-allocation"
import type { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type Props = {
  cart: HttpTypes.StoreCart
}

function lineStatus(line: InventoryAvailabilityLine) {
  if (line.decision === "inactive") return "Not offered"
  if (line.decision === "partial") return "Partly available"
  if (line.decision === "blocked") return "Needs action"
  if (line.decision === "future_allowed") return "Future order"
  return "Available"
}

function lineCopy(line: InventoryAvailabilityLine) {
  if (line.decision === "inactive") {
    return "This item is not currently offered and cannot be waitlisted."
  }
  if (line.decision === "partial") {
    return `${line.available_to_promise_quantity} available for this date. Update the quantity, choose a replacement, or move the order date.`
  }
  if (line.decision === "blocked") {
    return line.earliest_available_date
      ? `Not available for this date. Expected again around ${line.earliest_available_date}.`
      : "Not available for this date. Choose a replacement, remove it, join the waitlist, or move the order date."
  }
  if (line.decision === "future_allowed") {
    return "Accepted as a future commitment for the selected date."
  }
  return `${line.available_to_promise_quantity} available for this date.`
}

function requestedFulfillmentDateFromCart(cart: HttpTypes.StoreCart) {
  const metadata = (cart.metadata || {}) as Record<string, unknown>
  const requestedDate =
    metadata.requestedDeliveryDate ||
    metadata.scheduledDate ||
    metadata.requested_fulfillment_date

  return typeof requestedDate === "string" ? requestedDate : undefined
}

export default function InventoryResolutionNotice({ cart }: Props) {
  const router = useRouter()
  const [review, setReview] = useState<Awaited<
    ReturnType<typeof getCartInventoryReview>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState<string | null>(null)

  const inventoryKey = useMemo(() => {
    const metadata = cart.metadata || {}
    return JSON.stringify({
      cartId: cart.id,
      fulfillmentType: metadata.fulfillmentType,
      scheduledDate: metadata.scheduledDate,
      requestedDeliveryDate: metadata.requestedDeliveryDate,
      lines: (cart.items || []).map((item: any) => ({
        id: item.id,
        variantId: item.variant_id || item.variant?.id,
        quantity: item.quantity,
      })),
    })
  }, [cart])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getCartInventoryReview(cart.id)
      .then((result) => {
        if (!cancelled) setReview(result)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cart.id, inventoryKey])

  const lines = review?.lines || []
  const cartItemByVariant = new Map(
    (cart.items || []).map((item: any) => [item.variant_id || item.variant?.id, item])
  )
  const blocking = lines.filter((line) =>
    ["partial", "blocked", "inactive"].includes(line.decision)
  )
  const future = lines.filter((line) => line.decision === "future_allowed")

  if (isLoading && !review) {
    return (
      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        Checking inventory for the selected date...
      </div>
    )
  }

  if (review?.error && !blocking.length) {
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {review.error}
      </div>
    )
  }

  if (!blocking.length && !future.length) return null

  return (
    <div
      className={`mb-5 rounded-lg border p-4 ${
        blocking.length
          ? "border-amber-300 bg-amber-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-Charcoal">
          {blocking.length
            ? "Some items need attention before payment."
            : "Future-date inventory accepted."}
        </p>
        <p className="text-sm text-Charcoal/70">
          {blocking.length
            ? "Complete the available items now by removing or replacing blocked lines, or move the whole order to a later date."
            : "These lines are accepted for your selected future date and will be tracked as commitments."}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {[...blocking, ...future].map((line) => (
          <div
            key={line.variant_id}
            className="rounded-md border border-white/70 bg-white px-3 py-3"
          >
            <div className="flex flex-col gap-2 small:flex-row small:items-start small:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-Charcoal">
                  {line.title || line.sku || line.variant_id}
                </p>
                <p className="text-xs text-Charcoal/55">
                  {[line.sku ? `SKU ${line.sku}` : "", `Qty ${line.requested_quantity}`]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-Charcoal/10 bg-Scroll px-2.5 py-1 text-[11px] font-semibold uppercase text-Charcoal/70">
                {lineStatus(line)}
              </span>
            </div>
            <p className="mt-2 text-sm text-Charcoal/70">{lineCopy(line)}</p>
            {(() => {
              const item = cartItemByVariant.get(line.variant_id) as any
              if (!item || line.decision === "future_allowed") return null
              const lineActionKey = `${line.variant_id}:${line.decision}`
              const canWaitlist =
                Boolean(cart.email) &&
                line.lifecycle === "active" &&
                line.decision !== "inactive" &&
                item.product?.handle
              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  {line.decision === "partial" &&
                    line.available_to_promise_quantity > 0 && (
                      <button
                        className="min-h-[36px] rounded-md border border-Charcoal px-3 text-xs font-semibold uppercase text-Charcoal disabled:opacity-50"
                        disabled={Boolean(actionPending)}
                        type="button"
                        onClick={async () => {
                          setActionPending(`${lineActionKey}:qty`)
                          setActionMessage(null)
                          await submitInventoryResolution({
                            cartId: cart.id,
                            requestedFulfillmentDate:
                              requestedFulfillmentDateFromCart(cart),
                            resolutions: [
                              {
                                originalVariantId: line.variant_id,
                                action: "complete_available_only",
                                quantity: line.available_to_promise_quantity,
                              },
                            ],
                          })
                          setActionPending(null)
                          router.refresh()
                        }}
                      >
                        Use available qty
                      </button>
                    )}
                  <button
                    className="min-h-[36px] rounded-md border border-Charcoal px-3 text-xs font-semibold uppercase text-Charcoal disabled:opacity-50"
                    disabled={Boolean(actionPending)}
                    type="button"
                    onClick={async () => {
                      setActionPending(`${lineActionKey}:remove`)
                      setActionMessage(null)
                      await submitInventoryResolution({
                        cartId: cart.id,
                        requestedFulfillmentDate:
                          requestedFulfillmentDateFromCart(cart),
                        resolutions: [
                          {
                            originalVariantId: line.variant_id,
                            action: "remove",
                          },
                        ],
                      })
                      setActionPending(null)
                      router.refresh()
                    }}
                  >
                    Remove item
                  </button>
                  {canWaitlist && (
                    <button
                      className="min-h-[36px] rounded-md bg-Charcoal px-3 text-xs font-semibold uppercase text-white disabled:opacity-50"
                      disabled={Boolean(actionPending)}
                      type="button"
                      onClick={async () => {
                        setActionPending(`${lineActionKey}:waitlist`)
                        const result = await requestBackInStockNotification({
                          email: String(cart.email),
                          medusaProductId: item.product_id || item.product?.id,
                          medusaVariantId: line.variant_id,
                          productHandle: item.product?.handle,
                          productTitle: line.title || item.product_title || item.title,
                          sku: line.sku,
                          requestedFulfillmentDate: String(
                            cart.metadata?.requestedDeliveryDate ||
                              cart.metadata?.scheduledDate ||
                              ""
                          ),
                          waitlistReason:
                            line.decision === "partial"
                              ? "allocated_out"
                              : "allocated_out",
                          source: "side_cart",
                        })
                        if (result.ok) {
                          await submitInventoryResolution({
                            cartId: cart.id,
                            requestedFulfillmentDate:
                              requestedFulfillmentDateFromCart(cart),
                            resolutions: [
                              {
                                originalVariantId: line.variant_id,
                                action: "waitlist",
                                email: String(cart.email),
                              },
                            ],
                          })
                          router.refresh()
                        }
                        setActionPending(null)
                        setActionMessage(
                          result.ok
                            ? "Waitlist request saved for this item."
                            : result.error ||
                                "Could not save the waitlist request."
                        )
                      }}
                    >
                      Notify me
                    </button>
                  )}
                </div>
              )
            })()}
            {line.alternatives?.length ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-Charcoal/60">
                  Replacement options
                </p>
                <div className="flex flex-wrap gap-2">
                  {line.alternatives.slice(0, 3).map((alternative) => (
                    <button
                      className="min-h-[36px] rounded-md border border-Gold/40 bg-Gold/10 px-2.5 py-1 text-left text-xs font-semibold text-Charcoal disabled:opacity-50"
                      disabled={Boolean(actionPending)}
                      key={alternative.variant_id}
                      type="button"
                      onClick={async () => {
                        const item = cartItemByVariant.get(line.variant_id) as any
                        if (!item || !alternative.variant_id) return

                        setActionPending(
                          `${line.variant_id}:${alternative.variant_id}:replace`
                        )
                        setActionMessage(null)

                        try {
                          await submitInventoryResolution({
                            cartId: cart.id,
                            requestedFulfillmentDate:
                              requestedFulfillmentDateFromCart(cart),
                            resolutions: [
                              {
                                originalVariantId: line.variant_id,
                                action: "substitute",
                                replacementVariantId: alternative.variant_id,
                                quantity: line.requested_quantity,
                              },
                            ],
                          })
                          setActionMessage("Replacement item added to cart.")
                          router.refresh()
                        } catch (error) {
                          setActionMessage(
                            error instanceof Error
                              ? error.message
                              : "Could not add the replacement item."
                          )
                        } finally {
                          setActionPending(null)
                        }
                      }}
                    >
                      <span className="block">{alternative.title}</span>
                      {alternative.sku ? (
                        <span className="block font-normal text-Charcoal/60">
                          SKU {alternative.sku}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {actionMessage && (
        <p className="mt-3 text-sm font-medium text-Charcoal">
          {actionMessage}
        </p>
      )}
    </div>
  )
}
