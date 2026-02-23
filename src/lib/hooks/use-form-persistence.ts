"use client"

import { useCallback, useEffect, useRef } from "react"

const DEBOUNCE_MS = 500

export function useFormPersistence<T extends Record<string, any>>(
  key: string,
  formData: T,
  setFormData: (data: T) => void,
  cartHasData: boolean
) {
  const initialized = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (cartHasData) return

    try {
      const saved = sessionStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as T
        const hasValues = Object.values(parsed).some(
          (v) => typeof v === "string" && v.trim().length > 0
        )
        if (hasValues) {
          setFormData(parsed)
        }
      }
    } catch {}
  }, [key, setFormData, cartHasData])

  useEffect(() => {
    if (!initialized.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(formData))
      } catch {}
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [key, formData])

  const clearPersisted = useCallback(() => {
    try {
      sessionStorage.removeItem(key)
    } catch {}
  }, [key])

  return { clearPersisted }
}
