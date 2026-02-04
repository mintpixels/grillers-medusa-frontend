"use client"

import { HttpTypes } from "@medusajs/types"
import type { FulfillmentType } from "@lib/data/cart"

type FulfillmentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const fulfillmentLabels: Record<FulfillmentType, string> = {
  plant_pickup: "Plant Pickup",
  atlanta_delivery: "Atlanta Delivery",
  ups_shipping: "UPS Shipping",
  southeast_pickup: "Southeast Pickup",
}

/**
 * Formats date string for display
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  // Handle MM/DD/YYYY format
  if (dateStr.includes("/")) {
    const [month, day, year] = dateStr.split("/")
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }
  // Handle ISO format
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Formats time window ID to readable string
 */
function formatTimeWindow(windowId: string): string {
  const windows: Record<string, string> = {
    morning: "Morning (9am - 12pm)",
    afternoon: "Afternoon (12pm - 5pm)",
    evening: "Evening (5pm - 9pm)",
  }
  return windows[windowId] || windowId
}

/**
 * Displays fulfillment details on the order confirmation page.
 * Shows different content based on the fulfillment type.
 */
export default function FulfillmentDetails({ order }: FulfillmentDetailsProps) {
  const fulfillmentType = order.metadata?.fulfillmentType as FulfillmentType | undefined
  const scheduledDate = order.metadata?.scheduledDate as string | undefined
  const timeWindow = order.metadata?.scheduledTimeWindow as string | undefined
  const pickupLocationId = order.metadata?.pickupLocationId as string | undefined

  if (!fulfillmentType) {
    return null
  }

  return (
    <div className="bg-Gold/10 border border-Gold/30 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4 text-Charcoal">
        {fulfillmentLabels[fulfillmentType]}
      </h3>

      {fulfillmentType === "plant_pickup" && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Pickup Date</p>
            <p className="font-medium">{formatDate(scheduledDate || "")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-medium">Grillers Pride Plant</p>
            <p className="text-sm text-gray-600">
              {/* Address would come from Strapi config */}
              Atlanta, GA
            </p>
          </div>
          <div className="bg-white/50 rounded p-3 mt-4">
            <p className="text-sm text-Charcoal">
              <strong>Important:</strong> Please bring your order confirmation
              email and a valid photo ID when picking up your order.
            </p>
          </div>
        </div>
      )}

      {fulfillmentType === "atlanta_delivery" && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Delivery Date</p>
            <p className="font-medium">{formatDate(scheduledDate || "")}</p>
          </div>
          {timeWindow && (
            <div>
              <p className="text-sm text-gray-600">Time Window</p>
              <p className="font-medium">{formatTimeWindow(timeWindow)}</p>
            </div>
          )}
          <div className="bg-white/50 rounded p-3 mt-4">
            <p className="text-sm text-Charcoal">
              Our delivery driver will contact you via the phone number on your
              order when they are on their way. Please ensure someone is
              available to receive the delivery.
            </p>
          </div>
        </div>
      )}

      {fulfillmentType === "ups_shipping" && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Expected Delivery</p>
            <p className="font-medium">{formatDate(scheduledDate || "")}</p>
          </div>
          <div className="bg-white/50 rounded p-3 mt-4">
            <p className="text-sm text-Charcoal">
              Your order will be shipped via UPS. You will receive tracking
              information via email once your order has been shipped.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              *Delivery dates are estimates and may vary based on shipping
              conditions.
            </p>
          </div>
        </div>
      )}

      {fulfillmentType === "southeast_pickup" && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Pickup Date</p>
            <p className="font-medium">{formatDate(scheduledDate || "")}</p>
          </div>
          {pickupLocationId && (
            <div>
              <p className="text-sm text-gray-600">Pickup Location</p>
              <p className="font-medium">
                {/* Location name would be fetched based on ID */}
                Southeast Pickup Point #{pickupLocationId}
              </p>
            </div>
          )}
          <div className="bg-white/50 rounded p-3 mt-4">
            <p className="text-sm text-Charcoal">
              Please bring your order confirmation email to the pickup location.
              You will receive a reminder email with complete pickup details.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
