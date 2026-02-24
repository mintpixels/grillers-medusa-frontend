"use client"

import { useCallback, useEffect, useRef } from "react"

const DEBOUNCE_MS = 400

export function useFormPersistence<T extends Record<string, any>>(
  key: string,
  formData: T,
  setFormData: (data: T | ((prev: T) => T)) => void
) {
  const initialized = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  // Restore on mount — merge saved values into any empty fields
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const saved = localStorage.getItem(key)
      if (!saved) return

      const parsed = JSON.parse(saved) as T
      setFormData((prev: T) => {
        const merged = { ...prev } as Record<string, any>
        let changed = false
        for (const [field, val] of Object.entries(parsed)) {
          if (
            typeof val === "string" &&
            val.trim().length > 0 &&
            (!merged[field] || (typeof merged[field] === "string" && merged[field].trim().length === 0))
          ) {
            merged[field] = val
            changed = true
          }
        }
        return changed ? (merged as T) : prev
      })
    } catch {}
  }, [key, setFormData])

  // Persist every change
  useEffect(() => {
    if (!initialized.current) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(formData))
      } catch {}
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [key, formData])

  const clearPersisted = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {}
  }, [key])

  return { clearPersisted }
}
