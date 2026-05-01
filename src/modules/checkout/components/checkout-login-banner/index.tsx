"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { loginWithCredentials, signupWithCredentials, signoutKeepCart } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"

const SmallSpinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

type Props = {
  customer: HttpTypes.StoreCustomer | null
}

const WhyAccountInline: React.FC<{ open: boolean }> = ({ open }) => {
  if (!open) return null
  return (
    <div
      id="why-account-explanation"
      className="ml-11 mt-3 mb-4 p-4 bg-Scroll/40 border-l-4 border-Gold rounded-r-md text-sm text-Charcoal/85 leading-relaxed"
      role="region"
      aria-label="Why an account is required"
    >
      <p>
        We hand-cut your meat to order, then weigh and charge for the actual
        weight. That requires a payment method we can adjust the charge
        against — and that needs an account.
      </p>
    </div>
  )
}

const CheckoutLoginBanner: React.FC<Props> = ({ customer }) => {
  const router = useRouter()
  const [mode, setMode] = useState<"prompt" | "signin" | "signup">("prompt")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWhy, setShowWhy] = useState(false)

  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signoutKeepCart()
      router.refresh()
    } catch {
      // no-op
    } finally {
      setLoggingOut(false)
    }
  }

  if (customer) {
    return (
      <div className="flex items-center justify-between p-4 bg-Scroll/30 border border-Gold/20 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-Gold shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-Charcoal">
            Signed in as{" "}
            <span className="font-semibold">
              {customer.first_name} {customer.last_name}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-Charcoal/50 hover:text-Charcoal/80 font-medium transition-colors disabled:opacity-50"
        >
          {loggingOut ? <span className="flex items-center gap-1.5"><SmallSpinner /> Logging out...</span> : "Log out"}
        </button>
      </div>
    )
  }

  const resetForm = () => {
    setError(null)
    setPassword("")
    setFirstName("")
    setLastName("")
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await loginWithCredentials(email, password)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || "Invalid email or password")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !firstName || !lastName) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await signupWithCredentials({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      })
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || "Could not create account")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Initial prompt — sign in or create account
  if (mode === "prompt") {
    return (
      <>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-Gold/10">
                <svg className="w-4 h-4 text-Gold" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-Charcoal">
                Sign in or create an account to continue
              </h3>
            </div>

            <p className={`text-sm text-Charcoal/60 ml-11 ${showWhy ? "mb-1" : "mb-5"}`}>
              An account is required to complete your order.{" "}
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                aria-expanded={showWhy}
                aria-controls="why-account-explanation"
                className="inline-flex items-center gap-1 text-Gold hover:text-Gold/80 font-medium transition-colors"
              >
                {showWhy ? "Why? ▴" : "Why? ▾"}
              </button>
            </p>

            <WhyAccountInline open={showWhy} />

            <div className="flex flex-col sm:flex-row gap-3 ml-11">
              <button
                type="button"
                onClick={() => { resetForm(); setMode("signin") }}
                className="flex-1 h-11 text-sm font-semibold text-white bg-Gold rounded-lg hover:bg-Gold/90 transition-colors"
              >
                I already have an account
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setMode("signup") }}
                className="flex-1 h-11 text-sm font-semibold text-Charcoal bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Sign-in form
  if (mode === "signin") {
    return (
      <>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-Charcoal">Sign in to your account</h3>
              <button
                type="button"
                onClick={() => { resetForm(); setMode("signup") }}
                className="text-xs text-Gold hover:text-Gold/80 font-medium"
              >
                Create account instead
              </button>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                autoFocus
                className="w-full h-10 px-3 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-10 px-3 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
              />
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full h-11 text-sm font-semibold text-white bg-Gold rounded-lg hover:bg-Gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? <span className="flex items-center justify-center gap-2"><SmallSpinner /> Signing in...</span> : "Sign In"}
              </button>
            </form>

            {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => { resetForm(); setMode("prompt") }}
                className="text-xs text-Charcoal/50 hover:text-Charcoal/80 transition-colors"
              >
                Back to options
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Sign-up form
  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-Charcoal">Create your account</h3>
            <button
              type="button"
              onClick={() => { resetForm(); setMode("signin") }}
              className="text-xs text-Gold hover:text-Gold/80 font-medium"
            >
              Sign in instead
            </button>
          </div>

          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                autoFocus
                className="w-full h-10 px-3 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
                className="w-full h-10 px-3 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
              />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full h-10 px-3 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={8}
              className="w-full h-10 px-3 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-1 focus:ring-Gold focus:border-Gold"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email || !password || !firstName || !lastName}
              className="w-full h-11 text-sm font-semibold text-white bg-Gold rounded-lg hover:bg-Gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? <span className="flex items-center justify-center gap-2"><SmallSpinner /> Creating account...</span> : "Create Account & Continue"}
            </button>
          </form>

          {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

          <p className="mt-4 text-xs text-center text-Charcoal/40">
            By creating an account you agree to our terms of service.{" "}
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              aria-controls="why-account-explanation"
              className="inline-flex items-center gap-0.5 text-Gold/70 hover:text-Gold font-medium transition-colors"
            >
              Why do I need an account?
            </button>
          </p>
          <WhyAccountInline open={showWhy} />

          <div className="mt-3 pt-3 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => { resetForm(); setMode("prompt") }}
              className="text-xs text-Charcoal/50 hover:text-Charcoal/80 transition-colors"
            >
              Back to options
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default CheckoutLoginBanner
