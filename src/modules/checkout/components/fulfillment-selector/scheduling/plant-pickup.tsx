"use client"

import { useMemo, useState } from "react"
import {
  getAvailablePickupDates,
  formatPickupDate,
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

type WeekGroup = {
  label: string
  weekKey: string
  dates: Date[]
}

const INITIAL_WEEKS_SHOWN = 3

function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function weekKey(date: Date): string {
  const mon = getMonday(date)
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`
}

function getWeekLabel(mondayOfWeek: Date, today: Date): string {
  const todayMonday = getMonday(today)

  const diffMs = mondayOfWeek.getTime() - todayMonday.getTime()
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))

  if (diffWeeks === 0) return "This Week"
  if (diffWeeks === 1) return "Next Week"

  return `Week of ${mondayOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
}

function formatDayButton(date: Date): { dayName: string; monthDay: string } {
  return {
    dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
    monthDay: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }
}

export default function PlantPickupScheduling({
  config,
  selectedDate,
  onDateChange,
  onConfirm,
  onBack,
  isSubmitting = false,
}: PlantPickupSchedulingProps) {
  const [showAll, setShowAll] = useState(false)

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

  const weekGroups = useMemo((): WeekGroup[] => {
    if (availableDates.length === 0) return []

    const today = new Date()
    const groups = new Map<string, { monday: Date; dates: Date[] }>()

    for (const date of availableDates) {
      const key = weekKey(date)
      if (!groups.has(key)) {
        groups.set(key, { monday: getMonday(date), dates: [] })
      }
      groups.get(key)!.dates.push(date)
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { monday, dates }]) => ({
        label: getWeekLabel(monday, today),
        weekKey: key,
        dates: dates.sort((a, b) => a.getTime() - b.getTime()),
      }))
  }, [availableDates])

  const visibleGroups = showAll ? weekGroups : weekGroups.slice(0, INITIAL_WEEKS_SHOWN)
  const hiddenCount = weekGroups.length - INITIAL_WEEKS_SHOWN
  const hiddenDateCount = weekGroups.slice(INITIAL_WEEKS_SHOWN).reduce((sum, g) => sum + g.dates.length, 0)

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
        <p className="text-sm text-Charcoal/60">
          Available for pickup on {(config.PlantPickupAvailableDays ?? ["Tuesday", "Wednesday"]).join(" & ")}s.
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

      {weekGroups.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-sm text-amber-800">
          No pickup dates are currently available. Please check back later or choose a different fulfillment method.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((group, groupIdx) => (
            <div key={group.weekKey}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-Charcoal/40 uppercase tracking-[0.12em]">
                  {group.label}
                </p>
                <div className="flex-1 h-px bg-Charcoal/[0.06]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {group.dates.map((date) => {
                  const formatted = formatPickupDate(date)
                  const isSelected = formatted === selectedDate
                  const { dayName, monthDay } = formatDayButton(date)
                  const isThisWeek = groupIdx === 0 && group.label === "This Week"

                  return (
                    <button
                      key={formatted}
                      type="button"
                      onClick={() => handleSelect(date)}
                      className={`
                        relative text-left px-4 py-3 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? "border-Gold bg-Gold/5 shadow-sm ring-1 ring-Gold/20"
                          : "border-gray-200 bg-white hover:border-Gold/40 hover:shadow-sm"
                        }
                      `}
                    >
                      {isThisWeek && !isSelected && (
                        <span className="absolute top-1.5 right-2 text-[9px] font-bold text-Gold/70 uppercase tracking-wider">
                          Soon
                        </span>
                      )}
                      <span className={`block text-[13px] font-bold tracking-tight ${isSelected ? "text-Charcoal" : "text-Charcoal/80"}`}>
                        {dayName}
                      </span>
                      <span className={`block text-sm mt-0.5 ${isSelected ? "text-Gold font-semibold" : "text-Charcoal/55"}`}>
                        {monthDay}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full py-2.5 text-sm font-semibold text-Gold hover:text-Gold/80 transition-colors flex items-center justify-center gap-1.5"
            >
              Show {hiddenCount} more week{hiddenCount !== 1 ? "s" : ""}
              <span className="text-Charcoal/30 font-normal">
                ({hiddenDateCount} date{hiddenDateCount !== 1 ? "s" : ""})
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {showAll && weekGroups.length > INITIAL_WEEKS_SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="w-full py-2.5 text-sm font-semibold text-Charcoal/40 hover:text-Charcoal/60 transition-colors flex items-center justify-center gap-1.5"
            >
              Show fewer weeks
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
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
