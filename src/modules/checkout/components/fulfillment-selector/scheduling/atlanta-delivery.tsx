"use client"

import { useMemo } from "react"
import { Calendar, clx } from "@medusajs/ui"
import type { FulfillmentConfigData } from "@lib/data/strapi/checkout"
import { ATLANTA_DELIVERY_ZIP_DAYS } from "@lib/data/strapi/checkout"
import {
  computeEligibleArrivalDates,
  toIsoDate,
  type AtlantaZipDayConfig,
} from "@lib/util/eligible-arrival-dates"

type AtlantaDeliverySchedulingProps = {
  config: FulfillmentConfigData["checkout"] | null
  selectedDate: string
  selectedTimeWindow: string
  onDateChange: (date: string) => void
  onTimeWindowChange: (timeWindow: string) => void
  /** Destination zip — drives the per-zip weekday + cutoff rules. */
  destinationZip?: string
  atlantaZipConfig?: Record<string, AtlantaZipDayConfig>
}

// Default time windows if none configured in Strapi
const defaultTimeWindows = [
  { id: "morning", Label: "Morning (9am - 12pm)", StartTime: "09:00", EndTime: "12:00" },
  { id: "afternoon", Label: "Afternoon (12pm - 5pm)", StartTime: "12:00", EndTime: "17:00" },
  { id: "evening", Label: "Evening (5pm - 9pm)", StartTime: "17:00", EndTime: "21:00" },
]

export default function AtlantaDeliveryScheduling({
  config,
  selectedDate,
  selectedTimeWindow,
  onDateChange,
  onTimeWindowChange,
  destinationZip,
  atlantaZipConfig = config?.AtlantaDeliveryZipDays || ATLANTA_DELIVERY_ZIP_DAYS,
}: AtlantaDeliverySchedulingProps) {
  const timeWindows = config?.AtlantaDeliveryTimeWindows?.length
    ? config.AtlantaDeliveryTimeWindows
    : defaultTimeWindows

  const eligibility = useMemo(
    () =>
      computeEligibleArrivalDates({
        method: "atlanta_delivery",
        destinationZip: (destinationZip || "").trim(),
        atlantaZipConfig,
      }),
    [destinationZip, atlantaZipConfig]
  )

  const minDate = eligibility.earliest ?? undefined

  // Convert selectedDate to Date object for Calendar
  const dateValue = useMemo(() => {
    if (!selectedDate) {
      return eligibility.earliest ?? null
    }
    const [m, d, y] = selectedDate.split("/").map(Number)
    if (!m || !d || !y) return eligibility.earliest ?? null
    const parsed = new Date(y, m - 1, d)
    return eligibility.isoSet.has(toIsoDate(parsed))
      ? parsed
      : eligibility.earliest ?? null
  }, [selectedDate, eligibility.earliest, eligibility.isoSet])

  const isDateUnavailable = (date: Date) =>
    !eligibility.isoSet.has(toIsoDate(date))

  const handleDateChange = (date: Date | null) => {
    if (date && !isDateUnavailable(date)) {
      const usaDate = date.toLocaleDateString("en-US")
      onDateChange(usaDate)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Schedule Atlanta Delivery</h2>
      <p className="text-gray-600 mb-2">
        Select a date and time window for your delivery.
      </p>
      <p className="text-xs text-gray-500 mb-6" aria-live="polite">
        {eligibility.reason}
      </p>

      {/* Date Selection */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Select Date</h3>
        {eligibility.earliest ? (
          <div className="flex justify-center">
            <Calendar
              value={dateValue}
              onChange={handleDateChange}
              aria-label="Select delivery date"
              minValue={minDate}
              isDateUnavailable={isDateUnavailable}
            />
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-lg text-sm text-amber-800">
            No upcoming delivery dates available for {destinationZip || "this zip"}.
            Please contact us to schedule.
          </div>
        )}
      </div>

      {/* Time Window Selection */}
      {selectedDate && (
        <div>
          <h3 className="font-medium mb-3">Select Time Window</h3>
          <div className="space-y-2">
            {timeWindows.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => onTimeWindowChange(window.id)}
                className={clx(
                  "w-full p-3 rounded-lg border-2 transition-all text-left",
                  {
                    "border-Gold bg-Gold/5": selectedTimeWindow === window.id,
                    "border-gray-200 hover:border-gray-300": selectedTimeWindow !== window.id,
                  }
                )}
              >
                <span className="font-medium">{window.Label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedTimeWindow && (
        <div className="mt-4 p-3 bg-Gold/10 border border-Gold/30 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Delivery:</span> {selectedDate}
            <br />
            <span className="font-medium">Time:</span>{" "}
            {timeWindows.find((w) => w.id === selectedTimeWindow)?.Label}
          </p>
        </div>
      )}
    </div>
  )
}
