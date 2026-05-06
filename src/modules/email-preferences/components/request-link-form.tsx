"use client"

import { useState, FormEvent } from "react"

/**
 * "Send me a preferences link" form. Until the transactional email pipeline
 * lands (#69 / #70 — Postmark), this only logs a TODO to the console. We
 * still confirm to the user so the UX is consistent — magic-link emails
 * intentionally don't disclose whether the address is on file.
 */
export default function RequestLinkForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO(#69/#70): once Postmark is wired, POST to a service endpoint that
    // looks up the subscriber by email and emails them a one-time preferences
    // link. For now we no-op + console.log so the form has visible behaviour
    // without leaking subscription status.
    if (typeof window !== "undefined") {
      console.log(
        "[email-preferences] TODO send magic link via Postmark for:",
        email,
      )
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p
        role="status"
        className="font-maison-neue text-p-md text-Charcoal/80"
      >
        If <span className="font-semibold">{email}</span> is on our list,
        we&rsquo;ll send you a link to manage your preferences shortly.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
      <label htmlFor="prefs-email" className="sr-only">
        Email address
      </label>
      <input
        id="prefs-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="flex-1 px-4 py-3 rounded border border-Charcoal/20 bg-white text-Charcoal placeholder:text-Charcoal/40 focus:outline-none focus-visible:border-Gold focus-visible:ring-2 focus-visible:ring-Gold/40 font-maison-neue"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full bg-Gold text-white hover:bg-Gold/90 transition-colors whitespace-nowrap"
      >
        Send me a link
      </button>
    </form>
  )
}
