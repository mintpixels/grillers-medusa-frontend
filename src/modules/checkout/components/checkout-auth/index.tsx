"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { checkEmailExists, loginWithCredentials } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"

type CheckoutAuthProps = {
  customer: HttpTypes.StoreCustomer | null
  email: string
  onEmailChange: (email: string) => void
  onLoginSuccess: () => void
}

const CheckoutAuth: React.FC<CheckoutAuthProps> = ({
  customer,
  email,
  onEmailChange,
  onLoginSuccess,
}) => {
  const [authState, setAuthState] = useState<
    "idle" | "checking" | "login" | "guest"
  >(customer ? "idle" : "idle")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const lastCheckedEmail = useRef("")

  useEffect(() => {
    if (!email || customer) return
    if (email === lastCheckedEmail.current) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return

    lastCheckedEmail.current = email
    setAuthState("checking")
    setError(null)

    checkEmailExists(email)
      .then((exists) => {
        setAuthState(exists ? "login" : "guest")
      })
      .catch(() => {
        setAuthState("guest")
      })
  }, [email, customer])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await loginWithCredentials(email, password)
      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.error || "Invalid email or password")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismissLogin = () => {
    setAuthState("guest")
    setError(null)
    setPassword("")
  }

  if (customer) {
    return (
      <div className="mb-5 p-4 bg-Scroll/30 border border-Gold/20 rounded-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-Gold"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-Charcoal">
            Signed in as{" "}
            <span className="font-semibold">
              {customer.first_name} {customer.last_name}
            </span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5">
      {authState === "login" && (
        <div className="p-4 bg-Scroll/30 border border-Gold/20 rounded-lg animate-in fade-in duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-Gold"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-Charcoal">
                Welcome back! Sign in for a faster checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismissLogin}
              className="text-xs text-Charcoal/50 hover:text-Charcoal/80 underline"
            >
              Continue as guest
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="flex-1 h-10 px-3 text-sm bg-white border border-Charcoal/20 rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="h-10 px-5 text-sm font-semibold text-white bg-Gold rounded-md hover:bg-Gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "..." : "Sign In"}
            </button>
          </form>

          {error && (
            <p className="mt-2 text-xs text-VibrantRed">{error}</p>
          )}
        </div>
      )}

      {authState === "checking" && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <svg
              className="w-3 h-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Checking account...
          </p>
        </div>
      )}
    </div>
  )
}

export default CheckoutAuth
