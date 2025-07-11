import { Calendar } from "@medusajs/ui"
import { useState } from "react"
import { today, getLocalTimeZone, fromDate } from "@internationalized/date"

const ArriveFoodCalendar = () => {
  const [date, setDate] = useState<Date | null>(null)
  const timeZone = getLocalTimeZone()

  const allowedWeekdays = [3, 4, 5] // Wed = 3, Thu = 4, Fri = 5

  const isDateUnavailable = (date: Date) => {
    const convertedDate = fromDate(date, timeZone)
    const weekday = convertedDate.toDate().getDay()
    return !allowedWeekdays.includes(weekday)
  }

  return (
    <Calendar
      value={date}
      onChange={setDate}
      aria-label="Calendar"
      minValue={today(timeZone).toDate(timeZone)}
      isDateUnavailable={isDateUnavailable}
    />
  )
}

export default ArriveFoodCalendar
