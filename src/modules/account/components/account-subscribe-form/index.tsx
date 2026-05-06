"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const NEWSLETTER_CONSENT_VERSION = "v1-2026-05"

/**
 * One-click subscribe shown on the account email-subscription page when
 * the logged-in customer's email isn't on the newsletter list yet. Hits
 * the same /api/newsletter/subscribe proxy as the homepage form, so the
 * audit log and welcome email both fire normally.
 */
export default function AccountSubscribeForm({ email }: { email: string }) {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const subscribe = async () => {
    setState("submitting")
    setError(null)
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source: "account-email-subscription",
          source_url:
            typeof window !== "undefined" ? window.location.href : undefined,
          consent_version: NEWSLETTER_CONSENT_VERSION,
        }),
      })
      if (r.ok) {
        // Re-render the server component so the page picks up the new
        // subscriber state (prefs UI replaces the subscribe form).
        router.refresh()
      } else {
        setState("error")
        setError("Could not subscribe. Please try again in a moment.")
      }
    } catch {
      setState("error")
      setError("Could not subscribe. Please try again in a moment.")
    }
  }

  return (
    <div className="border border-Charcoal/10 rounded-lg p-6 md:p-8 bg-Charcoal/[0.02]">
      <p className="font-gyst text-h6 text-Charcoal mb-2">
        You&rsquo;re not subscribed yet.
      </p>
      <p className="font-maison-neue text-Charcoal/75 mb-5">
        Get holiday-week deadlines, new cuts, and seasonal drops in your inbox
        2&ndash;3 times a year. Unsubscribe with one click any time.
      </p>
      <button
        type="button"
        onClick={subscribe}
        disabled={state === "submitting"}
        className="inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full bg-Gold text-white hover:bg-Gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? "Subscribing..." : "Subscribe with this email"}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-3 font-maison-neue text-p-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  )
}
