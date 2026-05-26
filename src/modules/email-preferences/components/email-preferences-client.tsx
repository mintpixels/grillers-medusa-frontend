"use client"

import { useState } from "react"

type Subscriber = {
  email: string
  status: "subscribed" | "unsubscribed"
  preferences: Record<string, unknown>
}

type Props = {
  token: string
  initial: Subscriber
}

// Default preference toggles. The shape lives in jsonb on the service side
// so we can extend this without a schema migration. Keep the keys stable —
// existing subscribers' rows will retain whatever's stored there.
const PREFERENCE_TOGGLES: { key: string; label: string; description: string }[] = [
  {
    key: "promotions",
    label: "Promotions & holiday deals",
    description:
      "Yom Tov drops, holiday-week specials, and time-limited offers (2-3x/year).",
  },
  {
    key: "new_products",
    label: "New product announcements",
    description: "First look at new cuts, smoked items, and seasonal additions.",
  },
  {
    key: "recipes",
    label: "Recipes & grilling tips",
    description: "Occasional cooking inspiration from our team.",
  },
  {
    key: "holiday_reminders",
    label: "Holiday & Shabbos reminders",
    description: "Ordering windows, pickup timing, and seasonal planning notes.",
  },
  {
    key: "back_in_stock",
    label: "Back-in-stock alerts",
    description: "Item-specific alerts for products you asked us to notify you about.",
  },
]

function getBoolPref(prefs: Record<string, unknown>, key: string): boolean {
  const v = prefs[key]
  // Default to true when the key is missing so existing subscribers stay
  // opted into everything they were getting before this UI shipped.
  if (v === undefined || v === null) return true
  return Boolean(v)
}

export default function EmailPreferencesClient({ token, initial }: Props) {
  const [status, setStatus] = useState<Subscriber["status"]>(initial.status)
  const [preferences, setPreferences] = useState<Record<string, unknown>>(
    initial.preferences || {},
  )
  const [saving, setSaving] = useState(false)
  const [unsubLoading, setUnsubLoading] = useState(false)
  const [feedback, setFeedback] = useState<
    | { kind: "saved" | "error" | "unsubscribed"; message: string }
    | null
  >(null)

  const isSubscribed = status === "subscribed"

  const togglePref = (key: string) => {
    const next = { ...preferences, [key]: !getBoolPref(preferences, key) }
    setPreferences(next)
  }

  const savePreferences = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const r = await fetch(
        `/api/newsletter/preferences/${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ preferences }),
        },
      )
      if (r.ok) {
        const data = (await r.json()) as Subscriber
        setPreferences(data.preferences)
        setFeedback({ kind: "saved", message: "Preferences saved." })
      } else {
        setFeedback({
          kind: "error",
          message: "Could not save your preferences. Please try again.",
        })
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "Could not save your preferences. Please try again.",
      })
    }
    setSaving(false)
  }

  const unsubscribe = async () => {
    setUnsubLoading(true)
    setFeedback(null)
    try {
      const r = await fetch(
        `/api/newsletter/unsubscribe/${encodeURIComponent(token)}`,
        { method: "POST" },
      )
      if (r.ok) {
        setStatus("unsubscribed")
        setFeedback({
          kind: "unsubscribed",
          message: "You're unsubscribed. We won't send you any more email.",
        })
      } else {
        setFeedback({
          kind: "error",
          message: "Could not unsubscribe. Please try again.",
        })
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "Could not unsubscribe. Please try again.",
      })
    }
    setUnsubLoading(false)
  }

  const resubscribe = async () => {
    setUnsubLoading(true)
    setFeedback(null)
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: initial.email,
          source: "email-preferences",
          source_url:
            typeof window !== "undefined" ? window.location.href : undefined,
          consent_version: "v1-2026-05",
        }),
      })
      if (r.ok) {
        setStatus("subscribed")
        setFeedback({
          kind: "saved",
          message: "Welcome back — you're subscribed.",
        })
      } else {
        setFeedback({
          kind: "error",
          message: "Could not resubscribe. Please try again.",
        })
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "Could not resubscribe. Please try again.",
      })
    }
    setUnsubLoading(false)
  }

  return (
    <div className="border border-Charcoal/10 rounded-lg p-6 md:p-8 bg-Charcoal/[0.02]">
      <div className="flex flex-col gap-1 mb-6">
        <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.18em] text-Charcoal/50">
          Subscriber
        </p>
        <p className="font-maison-neue text-Charcoal text-p-md break-all">
          {initial.email}
        </p>
        <p className="font-maison-neue text-p-sm mt-1">
          Status:{" "}
          <span
            className={
              isSubscribed
                ? "text-green-700 font-semibold"
                : "text-Charcoal/60 font-semibold"
            }
          >
            {isSubscribed ? "Subscribed" : "Unsubscribed"}
          </span>
        </p>
      </div>

      {isSubscribed && (
        <fieldset className="border-t border-Charcoal/10 pt-6">
          <legend className="sr-only">Email preferences</legend>
          <p className="font-gyst text-Charcoal text-h6 mb-4">
            What we send you
          </p>
          <ul className="flex flex-col gap-4">
            {PREFERENCE_TOGGLES.map((p) => {
              const checked = getBoolPref(preferences, p.key)
              return (
                <li key={p.key}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePref(p.key)}
                      className="mt-1 h-5 w-5 rounded border-Charcoal/40 text-Gold focus:ring-Gold"
                    />
                    <span className="flex flex-col">
                      <span className="font-maison-neue text-Charcoal font-semibold">
                        {p.label}
                      </span>
                      <span className="font-maison-neue text-p-sm text-Charcoal/70">
                        {p.description}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={savePreferences}
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full bg-Gold text-white hover:bg-Gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={unsubLoading}
              className="inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full border border-Charcoal/20 text-Charcoal hover:bg-Charcoal/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unsubLoading ? "Working..." : "Unsubscribe from all"}
            </button>
          </div>
        </fieldset>
      )}

      {!isSubscribed && (
        <div className="border-t border-Charcoal/10 pt-6">
          <p className="font-maison-neue text-Charcoal/75 mb-4">
            You&rsquo;re not currently subscribed. Want back in?
          </p>
          <button
            type="button"
            onClick={resubscribe}
            disabled={unsubLoading}
            className="inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full bg-Gold text-white hover:bg-Gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unsubLoading ? "Working..." : "Resubscribe"}
          </button>
        </div>
      )}

      <div role="status" aria-live="polite" className="min-h-[24px] mt-4">
        {feedback && (
          <p
            className={`font-maison-neue text-p-sm ${
              feedback.kind === "error"
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  )
}
