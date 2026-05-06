"use client"

import { useState, FormEvent } from "react"

/**
 * "Send me a preferences link" form. POSTs to the storefront proxy at
 * /api/newsletter/request-link, which forwards to the Railway service,
 * which (if the address is on file) sends a Postmark email with a magic
 * link.
 *
 * The endpoint always returns 202 regardless of whether the address is
 * on file — magic-link flows must not disclose subscription status.
 */
export default function RequestLinkForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch("/api/newsletter/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Swallow — the UX message is the same either way; failures are
      // already logged server-side.
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p
        role="status"
        className="font-maison-neue text-p-md text-Charcoal/80"
      >
        If <span className="font-semibold">{email}</span> is on our list,
        we&rsquo;ll send a link to manage your preferences shortly. Check
        your inbox in a minute or two.
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
        disabled={submitting}
        className="flex-1 px-4 py-3 rounded border border-Charcoal/20 bg-white text-Charcoal placeholder:text-Charcoal/40 focus:outline-none focus-visible:border-Gold focus-visible:ring-2 focus-visible:ring-Gold/40 font-maison-neue disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full bg-Gold text-white hover:bg-Gold/90 transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send me a link"}
      </button>
    </form>
  )
}
