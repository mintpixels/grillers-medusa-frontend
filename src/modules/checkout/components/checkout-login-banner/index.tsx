"use client"

import React, { useState, Fragment } from "react"
import { useRouter } from "next/navigation"
import { loginWithCredentials, signupWithCredentials, signoutKeepCart } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { Dialog, Transition } from "@headlessui/react"

const SmallSpinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

type Props = {
  customer: HttpTypes.StoreCustomer | null
}

function WhyAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-0 shadow-2xl transition-all">
                {/* Gold accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-Gold via-Gold/80 to-Gold" />

                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-Gold/10">
                        <svg className="w-5 h-5 text-Gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <Dialog.Title className="text-lg font-semibold text-Charcoal">
                        Fair Pricing, Honest Weights
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="space-y-4 text-sm text-Charcoal/80 leading-relaxed">
                    <p>
                      At Grillers Pride, we believe in <span className="font-semibold text-Charcoal">complete transparency</span> with
                      our pricing. Because we sell premium cuts by the pound, the price you see at checkout is an
                      estimate based on the target weight.
                    </p>

                    <div className="flex gap-3 p-4 bg-Scroll/30 rounded-xl border border-Gold/15">
                      <svg className="w-5 h-5 text-Gold shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p>
                        When your order is packed, we weigh each item and adjust your final invoice to reflect the
                        <span className="font-semibold text-Charcoal"> exact weight</span> — so you only pay for what you actually receive.
                      </p>
                    </div>

                    <p>
                      To make this seamless, we keep your payment method securely on file so we can process the
                      final adjusted amount. No surprises, no overcharges — just honest pricing for the highest
                      quality kosher meats.
                    </p>

                    <div className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <svg className="w-5 h-5 text-[#2D479D] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <p>
                        Plus, your account makes reordering a breeze — saved addresses, order history,
                        and faster checkout every time you come back.
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={onClose}
                    className="mt-6 w-full h-11 text-sm font-semibold text-white bg-Gold rounded-lg hover:bg-Gold/90 transition-colors"
                  >
                    Got it, let&apos;s get started
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
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
  const [showWhyModal, setShowWhyModal] = useState(false)

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
        <WhyAccountModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />
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

            <p className="text-sm text-Charcoal/60 mb-5 ml-11">
              An account is required to complete your order.{" "}
              <button
                type="button"
                onClick={() => setShowWhyModal(true)}
                className="inline-flex items-center gap-1 text-Gold hover:text-Gold/80 font-medium transition-colors"
              >
                Why?
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
            </p>

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
        <WhyAccountModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />
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
      <WhyAccountModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />
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
              onClick={() => setShowWhyModal(true)}
              className="inline-flex items-center gap-0.5 text-Gold/70 hover:text-Gold font-medium transition-colors"
            >
              Why do I need an account?
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </p>

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
