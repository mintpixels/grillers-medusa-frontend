"use client"

import { clx } from "@medusajs/ui"

export type PickupType = "atlanta_hq" | "southeast"

type PickupTypeSelectProps = {
  selected: PickupType | null
  onSelect: (type: PickupType) => void
  onBack: () => void
  atlantaAvailable: boolean
  atlantaMinimum?: number
  atlantaAmountAway?: number
  southeastAvailable: boolean
  southeastMinimum?: number
  southeastAmountAway?: number
  cartTotal: number
}

export default function PickupTypeSelect({
  selected,
  onSelect,
  onBack,
  atlantaAvailable,
  atlantaMinimum,
  atlantaAmountAway,
  southeastAvailable,
  southeastMinimum,
  southeastAmountAway,
  cartTotal,
}: PickupTypeSelectProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-Gold hover:text-Gold/80 text-sm mb-4 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold mb-2">Where would you like to pick up?</h2>
      <p className="text-gray-600 mb-6">
        Choose a pickup location that works for you.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Atlanta HQ Option */}
        <button
          type="button"
          onClick={() => atlantaAvailable && onSelect("atlanta_hq")}
          disabled={!atlantaAvailable}
          className={clx(
            "relative p-6 rounded-lg border-2 text-left transition-all",
            {
              "border-Gold bg-Gold/5": selected === "atlanta_hq",
              "border-gray-200 hover:border-gray-300": selected !== "atlanta_hq" && atlantaAvailable,
              "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60": !atlantaAvailable,
            }
          )}
        >
          <div className="flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div
                className={clx("p-2 rounded-lg", {
                  "bg-Gold text-white": selected === "atlanta_hq",
                  "bg-gray-100 text-gray-600": selected !== "atlanta_hq",
                })}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              
              {/* Selection indicator */}
              {selected === "atlanta_hq" && (
                <div className="w-5 h-5 rounded-full bg-Gold flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-1">Atlanta HQ</h3>
            <p className="text-sm text-gray-500 mb-2">Our plant location</p>
            <p className="text-sm font-medium text-green-600">Free pickup</p>
            
            {!atlantaAvailable && atlantaAmountAway && (
              <p className="text-xs text-red-600 mt-2">
                ${atlantaAmountAway.toFixed(0)} away from ${atlantaMinimum} minimum
              </p>
            )}
          </div>
        </button>

        {/* Southeast Pickup Option */}
        <button
          type="button"
          onClick={() => southeastAvailable && onSelect("southeast")}
          disabled={!southeastAvailable}
          className={clx(
            "relative p-6 rounded-lg border-2 text-left transition-all",
            {
              "border-Gold bg-Gold/5": selected === "southeast",
              "border-gray-200 hover:border-gray-300": selected !== "southeast" && southeastAvailable,
              "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60": !southeastAvailable,
            }
          )}
        >
          <div className="flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div
                className={clx("p-2 rounded-lg", {
                  "bg-Gold text-white": selected === "southeast",
                  "bg-gray-100 text-gray-600": selected !== "southeast",
                })}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              
              {/* Selection indicator */}
              {selected === "southeast" && (
                <div className="w-5 h-5 rounded-full bg-Gold flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-1">Southeast Pickup</h3>
            <p className="text-sm text-gray-500 mb-2">Regional pickup points</p>
            <p className="text-sm font-medium text-gray-600">$22.50 delivery fee</p>
            
            {!southeastAvailable && southeastAmountAway && (
              <p className="text-xs text-red-600 mt-2">
                ${southeastAmountAway.toFixed(0)} away from ${southeastMinimum} minimum
              </p>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
