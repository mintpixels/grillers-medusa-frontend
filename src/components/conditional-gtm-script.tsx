"use client"

import { useEffect, useState } from "react"
import { hasConsent } from "@lib/utils/cookies"
import GTMScript from "./gtm-script"

type ConditionalGTMScriptProps = {
  gtmId: string
  ga4Id?: string
  enabled: boolean
  debug?: boolean
}

export default function ConditionalGTMScript({
  gtmId,
  ga4Id,
  enabled,
  debug,
}: ConditionalGTMScriptProps) {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false)

  useEffect(() => {
    // Check if user has given analytics consent
    const consent = hasConsent("analytics")
    setHasAnalyticsConsent(consent)

    if (debug) {
      console.log("Analytics consent status:", consent)
    }
  }, [debug])

  // Don't load GTM if user hasn't consented to analytics
  if (!hasAnalyticsConsent) {
    if (debug) {
      console.log("GTM blocked: No analytics consent")
    }
    return null
  }

  return (
    <>
      <GTMScript gtmId={gtmId} enabled={enabled} debug={debug} />
      {/* GTM noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  )
}



