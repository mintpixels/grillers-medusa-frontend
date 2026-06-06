"use client"

import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  isTransientNavigationError,
  shouldRetryTransientNavigationError,
} from "@lib/util/transient-navigation-error"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const recoverable = isTransientNavigationError(error)
  const [recoveryExhausted, setRecoveryExhausted] = useState(false)

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)

    if (!recoverable) return

    if (!shouldRetryTransientNavigationError("route-error-reset", error)) {
      setRecoveryExhausted(true)
      return
    }

    const timer = window.setTimeout(() => reset(), 150)
    return () => window.clearTimeout(timer)
  }, [error, recoverable, reset])

  if (recoverable && !recoveryExhausted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <p className="rounded-md border border-Charcoal/10 bg-white px-4 py-3 text-p-sm text-Charcoal/70 shadow-sm">
          Reconnecting...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-h2 font-gyst text-Charcoal mb-4">
          Something went wrong
        </h1>
        <p className="text-p-md text-Charcoal/70 mb-2">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <p className="text-p-sm text-Charcoal/50">
          Our team has been notified and is working to fix the issue.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-Charcoal text-white font-maison-neue-mono uppercase text-p-sm tracking-wide rounded-[5px] hover:bg-Charcoal/90 transition-colors"
        >
          Try again
        </button>

        <Link
          className="flex gap-x-1 items-center group px-6 py-3"
          href="/"
        >
          <Text className="text-ui-fg-interactive">Go to homepage</Text>
          <ArrowUpRightMini
            className="group-hover:rotate-45 ease-in-out duration-150"
            color="var(--fg-interactive)"
          />
        </Link>
      </div>

      {error?.digest && (
        <p className="text-p-ex-sm-mono text-Pewter/50 mt-4">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
