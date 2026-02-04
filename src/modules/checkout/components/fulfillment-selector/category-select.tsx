"use client"

import { clx } from "@medusajs/ui"

export type FulfillmentCategory = "delivery" | "pickup"

type CategorySelectProps = {
  selected: FulfillmentCategory | null
  onSelect: (category: FulfillmentCategory) => void
  deliveryAvailable: boolean
  deliveryMinimum?: number
  deliveryAmountAway?: number
  cartTotal: number
}

export default function CategorySelect({
  selected,
  onSelect,
  deliveryAvailable,
  deliveryMinimum,
  deliveryAmountAway,
  cartTotal,
}: CategorySelectProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">How would you like to receive your order?</h2>
      <p className="text-gray-600 mb-6">
        Choose delivery or pickup to see available options.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Delivery Option */}
        <button
          type="button"
          onClick={() => deliveryAvailable && onSelect("delivery")}
          disabled={!deliveryAvailable}
          className={clx(
            "relative p-6 rounded-lg border-2 text-left transition-all",
            {
              "border-Gold bg-Gold/5": selected === "delivery",
              "border-gray-200 hover:border-gray-300": selected !== "delivery" && deliveryAvailable,
              "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60": !deliveryAvailable,
            }
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={clx("p-3 rounded-full mb-3", {
                "bg-Gold text-white": selected === "delivery",
                "bg-gray-100 text-gray-600": selected !== "delivery",
              })}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1">Delivery</h3>
            <p className="text-sm text-gray-500">To your door</p>
            
            {!deliveryAvailable && deliveryAmountAway && (
              <p className="text-xs text-red-600 mt-2">
                ${deliveryAmountAway.toFixed(0)} away from minimum
              </p>
            )}
          </div>

          {/* Selection indicator */}
          {selected === "delivery" && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 rounded-full bg-Gold flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}
        </button>

        {/* Pickup Option */}
        <button
          type="button"
          onClick={() => onSelect("pickup")}
          className={clx(
            "relative p-6 rounded-lg border-2 text-left transition-all",
            {
              "border-Gold bg-Gold/5": selected === "pickup",
              "border-gray-200 hover:border-gray-300": selected !== "pickup",
            }
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={clx("p-3 rounded-full mb-3", {
                "bg-Gold text-white": selected === "pickup",
                "bg-gray-100 text-gray-600": selected !== "pickup",
              })}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1">Pickup</h3>
            <p className="text-sm text-gray-500">Come get it</p>
          </div>

          {/* Selection indicator */}
          {selected === "pickup" && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 rounded-full bg-Gold flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
