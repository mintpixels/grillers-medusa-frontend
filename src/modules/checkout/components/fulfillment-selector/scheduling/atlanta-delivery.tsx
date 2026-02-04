"use client"

import { useMemo } from "react"
import { Calendar, clx } from "@medusajs/ui"
import { today, getLocalTimeZone } from "@internationalized/date"
import type { FulfillmentConfigData } from "@lib/data/strapi/checkout"

type AtlantaDeliverySchedulingProps = {
  config: FulfillmentConfigData["checkout"] | null
  selectedDate: string
  selectedTimeWindow: string
  onDateChange: (date: string) => void
  onTimeWindowChange: (timeWindow: string) => void
}

const timeZone = getLocalTimeZone()

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
}: AtlantaDeliverySchedulingProps) {
  const minDate = today(timeZone).toDate(timeZone)

  const timeWindows = config?.AtlantaDeliveryTimeWindows?.length
    ? config.AtlantaDeliveryTimeWindows
    : defaultTimeWindows

  // Convert selectedDate to Date object for Calendar
  const dateValue = useMemo(() => {
    if (!selectedDate) return null
    const [m, d, y] = selectedDate.split("/").map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDate])

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const usaDate = date.toLocaleDateString("en-US")
      onDateChange(usaDate)
    }
  }

  // Disable weekends for Atlanta delivery
  const isDateUnavailable = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Schedule Atlanta Delivery</h2>
      <p className="text-gray-600 mb-6">
        Select a date and time window for your delivery.
      </p>

      {/* Date Selection */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Select Date</h3>
        <div className="flex justify-center">
          <Calendar
            value={dateValue}
            onChange={handleDateChange}
            aria-label="Select delivery date"
            minValue={minDate}
            isDateUnavailable={isDateUnavailable}
          />
        </div>
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
