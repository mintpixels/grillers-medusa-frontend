const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

type PickupDateConfig = {
  availableDays: string[]
  additionalDates: string[]
  blackoutDates: string[]
  cutoffHours: number
  lookAheadWeeks?: number
}

/**
 * Formats a Date to YYYY-MM-DD for consistent comparison.
 */
function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Returns the current time in America/New_York (Eastern) as a Date-like object.
 */
function nowEST(): Date {
  const now = new Date()
  const estStr = now.toLocaleString("en-US", { timeZone: "America/New_York" })
  return new Date(estStr)
}

/**
 * Determines whether a given pickup date is still within the ordering window
 * based on the cutoff hours before 12:01 AM EST of the pickup day.
 *
 * cutoffHours = 0  -> accept orders up to midnight EST of the day before
 * cutoffHours = 6  -> cutoff at 6:00 PM EST the day before
 * cutoffHours = 24 -> cutoff at midnight EST two days before
 */
function isBeforeCutoff(pickupDate: Date, cutoffHours: number): boolean {
  const deadlineMs =
    new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate(),
      0, 1, 0 // 12:01 AM of pickup day
    ).getTime() - cutoffHours * 60 * 60 * 1000

  return nowEST().getTime() < deadlineMs
}

/**
 * Computes the set of available plant pickup dates based on Strapi config.
 *
 * 1. Generates dates for the next N weeks that fall on availableDays
 * 2. Merges in any additionalDates that are in the future
 * 3. Removes blackoutDates
 * 4. Removes dates past the cutoff window
 *
 * Returns sorted array of Date objects.
 */
export function getAvailablePickupDates(config: PickupDateConfig): Date[] {
  const { availableDays, additionalDates, blackoutDates, cutoffHours, lookAheadWeeks = 6 } = config

  const dayIndices = new Set(
    availableDays
      .map((d) => DAY_NAMES.indexOf(d as (typeof DAY_NAMES)[number]))
      .filter((i) => i >= 0)
  )

  const blackoutSet = new Set(blackoutDates.map((d) => d.split("T")[0]))

  const est = nowEST()
  const today = new Date(est.getFullYear(), est.getMonth(), est.getDate())
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + lookAheadWeeks * 7)

  const dateMap = new Map<string, Date>()

  // Generate recurring dates from availableDays
  const cursor = new Date(today)
  while (cursor <= endDate) {
    if (dayIndices.has(cursor.getDay())) {
      const key = toDateKey(cursor)
      dateMap.set(key, new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  // Merge additional dates
  for (const raw of additionalDates) {
    const iso = raw.split("T")[0]
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    if (date >= today && date <= endDate) {
      dateMap.set(iso, date)
    }
  }

  // Remove blackout dates
  for (const key of blackoutSet) {
    dateMap.delete(key)
  }

  // Filter by cutoff and sort
  return Array.from(dateMap.values())
    .filter((d) => isBeforeCutoff(d, cutoffHours))
    .sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Returns a Set of YYYY-MM-DD strings for quick lookup in the calendar's
 * isDateUnavailable callback.
 */
export function getAvailablePickupDateSet(config: PickupDateConfig): Set<string> {
  return new Set(getAvailablePickupDates(config).map(toDateKey))
}

/**
 * Formats a Date to the MM/DD/YYYY string used by cart metadata.
 */
export function formatPickupDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

/**
 * Formats a Date to a human-readable string for display.
 */
export function formatPickupDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
