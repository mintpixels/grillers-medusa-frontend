"use client"

import { useEffect, useState } from "react"
import type { PurchaseHistoryItem } from "@lib/data/orders"
import type { ReorderStrapiMap } from "@lib/data/home-personalization"

export type HomePersonalizationSnapshot = {
  isLoggedIn: boolean
  firstName: string | null
  hasOrders: boolean
  purchaseHistory: PurchaseHistoryItem[]
  strapiMap: ReorderStrapiMap
  customerZip: string | null
  customerZipSource: "cart" | "address" | "recent_order" | null
}

const emptySnapshot: HomePersonalizationSnapshot = {
  isLoggedIn: false,
  firstName: null,
  hasOrders: false,
  purchaseHistory: [],
  strapiMap: {},
  customerZip: null,
  customerZipSource: null,
}

let inFlightHomePersonalization: Promise<HomePersonalizationSnapshot> | null =
  null

async function fetchHomePersonalization() {
  if (!inFlightHomePersonalization) {
    inFlightHomePersonalization = fetch(
      "/api/storefront/home-personalization",
      {
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load home personalization")
        }

        return response.json() as Promise<HomePersonalizationSnapshot>
      })
      .finally(() => {
        inFlightHomePersonalization = null
      })
  }

  return inFlightHomePersonalization
}

export function useHomePersonalization() {
  const [snapshot, setSnapshot] =
    useState<HomePersonalizationSnapshot>(emptySnapshot)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true

    fetchHomePersonalization()
      .then((nextSnapshot) => {
        if (!active) return
        setSnapshot(nextSnapshot)
      })
      .catch(() => {
        if (!active) return
        setSnapshot(emptySnapshot)
      })
      .finally(() => {
        if (!active) return
        setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])

  return { ...snapshot, loaded }
}
