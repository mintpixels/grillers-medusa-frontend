import { Calendar } from "@medusajs/ui"
import { useState, useEffect, useCallback, useMemo } from "react"
import { today, getLocalTimeZone, fromDate } from "@internationalized/date"
import type { StoreCart } from "@medusajs/types"
import useSWR from "swr"
import strapiClient from "@lib/strapi"
import { setRequestedDeliveryDate } from "@lib/data/cart"
import Spinner from "@modules/common/icons/spinner"

import { CheckoutShippingBlackoutQuery } from "@lib/data/strapi/checkout"
import type { CheckoutShippingBlackoutData } from "@lib/data/strapi/checkout"

const timeZone = getLocalTimeZone()
const MIN_DATE = today(timeZone).toDate(timeZone)

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

type Checkout = CheckoutShippingBlackoutData["checkout"]

const fetcher = async (): Promise<Checkout | null> => {
  try {
    const res = await strapiClient.request<CheckoutShippingBlackoutData>(
      CheckoutShippingBlackoutQuery
    )
    return res.checkout
  } catch {
    return null
  }
}

export default function ArriveFoodCalendar({
  cart,
  setError,
}: {
  cart: StoreCart
  setError: (error: string | null) => void
}) {
  const [dateValue, setDateValue] = useState<Date | null>(null)

  // 1️⃣ Load existing selection from metadata (MM/DD/YYYY)
  useEffect(() => {
    const md = cart?.metadata?.requestedDeliveryDate as string | undefined

    if (md) {
      const [m, d, y] = md.split("/").map(Number)
      setDateValue(new Date(y, m - 1, d))
    }
  }, [cart?.metadata?.requestedDeliveryDate])

  // 2️⃣ Fetch blackout rules
  const { data: checkout, isLoading } = useSWR<Checkout | null>(
    "checkout",
    fetcher
  )

  // 3️⃣ Compute blocked weekdays & dates
  const blockedWeekdays = useMemo(
    () =>
      checkout?.ShippingBlackoutDaysOfWeek.map((d) =>
        WEEKDAY_NAMES.indexOf(d)
      ) ?? [],
    [checkout]
  )
  const blockedDates = useMemo(
    () =>
      new Set(checkout?.ShippingBlackoutDates.map((d) => d.BlackoutDate) ?? []),
    [checkout]
  )

  // 4️⃣ Disable any blocked day or date
  const isDateUnavailable = useCallback(
    (d: Date) => {
      const wd = fromDate(d, timeZone).toDate().getDay()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const iso = `${yyyy}-${mm}-${dd}`
      return blockedDates.has(iso) || blockedWeekdays.includes(wd)
    },
    [blockedWeekdays, blockedDates]
  )

  // 5️⃣ Persist the user’s selection
  const handleChange = useCallback(
    (d: Date | null) => {
      setError(null)
      setDateValue(d)
      if (!d) return
      const usaDate = d.toLocaleDateString("en-US")
      setRequestedDeliveryDate({ cartId: cart.id, date: usaDate }).catch(
        (err) => setError(err.message)
      )
    },
    [cart.id, setError]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-8">
        <Spinner size={36} />
      </div>
    )
  }

  return (
    <Calendar
      value={dateValue}
      onChange={handleChange}
      aria-label="Select your desired delivery date"
      minValue={MIN_DATE}
      isDateUnavailable={isDateUnavailable}
    />
  )
}
