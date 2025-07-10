import { Calendar } from "@medusajs/ui"
import { useState } from "react"
import { useLocale } from "react-aria"
import {
  today,
  getLocalTimeZone,
  isWeekend,
  fromDate,
} from "@internationalized/date"

const ArriveFoodCalendar = () => {
  const [date, setDate] = useState<Date | null>()
  const timeZone = getLocalTimeZone()

  let now = today(timeZone)

  let disabledRanges = [
    [now, now.add({ days: 1 })],
    [now.add({ days: 14 }), now.add({ days: 16 })],
    [now.add({ days: 23 }), now.add({ days: 24 })],
  ]

  let { locale } = useLocale()
  let isDateUnavailable = (date: Date) => {
    const convertedDate = fromDate(date, timeZone)
    return (
      isWeekend(convertedDate, locale) ||
      disabledRanges.some(
        (interval) =>
          convertedDate.compare(interval[0]) >= 0 &&
          convertedDate.compare(interval[1]) <= 0
      )
    )
  }

  return (
    <Calendar
      value={date}
      onChange={setDate}
      aria-label="Foods arrive date"
      minValue={today(getLocalTimeZone()).toDate(timeZone)}
      isDateUnavailable={isDateUnavailable}
    />
  )
}

export default ArriveFoodCalendar
