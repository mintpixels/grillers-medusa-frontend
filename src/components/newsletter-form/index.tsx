"use client"

import { useState, FormEvent } from "react"

type NewsletterFormProps = {
  title?: string
  description?: string
  placeholderText?: string
  buttonText?: string
  successMessage?: string
  errorMessage?: string
}

export default function NewsletterForm({
  title = "Subscribe to our newsletter",
  description = "Get updates on new products and special offers.",
  placeholderText = "Enter your email",
  buttonText = "Subscribe",
  successMessage = "Thank you for subscribing!",
  errorMessage = "Please enter a valid email address.",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setStatus("error")
      return
    }

    setIsSubmitting(true)

    // TODO: Integration with email marketing service
    // For now, just log to console and show success
    console.log("Newsletter signup:", email)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setStatus("success")
    setEmail("")
    setIsSubmitting(false)

    // Reset success message after 5 seconds
    setTimeout(() => {
      setStatus("idle")
    }, 5000)
  }

  return (
    <div className="w-full max-w-md">
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm opacity-80 mb-4">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === "error") setStatus("idle")
          }}
          placeholder={placeholderText}
          className="flex-1 px-4 py-3 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-gray-900"
          disabled={isSubmitting}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-white text-gray-900 font-semibold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSubmitting ? "Subscribing..." : buttonText}
        </button>
      </form>

      {status === "success" && (
        <p className="mt-3 text-sm text-green-400">{successMessage}</p>
      )}

      {status === "error" && (
        <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  )
}



