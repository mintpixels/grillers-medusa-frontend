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
  isSubmitting?: boolean
}

export default function PlantPickupScheduling({
  config,
  selectedDate,
  onDateChange,
  onConfirm,
  onBack,
  isSubmitting = false,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-Gold hover:text-Gold/80 font-medium flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Back
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-Charcoal mb-0.5">
          Select a Pickup Date
        </h2>
        <p className="text-sm text-Charcoal/60 mb-4">
          Choose an available date for plant pickup.
        </p>
      </div>

      {config.PlantPickupAddress && (
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold text-Charcoal/35 uppercase tracking-[0.12em] mb-1">
            Pickup Location
          </p>
          <p className="text-sm text-Charcoal font-semibold">
            {config.PlantPickupAddress}
          </p>
          <p className="text-sm text-Charcoal/60">
            {config.PlantPickupCity}, {config.PlantPickupState} {config.PlantPickupZip}
          </p>
          {config.PlantPickupHours && (
            <p className="text-xs text-Charcoal/45 mt-1.5">
              Hours: {config.PlantPickupHours}
            </p>
          )}
        </div>
      )}

      {availableDates.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-sm text-amber-800">
          No pickup dates are currently available. Please check back later or choose a different fulfillment method.
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
          {availableDates.map((date) => {
            const formatted = formatPickupDate(date)
            const isSelected = formatted === selectedDate
            return (
              <button
                key={formatted}
                type="button"
                onClick={() => handleSelect(date)}
                className={`
                  w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? "border-Gold bg-Gold/5 shadow-sm ring-1 ring-Gold/20"
                    : "border-gray-200 bg-white hover:border-Gold/40 hover:shadow-sm"
                  }
                `}
              >
                <span className={`text-sm font-semibold ${isSelected ? "text-Charcoal" : "text-Charcoal/75"}`}>
                  {formatPickupDateDisplay(date)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {config.PlantPickupPostOrderNote && (
        <div className="bg-Gold/5 border border-Gold/15 rounded-xl p-3.5">
          <p className="text-xs text-Charcoal/60 leading-relaxed">
            {config.PlantPickupPostOrderNote}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={!selectedDate || isSubmitting}
        className={`
          w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
          ${selectedDate && !isSubmitting
            ? "bg-Gold text-white hover:bg-Gold/90 shadow-md hover:shadow-lg active:scale-[0.99]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Confirming...
          </span>
        ) : (
          "Confirm Pickup Date"
        )}
      </button>
    </div>
  )
}
