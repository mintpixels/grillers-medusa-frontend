"use client"

import { useMemo } from "react"
import { clx } from "@medusajs/ui"
import type { FulfillmentConfigData, SoutheastPickupLocation } from "@lib/data/strapi/checkout"

type SoutheastPickupSchedulingProps = {
  config: FulfillmentConfigData["checkout"] | null
  selectedDate: string
  selectedLocationId: string
  onDateChange: (date: string) => void
  onLocationChange: (locationId: string) => void
}

export default function SoutheastPickupScheduling({
  config,
  selectedDate,
  selectedLocationId,
  onDateChange,
  onLocationChange,
}: SoutheastPickupSchedulingProps) {
  const locations = config?.SoutheastPickupLocations || []

  // Get available dates for selected location
  const availableDates = useMemo(() => {
    if (!selectedLocationId) return []
    const location = locations.find((l) => l.id === selectedLocationId)
    if (!location?.AvailableDates) return []

    // Filter to future dates only
    const now = new Date()
    return location.AvailableDates.filter((d) => {
      const date = new Date(d.Date)
      return date >= now
    }).map((d) => d.Date)
  }, [selectedLocationId, locations])

  const selectedLocation = locations.find((l) => l.id === selectedLocationId)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Pickup Location</h2>
      <p className="text-gray-600 mb-6">
        Select a pickup location and available date near you.
      </p>

      {/* Location Selection */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Pickup Location</h3>
        {locations.length === 0 ? (
          <p className="text-gray-600">No pickup locations available.</p>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  onLocationChange(location.id)
                  onDateChange("") // Reset date when location changes
                }}
                className={clx(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  {
                    "border-Gold bg-Gold/5": selectedLocationId === location.id,
                    "border-gray-200 hover:border-gray-300":
                      selectedLocationId !== location.id,
                  }
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{location.Name}</h4>
                    <p className="text-sm text-gray-600">
                      {location.Address}
                      <br />
                      {location.City}, {location.State} {location.ZipCode}
                    </p>
                    {location.AvailableDates?.length > 0 && (
                      <p className="text-sm text-Gold mt-1">
                        {location.AvailableDates.length} dates available
                      </p>
                    )}
                  </div>
                  <div
                    className={clx(
                      "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                      {
                        "border-Gold": selectedLocationId === location.id,
                        "border-gray-300": selectedLocationId !== location.id,
                      }
                    )}
                  >
                    {selectedLocationId === location.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-Gold" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Selection - shows after location is selected */}
      {selectedLocationId && (
        <div>
          <h3 className="font-medium mb-3">Available Pickup Dates</h3>
          {availableDates.length === 0 ? (
            <p className="text-gray-600">
              No dates currently available for this location.
            </p>
          ) : (
            <div className="space-y-2">
              {availableDates.map((dateStr) => (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    // Convert to MM/DD/YYYY format
                    const date = new Date(dateStr)
                    onDateChange(date.toLocaleDateString("en-US"))
                  }}
                  className={clx(
                    "w-full p-3 rounded-lg border-2 transition-all text-left",
                    {
                      "border-Gold bg-Gold/5":
                        selectedDate === new Date(dateStr).toLocaleDateString("en-US"),
                      "border-gray-200 hover:border-gray-300":
                        selectedDate !== new Date(dateStr).toLocaleDateString("en-US"),
                    }
                  )}
                >
                  <span className="font-medium">{formatDate(dateStr)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedLocation && selectedDate && (
        <div className="mt-4 p-3 bg-Gold/10 border border-Gold/30 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Pickup at:</span> {selectedLocation.Name}
            <br />
            <span className="font-medium">Date:</span> {selectedDate}
          </p>
        </div>
      )}
    </div>
  )
}
