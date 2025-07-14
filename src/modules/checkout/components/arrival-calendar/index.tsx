import { Calendar } from "@medusajs/ui"
import { useState, useEffect, useCallback } from "react"
import { today, getLocalTimeZone, fromDate } from "@internationalized/date"
import { HttpTypes } from "@medusajs/types"
import { setRequestedDeliveryDate } from "@lib/data/cart"
const ArriveFoodCalendar = ({
  cart,
  setError,
}: {
  cart: HttpTypes.StoreCart
  setError: (error: string | null) => void
}) => {
  const [dateValue, setDateValue] = useState<Date | null>(null)
  const timeZone = getLocalTimeZone()

  useEffect(() => {
    const md = cart?.metadata?.requestedDeliveryDate as string | undefined

    if (md) {
      const [m, d, y] = md.split("/").map(Number)
      setDateValue(new Date(y, m - 1, d))
    }
  }, [cart?.metadata?.requestedDeliveryDate])

  const allowedWeekdays = [3, 4, 5] // Wed = 3, Thu = 4, Fri = 5

  const isDateUnavailable = useCallback((date: Date) => {
    const convertedDate = fromDate(date, timeZone)
    const weekday = convertedDate.toDate().getDay()
    return !allowedWeekdays.includes(weekday)
  }, [])

  const handleChange = (date: Date | null) => {
    setError(null)
    setDateValue(date)

    if (date) {
      const usaDate = date.toLocaleDateString("en-US")
      setRequestedDeliveryDate({ cartId: cart!.id, date: usaDate }).catch(
        (err) => {
          setError(err.message)
        }
      )
    }
  }

  return (
    <Calendar
      value={dateValue}
      onChange={handleChange}
      aria-label="Calendar"
      minValue={today(timeZone).toDate(timeZone)}
      isDateUnavailable={isDateUnavailable}
    />
  )
}

export default ArriveFoodCalendar
