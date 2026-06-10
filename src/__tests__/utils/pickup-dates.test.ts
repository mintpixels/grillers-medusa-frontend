/**
 * @jest-environment jsdom
 */

import {
  formatPickupDate,
  getAvailablePickupDates,
} from "@lib/util/pickup-dates"

const baseConfig = {
  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  additionalDates: [],
  blackoutDates: [],
  cutoffHours: 0,
  lookAheadWeeks: 1,
}

describe("plant pickup date eligibility", () => {
  it("allows same-day Monday-Thursday pickup before 11am ET", () => {
    const dates = getAvailablePickupDates({
      ...baseConfig,
      now: new Date(2026, 5, 8, 10, 59), // Monday Jun 8 2026
    })

    expect(dates.map(formatPickupDate)).toContain("6/8/2026")
  })

  it("removes same-day Monday-Thursday pickup after 11am ET", () => {
    const dates = getAvailablePickupDates({
      ...baseConfig,
      now: new Date(2026, 5, 8, 11, 1), // Monday Jun 8 2026
    })

    expect(dates.map(formatPickupDate)).not.toContain("6/8/2026")
    expect(dates.map(formatPickupDate)).toContain("6/9/2026")
  })

  it("allows same-day Friday pickup before 9am ET", () => {
    const dates = getAvailablePickupDates({
      ...baseConfig,
      now: new Date(2026, 5, 12, 8, 59), // Friday Jun 12 2026
    })

    expect(dates.map(formatPickupDate)).toContain("6/12/2026")
  })

  it("removes same-day Friday pickup after 9am ET", () => {
    const dates = getAvailablePickupDates({
      ...baseConfig,
      now: new Date(2026, 5, 12, 9, 1), // Friday Jun 12 2026
    })

    expect(dates.map(formatPickupDate)).not.toContain("6/12/2026")
    expect(dates.map(formatPickupDate)).toContain("6/15/2026")
  })

  it("honors plant blackout dates", () => {
    const dates = getAvailablePickupDates({
      ...baseConfig,
      blackoutDates: ["2026-06-09"],
      now: new Date(2026, 5, 8, 11, 1),
    })

    expect(dates.map(formatPickupDate)).not.toContain("6/9/2026")
  })
})
