"use client"

import { clx } from "@medusajs/ui"
import type { FulfillmentType } from "@lib/data/cart"

type FulfillmentOptionCardProps = {
  type: FulfillmentType
  title: string
  description: string
  price: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  minimumRequired?: number
  amountAway?: number
}

const icons: Record<FulfillmentType, React.ReactNode> = {
  plant_pickup: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  atlanta_delivery: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  ups_shipping: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  southeast_pickup: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export default function FulfillmentOptionCard({
  type,
  title,
  description,
  price,
  selected,
  onClick,
  disabled = false,
  minimumRequired,
  amountAway,
}: FulfillmentOptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={clx(
        "w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4",
        {
          "border-Gold bg-Gold/5": selected && !disabled,
          "border-gray-200 hover:border-gray-300 hover:bg-gray-50": !selected && !disabled,
          "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60": disabled,
        }
      )}
    >
      {/* Icon */}
      <div
        className={clx(
          "p-2 rounded-lg flex-shrink-0",
          {
            "bg-Gold text-white": selected && !disabled,
            "bg-gray-100 text-gray-600": !selected || disabled,
          }
        )}
      >
        {icons[type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={clx("font-semibold", {
            "text-gray-900": !disabled,
            "text-gray-500": disabled,
          })}>{title}</h3>
          <span
            className={clx("text-sm font-medium", {
              "text-Gold": price === "Free" && !disabled,
              "text-gray-600": price !== "Free" && !disabled,
              "text-gray-400": disabled,
            })}
          >
            {price}
          </span>
        </div>
        <p className={clx("text-sm mt-0.5", {
          "text-gray-600": !disabled,
          "text-gray-400": disabled,
        })}>{description}</p>
        
        {/* Minimum threshold message */}
        {disabled && amountAway !== undefined && minimumRequired !== undefined && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            ${amountAway.toFixed(0)} away from ${minimumRequired} minimum
          </p>
        )}
      </div>

      {/* Radio indicator */}
      <div
        className={clx(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5",
          {
            "border-Gold": selected && !disabled,
            "border-gray-300": !selected || disabled,
          }
        )}
      >
        {selected && !disabled && <div className="w-2.5 h-2.5 rounded-full bg-Gold" />}
      </div>
    </button>
  )
}
