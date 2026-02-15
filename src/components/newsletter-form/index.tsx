"use client"

import { useState, FormEvent, useId } from "react"
import { subscribeToNewsletter } from "@lib/data/newsletter"

type NewsletterFormProps = {
  title?: string
  description?: string
  placeholderText?: string
  buttonText?: string
  successMessage?: string
  errorMessage?: string
  source?: string
  variant?: "default" | "footer"
}

export default function NewsletterForm({
  title = "Subscribe to our newsletter",
  description = "Get updates on new products and special offers.",
  placeholderText = "Enter your email address",
  buttonText = "Subscribe",
  successMessage = "Thank you for subscribing!",
  errorMessage = "Please enter a valid email address.",
  source = "website",
  variant = "default",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formId = useId()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("idle")

    const result = await subscribeToNewsletter(email, source)

    if (result.success) {
      setStatus("success")
      setMessage(result.message || successMessage)
      setEmail("")
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
      }, 5000)
    } else {
      setStatus("error")
      setMessage(result.error || errorMessage)
    }

    setIsSubmitting(false)
  }

  const isFooterVariant = variant === "footer"

  if (isFooterVariant) {
    return (
      <div className="w-full max-w-xl">
        {title && (
          <h3
            id={`${formId}-title`}
            className="text-p-md font-maison-neue text-white font-semibold mb-2"
          >
            {title}
          </h3>
        )}
        {description && (
          <p className="text-p-sm font-maison-neue text-white/80 mb-4">
            {description}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative mt-6"
          aria-labelledby={title ? `${formId}-title` : undefined}
        >
          <label htmlFor={`${formId}-email`} className="sr-only">
            Email address
          </label>
          <div className="flex items-center bg-Charcoal/[0.04] rounded-lg overflow-hidden shadow-lg ring-1 ring-Charcoal/20">
            {/* Mail icon */}
            <div className="pl-4 pr-2 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-Charcoal/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <input
              id={`${formId}-email`}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === "error") {
                  setStatus("idle")
                  setMessage("")
                }
              }}
              placeholder={placeholderText}
              className="flex-1 bg-transparent text-Charcoal placeholder:text-Charcoal/40 px-2 py-4 text-p-sm font-maison-neue focus:outline-none"
              disabled={isSubmitting}
              required
              aria-describedby={status !== "idle" ? `${formId}-status` : undefined}
              aria-invalid={status === "error"}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-Charcoal hover:bg-Black text-white font-semibold font-maison-neue text-p-sm px-6 py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-inset flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  {buttonText}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Status messages */}
        <div
          id={`${formId}-status`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="min-h-[20px] mt-2"
        >
          {status === "success" && (
            <p className="text-p-sm font-maison-neue text-Charcoal flex items-center gap-2">
              <svg className="w-4 h-4 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </p>
          )}
          {status === "error" && (
            <p className="text-p-sm font-maison-neue text-red-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {message}
            </p>
          )}
        </div>

        {/* Privacy note */}
        <p className="text-[11px] text-Charcoal/50 mt-0 font-maison-neue">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    )
  }

  // Default variant
  return (
    <div className="w-full max-w-md">
      {title && (
        <h3
          id={`${formId}-title`}
          className="font-semibold mb-2 text-lg"
        >
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-4 text-sm opacity-80">
          {description}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
        aria-labelledby={title ? `${formId}-title` : undefined}
      >
        <label htmlFor={`${formId}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === "error") {
              setStatus("idle")
              setMessage("")
            }
          }}
          placeholder={placeholderText}
          className="flex-1 px-4 py-3 rounded border border-gray-300 focus:border-gray-500 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
          disabled={isSubmitting}
          required
          aria-describedby={status !== "idle" ? `${formId}-status` : undefined}
          aria-invalid={status === "error"}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 font-semibold rounded bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2"
        >
          {isSubmitting ? "Subscribing..." : buttonText}
        </button>
      </form>

      {/* Status messages with ARIA live region */}
      <div
        id={`${formId}-status`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-h-[24px] mt-3"
      >
        {status === "success" && (
          <p className="text-sm text-green-500">{message}</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  )
}

