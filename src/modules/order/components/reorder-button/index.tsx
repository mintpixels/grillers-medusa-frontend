"use client"

import { useState } from "react"
import { addMultipleToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"

type ReorderItem = {
  variant_id?: string | null
  quantity: number
}

export default function ReorderButton({
  items,
  className,
}: {
  items: ReorderItem[]
  className?: string
}) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const { countryCode } = useParams() as { countryCode: string }

  const validItems = items.filter((i) => i.variant_id)

  const handleReorder = async () => {
    if (validItems.length === 0) return
    setState("loading")
    try {
      const result = await addMultipleToCart(
        validItems.map((i) => ({
          variantId: i.variant_id!,
          quantity: i.quantity,
          countryCode,
        }))
      )
      if (result.added > 0) {
        setState("success")
        setTimeout(() => setState("idle"), 3000)
      } else {
        setState("error")
        setTimeout(() => setState("idle"), 3000)
      }
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  if (validItems.length === 0) return null

  return (
    <button
      onClick={handleReorder}
      disabled={state === "loading"}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-rexton font-bold uppercase tracking-wide rounded-[5px] border transition-all duration-200 ${
        state === "success"
          ? "bg-green-50 border-green-300 text-green-700"
          : state === "error"
          ? "bg-red-50 border-red-300 text-red-700"
          : "bg-Gold border-Charcoal text-Charcoal hover:bg-Gold/90"
      } disabled:opacity-50 ${className || ""}`}
    >
      {state === "loading" ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Adding...
        </>
      ) : state === "success" ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Added to Cart!
        </>
      ) : state === "error" ? (
        "Failed to add"
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652" />
          </svg>
          Reorder All
        </>
      )}
    </button>
  )
}
