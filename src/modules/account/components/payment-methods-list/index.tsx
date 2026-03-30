"use client"

import { useState } from "react"
import { SavedPaymentMethod, deleteSavedPaymentMethod } from "@lib/data/payment"
import { useRouter } from "next/navigation"

const BRAND_ICONS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
}

export default function PaymentMethodsList({
  initialMethods,
}: {
  initialMethods: SavedPaymentMethod[]
}) {
  const [methods, setMethods] = useState(initialMethods)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this payment method?")) return
    setDeletingId(id)
    const result = await deleteSavedPaymentMethod(id)
    if (result.success) {
      setMethods((prev) => prev.filter((m) => m.id !== id))
      router.refresh()
    }
    setDeletingId(null)
  }

  if (methods.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-Charcoal/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
        <p className="text-lg font-gyst font-bold text-Charcoal mb-2">No saved cards</p>
        <p className="text-sm font-maison-neue text-Charcoal/50">
          Your payment methods will be saved automatically during checkout.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const card = method.data?.card
        const brand = card?.brand || "card"
        const brandLabel = BRAND_ICONS[brand.toLowerCase()] || brand

        return (
          <div
            key={method.id}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-maison-neue font-bold text-Charcoal/60 uppercase">
                {brandLabel}
              </span>
            </div>

            <div className="flex-1">
              <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                {brandLabel} ending in {card?.last4 || "****"}
              </p>
              <p className="text-xs font-maison-neue text-Charcoal/50">
                Expires {String(card?.exp_month || 0).padStart(2, "0")}/{card?.exp_year}
              </p>
            </div>

            <button
              onClick={() => handleDelete(method.id)}
              disabled={deletingId === method.id}
              className="text-xs font-maison-neue text-Charcoal/40 hover:text-VibrantRed transition-colors disabled:opacity-50"
            >
              {deletingId === method.id ? "Removing..." : "Remove"}
            </button>
          </div>
        )
      })}
    </div>
  )
}
