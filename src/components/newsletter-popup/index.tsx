"use client"

import { useEffect, useState, useTransition } from "react"
import { subscribeToNewsletter } from "@lib/data/newsletter"

const STORAGE_KEY = "gp-newsletter-popup"
const SHOW_AFTER_MS = 18_000
const SNOOZE_DAYS = 30

/**
 * Email-capture popup: appears once after ~18s on the storefront, snoozes
 * for 30 days on dismiss, and never returns after a successful signup.
 * Suppressed for signed-in customers (the layout only mounts it for
 * guests). Feeds GP Comms → express consent + Welcome Series.
 */
export default function NewsletterPopup() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      if (state.subscribed) return
      if (state.snoozedUntil && Date.now() < state.snoozedUntil) return
    } catch {
      // first visit
    }
    const timer = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setOpen(false)
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          snoozedUntil: Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000,
        })
      )
    } catch {
      // storage unavailable — popup just re-arms next session
    }
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await subscribeToNewsletter(email.trim(), "storefront_popup")
      if (result.success) {
        setDone(true)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ subscribed: true }))
        } catch {
          // fine
        }
        window.setTimeout(() => setOpen(false), 2500)
      } else {
        setError(result.error || "Could not sign you up — try again.")
      }
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl small:left-auto small:right-6 small:mx-0"
      role="dialog"
      aria-label="Newsletter signup"
      data-testid="newsletter-popup"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-3 top-2 text-xl leading-none text-Charcoal/45 hover:text-Charcoal"
      >
        ×
      </button>
      {done ? (
        <p className="pr-4 text-sm font-maison-neue text-Charcoal">
          You&apos;re on the list — a welcome note is on its way. 🥩
        </p>
      ) : (
        <>
          <p className="pr-4 text-base font-gyst font-bold text-Charcoal">
            First crack at holiday cuts
          </p>
          <p className="mt-1 pr-4 text-sm text-Charcoal/65">
            Order deadlines, new cuts, and butcher tips — a couple of emails a
            month, never on Shabbos.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              placeholder="you@example.com"
              className="min-h-[42px] flex-1 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-Gold"
              data-testid="newsletter-popup-email"
            />
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !email.trim()}
              className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-Charcoal px-4 text-xs font-rexton font-bold uppercase text-white disabled:opacity-50"
            >
              Sign up
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          ) : null}
        </>
      )}
    </div>
  )
}
