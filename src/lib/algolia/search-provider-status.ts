"use client"

import { useEffect } from "react"
import { useInstantSearch } from "react-instantsearch"
import { reportClientOpsAlert } from "@lib/client-error-reporter"

type SearchSurface = "desktop_nav" | "mobile_nav" | "search_results"

function searchErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name || "Error"}: ${error.message || ""}`.trim()
  }
  if (typeof error === "string") return error
  try {
    return String(error || "Search provider unavailable.")
  } catch {
    return "Search provider unavailable."
  }
}

export function useSearchProviderStatus({
  query,
  surface,
}: {
  query: string
  surface: SearchSurface
}) {
  const { status, error } = useInstantSearch({ catchError: true })
  const trimmedQuery = query.trim()
  const isSearchUnavailable = status === "error"
  const message = searchErrorMessage(error)

  useEffect(() => {
    if (!isSearchUnavailable || trimmedQuery.length < 2) return

    reportClientOpsAlert({
      kind: "client_search_provider_failed",
      severity: "warn",
      title: "Product search provider failed",
      message,
      extra: {
        provider: "algolia",
        search_surface: surface,
        search_term: trimmedQuery.slice(0, 80),
      },
    })
  }, [isSearchUnavailable, message, surface, trimmedQuery])

  return {
    error,
    isSearchUnavailable,
    message,
    status,
  }
}
