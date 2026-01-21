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
  placeholderText = "Enter your email",
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

  return (
    <div className={`w-full ${isFooterVariant ? "" : "max-w-md"}`}>
      {title && (
        <h3 
          id={`${formId}-title`}
          className={`font-semibold mb-2 ${isFooterVariant ? "text-p-md font-maison-neue text-white" : "text-lg"}`}
        >
          {title}
        </h3>
      )}
      {description && (
        <p className={`mb-4 ${isFooterVariant ? "text-p-sm font-maison-neue text-white/80" : "text-sm opacity-80"}`}>
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
          className={`flex-1 px-4 py-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold ${
            isFooterVariant 
              ? "border border-white/30 bg-white/10 text-white placeholder:text-white/50"
              : "border border-gray-300 focus:border-gray-500 text-gray-900"
          }`}
          disabled={isSubmitting}
          required
          aria-describedby={status !== "idle" ? `${formId}-status` : undefined}
          aria-invalid={status === "error"}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-3 font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 ${
            isFooterVariant
              ? "bg-Gold text-Charcoal hover:bg-Gold/90 font-maison-neue"
              : "bg-white text-gray-900 hover:bg-gray-100"
          }`}
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
          <p className={`text-sm ${isFooterVariant ? "text-green-300" : "text-green-500"}`}>
            {message}
          </p>
        )}

        {status === "error" && (
          <p className={`text-sm ${isFooterVariant ? "text-red-300" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}





