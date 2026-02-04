"use client"

import { useState, useMemo } from "react"
import { Calendar } from "@medusajs/ui"
import { today, getLocalTimeZone } from "@internationalized/date"
import type { FulfillmentConfigData } from "@lib/data/strapi/checkout"

type PlantPickupSchedulingProps = {
  config: FulfillmentConfigData["checkout"] | null
  selectedDate: string
  onDateChange: (date: string) => void
}

const timeZone = getLocalTimeZone()

export default function PlantPickupScheduling({
  config,
  selectedDate,
  onDateChange,
}: PlantPickupSchedulingProps) {
  const minDate = today(timeZone).toDate(timeZone)

  // Convert selectedDate to Date object for Calendar
  const dateValue = useMemo(() => {
    if (!selectedDate) return null
    const [m, d, y] = selectedDate.split("/").map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDate])

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Format as MM/DD/YYYY for consistency with existing code
      const usaDate = date.toLocaleDateString("en-US")
      onDateChange(usaDate)
    }
  }

  // Disable weekends for plant pickup (assuming M-F operation)
  const isDateUnavailable = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Schedule Plant Pickup</h2>
      <p className="text-gray-600 mb-4">
        Select a date to pick up your order from our plant.
      </p>

      {config && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">Pickup Location</h3>
          <p className="text-sm text-gray-600">
            {config.PlantPickupAddress}
            <br />
            {config.PlantPickupCity}, {config.PlantPickupState} {config.PlantPickupZip}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Hours:</span> {config.PlantPickupHours}
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <Calendar
          value={dateValue}
          onChange={handleDateChange}
          aria-label="Select pickup date"
          minValue={minDate}
          isDateUnavailable={isDateUnavailable}
        />
      </div>

      {selectedDate && (
        <div className="mt-4 p-3 bg-Gold/10 border border-Gold/30 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Selected date:</span> {selectedDate}
          </p>
        </div>
      )}
    </div>
  )
}
