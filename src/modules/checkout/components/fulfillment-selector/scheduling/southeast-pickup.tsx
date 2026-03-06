"use client"

import { useMemo, useRef, useEffect } from "react"

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
  isSubmitting?: boolean
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  FL: "Florida",
  GA: "Georgia",
  NC: "North Carolina",
  SC: "South Carolina",
  TN: "Tennessee",
  TX: "Texas",
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

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function getValidDates(location: SoutheastPickupCity): string[] {
  if (!location.AvailableDates?.length) return []
  const now = new Date()
  const cutoffDays = location.CutoffDays ?? 3
  const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000

  return location.AvailableDates.filter((d) => {
    const [y, m, day] = d.Date.split("-").map(Number)
    const date = new Date(y, m - 1, day)
    return date.getTime() - now.getTime() >= cutoffMs
  })
    .map((d) => d.Date)
    .sort()
}

export default function SoutheastPickupScheduling({
  locations,
  selectedLocationId,
  selectedDate,
  onLocationChange,
  onDateChange,
  onConfirm,
  onBack,
  isSubmitting = false,
}: SoutheastPickupSchedulingProps) {
  const datesSectionRef = useRef<HTMLDivElement>(null)

  const activeLocations = useMemo(
    () => locations.filter((l) => l.IsActive !== false),
    [locations]
  )

  const locationDateInfo = useMemo(() => {
    const info: Record<string, { count: number; dates: string[] }> = {}
    for (const loc of activeLocations) {
      const valid = getValidDates(loc)
      info[loc.id] = { count: valid.length, dates: valid }
    }
    return info
  }, [activeLocations])

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
    if (!selectedLocation) return []
    return getValidDates(selectedLocation)
  }, [selectedLocation])

  useEffect(() => {
    if (selectedLocationId && datesSectionRef.current) {
      datesSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [selectedLocationId])

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
          {selectedLocationId ? "Change Pickup City" : "Select a Pickup City"}
        </h2>
        <p className="text-sm text-Charcoal/60 mb-4">
          Choose a city near you for scheduled pickup.
        </p>
      </div>

      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
        {groupedByState.map(([state, cities]) => (
          <div key={state}>
            <p className="text-[11px] font-bold text-Charcoal/40 uppercase tracking-[0.15em] mb-2">
              {STATE_NAMES[state] || state}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cities.map((loc) => {
                const isSelected = selectedLocationId === loc.id
                const info = locationDateInfo[loc.id] ?? { count: 0, dates: [] }
                const hasNoDates = info.count === 0
                return (
                  <div key={loc.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        if (hasNoDates) return
                        onLocationChange(loc.id)
                        onDateChange("")
                      }}
                      disabled={hasNoDates}
                      className={`
                        w-full text-left px-3.5 py-3 rounded-xl border-2 transition-all duration-200
                        ${hasNoDates
                          ? "border-gray-100 bg-gray-50/50 cursor-not-allowed"
                          : isSelected
                            ? "border-Gold bg-Gold/5 shadow-sm ring-1 ring-Gold/20"
                            : "border-gray-200 bg-white hover:border-Gold/40 hover:shadow-sm"
                        }
                      `}
                    >
                      <span className={`text-sm font-semibold block ${
                        hasNoDates ? "text-Charcoal/30" : isSelected ? "text-Charcoal" : "text-Charcoal/80"
                      }`}>
                        {loc.City}
                      </span>
                      {info.count > 0 ? (
                        <span className={`block text-xs mt-0.5 ${isSelected ? "text-Gold font-medium" : "text-Charcoal/45"}`}>
                          {info.count} date{info.count !== 1 ? "s" : ""} available
                        </span>
                      ) : (
                        <span className="block text-xs text-Charcoal/25 mt-0.5">
                          No dates scheduled
                        </span>
                      )}
                    </button>

                    {info.count > 0 && !isSelected && (
                      <div className="
                        pointer-events-none absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2
                        opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                        transition-all duration-150 ease-out
                      ">
                        <div className="bg-Charcoal text-white rounded-lg px-3 py-2.5 shadow-lg min-w-[140px]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                            Upcoming Dates
                          </p>
                          {info.dates.slice(0, 4).map((d) => (
                            <p key={d} className="text-xs font-medium leading-relaxed text-white/90">
                              {formatDateShort(d)}
                            </p>
                          ))}
                          {info.dates.length > 4 && (
                            <p className="text-[10px] text-white/40 mt-1">
                              +{info.dates.length - 4} more
                            </p>
                          )}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-Charcoal rotate-45" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        ref={datesSectionRef}
        className={`transition-all duration-300 ease-out overflow-hidden ${
          selectedLocation ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {selectedLocation && (
          <div className="pt-2">
            <div className="h-px bg-gradient-to-r from-transparent via-Charcoal/10 to-transparent mb-4" />

            <h3 className="text-sm font-semibold text-Charcoal mb-2">
              Pickup Date — {selectedLocation.City}, {selectedLocation.State}
            </h3>

            {selectedLocation.Address && (
              <div className="bg-white rounded-xl p-3.5 mb-3 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-Charcoal/35 uppercase tracking-[0.12em] mb-1">
                  Pickup Location
                </p>
                <p className="text-sm text-Charcoal font-semibold">{selectedLocation.Address}</p>
                <p className="text-sm text-Charcoal/60">
                  {selectedLocation.City}, {selectedLocation.State} {selectedLocation.ZipCode}
                </p>
              </div>
            )}

            {availableDates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-sm text-amber-800">
                No pickup dates are currently scheduled for {selectedLocation.City}. Please check back later or choose a different city.
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {availableDates.map((dateStr) => {
                  const cartDate = formatDateForCart(dateStr)
                  const isSelected = cartDate === selectedDate
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => onDateChange(cartDate)}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? "border-Gold bg-Gold/5 shadow-sm ring-1 ring-Gold/20"
                          : "border-gray-200 bg-white hover:border-Gold/40 hover:shadow-sm"
                        }
                      `}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? "text-Charcoal" : "text-Charcoal/75"}`}>
                        {formatDateDisplay(dateStr)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!selectedLocationId || !selectedDate || isSubmitting}
        className={`
          w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
          ${selectedLocationId && selectedDate && !isSubmitting
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
          "Confirm Pickup"
        )}
      </button>
    </div>
  )
}
