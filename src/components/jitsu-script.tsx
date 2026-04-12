"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { hasConsent } from "@lib/utils/cookies"
import { getJitsu, jitsuPage } from "@lib/jitsu"

export default function JitsuScript() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false)
  const pathname = usePathname()

  // Check consent on mount
  useEffect(() => {
    const consent = hasConsent("analytics")
    setHasAnalyticsConsent(consent)
  }, [])

  // Initialize Jitsu when consent is granted
  useEffect(() => {
    if (hasAnalyticsConsent) {
      getJitsu()
    }
  }, [hasAnalyticsConsent])

  // Track page views on route changes
  useEffect(() => {
    if (hasAnalyticsConsent && pathname) {
      jitsuPage({
        url: typeof window !== "undefined" ? window.location.href : undefined,
        path: pathname,
        referrer:
          typeof document !== "undefined" ? document.referrer : undefined,
        title: typeof document !== "undefined" ? document.title : undefined,
      })
    }
  }, [pathname, hasAnalyticsConsent])

  return null
}
