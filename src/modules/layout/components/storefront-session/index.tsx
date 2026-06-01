"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  CART_UPDATED_EVENT,
  type CartUpdatedDetail,
} from "@lib/util/cart-events"
import type { StorefrontSessionSnapshot, StorefrontSessionState } from "./types"

const emptySnapshot: StorefrontSessionSnapshot = {
  customer: null,
  staffImpersonation: null,
  cart: null,
  cartItemCount: 0,
  shippingOptions: [],
  deliveryZip: null,
  deliveryZipSource: null,
}

type StorefrontSessionContextValue = StorefrontSessionState & {
  refreshSession: () => Promise<void>
}

const StorefrontSessionContext =
  createContext<StorefrontSessionContextValue | null>(null)

async function fetchSessionSnapshot() {
  const response = await fetch("/api/storefront/session", {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Could not load storefront session")
  }

  return (await response.json()) as StorefrontSessionSnapshot
}

export function StorefrontSessionProvider({
  children,
}: {
  children: ReactNode
}) {
  const mountedRef = useRef(false)
  const [snapshot, setSnapshot] =
    useState<StorefrontSessionSnapshot>(emptySnapshot)
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const refreshSession = useCallback(async () => {
    setRefreshing(true)

    try {
      const nextSnapshot = await fetchSessionSnapshot()
      if (!mountedRef.current) return
      setSnapshot(nextSnapshot)
      setLoaded(true)
    } catch {
      if (!mountedRef.current) return
      setLoaded(true)
    } finally {
      if (mountedRef.current) {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void refreshSession()

    return () => {
      mountedRef.current = false
    }
  }, [refreshSession])

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail
      if (!detail?.action) return
      void refreshSession()
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    return () =>
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
  }, [refreshSession])

  const value = useMemo<StorefrontSessionContextValue>(
    () => ({
      ...snapshot,
      loaded,
      refreshing,
      refreshSession,
    }),
    [loaded, refreshSession, refreshing, snapshot]
  )

  return (
    <StorefrontSessionContext.Provider value={value}>
      {children}
    </StorefrontSessionContext.Provider>
  )
}

export function useStorefrontSession() {
  const context = useContext(StorefrontSessionContext)

  if (!context) {
    throw new Error(
      "useStorefrontSession must be used within StorefrontSessionProvider"
    )
  }

  return context
}
