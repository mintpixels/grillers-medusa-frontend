"use client"

import { useMemo } from "react"

export type SoutheastPickupCity = {
  id: string
  City: string
  State: string
  Address?: string
  ZipCode?: string
  IsActive?: boolean
  AvailableDates: { Date: string }[]
  CutoffDays?: number
  Description?: string
}

type SoutheastPickupSchedulingProps = {
  locations: SoutheastPickupCity[]
  selectedLocationId: string
  selectedDate: string
  onLocationChange: (locationId: string) => void
  onDateChange: (date: string) => void
  onConfirm: () => void
  onBack: () => void
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateForCart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${m}/${d}/${y}`
}

export default function SoutheastPickupScheduling({
  locations,
  selectedLocationId,
  selectedDate,
  onLocationChange,
  onDateChange,
  onConfirm,
  onBack,
}: SoutheastPickupSchedulingProps) {
  const activeLocations = useMemo(
    () => locations.filter((l) => l.IsActive !== false),
    [locations]
  )

  const groupedByState = useMemo(() => {
    const groups: Record<string, SoutheastPickupCity[]> = {}
    for (const loc of activeLocations) {
      if (!groups[loc.State]) groups[loc.State] = []
      groups[loc.State].push(loc)
    }
    for (const state of Object.keys(groups)) {
      groups[state].sort((a, b) => a.City.localeCompare(b.City))
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [activeLocations])

  const selectedLocation = activeLocations.find((l) => l.id === selectedLocationId)

  const availableDates = useMemo(() => {
    if (!selectedLocation?.AvailableDates?.length) return []
    const now = new Date()
    const cutoffDays = selectedLocation.CutoffDays ?? 3
    const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000

    return selectedLocation.AvailableDates.filter((d) => {
      const [y, m, day] = d.Date.split("-").map(Number)
      const date = new Date(y, m - 1, day)
      return date.getTime() - now.getTime() >= cutoffMs
    })
      .map((d) => d.Date)
      .sort()
  }, [selectedLocation])

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

      {/* Step 1: Select City */}
      <h2 className="text-lg font-semibold text-Charcoal mb-1">
        {selectedLocationId ? "Change Pickup City" : "Select a Pickup City"}
      </h2>
      <p className="text-sm text-Charcoal/70 mb-4">
        Choose a city near you. All locations are $20 flat rate.
      </p>

      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {groupedByState.map(([state, cities]) => (
          <div key={state}>
            <p className="text-xs font-semibold text-Charcoal/50 uppercase tracking-wider mb-1.5">
              {state}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cities.map((loc) => {
                const isSelected = selectedLocationId === loc.id
                const dateCount = loc.AvailableDates?.length ?? 0
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onLocationChange(loc.id)
                      onDateChange("")
                    }}
                    className={`
                      text-left px-3 py-2.5 rounded-lg border-2 transition-all
                      ${isSelected
                        ? "border-Gold bg-Gold/10 shadow-sm"
                        : "border-gray-200 bg-white hover:border-Gold/50"
                      }
                    `}
                  >
                    <span className={`text-sm font-medium ${isSelected ? "text-Charcoal" : "text-Charcoal/80"}`}>
                      {loc.City}
                    </span>
                    {dateCount > 0 && (
                      <span className="block text-xs text-Charcoal/50 mt-0.5">
                        {dateCount} date{dateCount !== 1 ? "s" : ""} available
                      </span>
                    )}
                    {dateCount === 0 && (
                      <span className="block text-xs text-amber-600 mt-0.5">
                        No dates yet
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Step 2: Select Date (after city chosen) */}
      {selectedLocation && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-Charcoal mb-2">
            Pickup Dates in {selectedLocation.City}, {selectedLocation.State}
          </h3>

          {selectedLocation.Address && (
            <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
              <p className="text-xs font-medium text-Charcoal/50 uppercase tracking-wider mb-1">
                Pickup Location
              </p>
              <p className="text-sm text-Charcoal font-medium">{selectedLocation.Address}</p>
              <p className="text-sm text-Charcoal/70">
                {selectedLocation.City}, {selectedLocation.State} {selectedLocation.ZipCode}
              </p>
            </div>
          )}

          {availableDates.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              No pickup dates are currently scheduled for {selectedLocation.City}. Please check back later or choose a different city.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {availableDates.map((dateStr) => {
                const cartDate = formatDateForCart(dateStr)
                const isSelected = cartDate === selectedDate
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onDateChange(cartDate)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? "border-Gold bg-Gold/10 shadow-sm"
                        : "border-gray-200 bg-white hover:border-Gold/50"
                      }
                    `}
                  >
                    <span className={`text-sm font-medium ${isSelected ? "text-Charcoal" : "text-Charcoal/80"}`}>
                      {formatDateDisplay(dateStr)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={!selectedLocationId || !selectedDate}
        className={`
          mt-4 w-full py-3 rounded-lg font-medium text-sm transition-all
          ${selectedLocationId && selectedDate
            ? "bg-Gold text-white hover:bg-Gold/90 shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        Confirm Pickup
      </button>
    </div>
  )
}
