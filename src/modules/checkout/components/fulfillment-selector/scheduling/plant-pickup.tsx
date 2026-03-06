"use client"

import { useMemo } from "react"
import {
  getAvailablePickupDates,
  formatPickupDate,
  formatPickupDateDisplay,
} from "@lib/util/pickup-dates"
import type { FulfillmentConfigData } from "@lib/data/strapi/checkout"

type PlantPickupSchedulingProps = {
  config: FulfillmentConfigData["checkout"]
  selectedDate: string
  onDateChange: (date: string) => void
  onConfirm: () => void
  onBack: () => void
}

export default function PlantPickupScheduling({
  config,
  selectedDate,
  onDateChange,
  onConfirm,
  onBack,
}: PlantPickupSchedulingProps) {
  const availableDates = useMemo(
    () =>
      getAvailablePickupDates({
        availableDays: config.PlantPickupAvailableDays ?? ["Tuesday", "Wednesday"],
        additionalDates: (config.PlantPickupAdditionalDates ?? []).map((d) => d.Date),
        blackoutDates: (config.PlantPickupBlackoutDates ?? []).map((d) => d.Date),
        cutoffHours: config.PlantPickupCutoffHours ?? 0,
      }),
    [config]
  )

  const handleSelect = (date: Date) => {
    onDateChange(formatPickupDate(date))
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-Gold hover:text-Gold/80 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Back
        </button>
      </div>

      <h2 className="text-lg font-semibold text-Charcoal mb-1">
        Select a Pickup Date
      </h2>
      <p className="text-sm text-Charcoal/70 mb-4">
        Choose an available date for plant pickup.
      </p>

      {config.PlantPickupAddress && (
        <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
          <p className="text-xs font-medium text-Charcoal/50 uppercase tracking-wider mb-1">
            Pickup Location
          </p>
          <p className="text-sm text-Charcoal font-medium">
            {config.PlantPickupAddress}
          </p>
          <p className="text-sm text-Charcoal/70">
            {config.PlantPickupCity}, {config.PlantPickupState} {config.PlantPickupZip}
          </p>
          {config.PlantPickupHours && (
            <p className="text-xs text-Charcoal/50 mt-1">
              Hours: {config.PlantPickupHours}
            </p>
          )}
        </div>
      )}

      {availableDates.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          No pickup dates are currently available. Please check back later or choose a different fulfillment method.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
          {availableDates.map((date) => {
            const formatted = formatPickupDate(date)
            const isSelected = formatted === selectedDate
            return (
              <button
                key={formatted}
                type="button"
                onClick={() => handleSelect(date)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg border-2 transition-all
                  ${isSelected
                    ? "border-Gold bg-Gold/10 shadow-sm"
                    : "border-gray-200 bg-white hover:border-Gold/50"
                  }
                `}
              >
                <span className={`text-sm font-medium ${isSelected ? "text-Charcoal" : "text-Charcoal/80"}`}>
                  {formatPickupDateDisplay(date)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {config.PlantPickupPostOrderNote && (
        <div className="mt-4 bg-Gold/5 border border-Gold/20 rounded-lg p-3">
          <p className="text-xs text-Charcoal/70">
            {config.PlantPickupPostOrderNote}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={!selectedDate}
        className={`
          mt-4 w-full py-3 rounded-lg font-medium text-sm transition-all
          ${selectedDate
            ? "bg-Gold text-white hover:bg-Gold/90 shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        Confirm Pickup Date
      </button>
    </div>
  )
}
