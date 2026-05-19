"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { hasConsent } from "@lib/utils/cookies"
import { jitsuPage } from "@lib/jitsu"

export default function JitsuScript() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false)
  const pathname = usePathname()

  // Check consent on mount
  useEffect(() => {
    try {
      const consent = hasConsent("analytics")
      setHasAnalyticsConsent(consent)
    } catch {
      setHasAnalyticsConsent(false)
    }
  }, [])

  // Track page views on route changes
  useEffect(() => {
    if (hasAnalyticsConsent && pathname) {
      try {
        jitsuPage({
          url: typeof window !== "undefined" ? window.location.href : undefined,
          path: pathname,
          referrer:
            typeof document !== "undefined" ? document.referrer : undefined,
          title: typeof document !== "undefined" ? document.title : undefined,
        })
      } catch {
        // Analytics failures must not trip app route boundaries.
      }
    }
  }, [pathname, hasAnalyticsConsent])

  return null
}
