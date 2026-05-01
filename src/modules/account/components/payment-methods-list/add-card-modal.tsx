"use client"

import { useEffect, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { createPaymentMethodSetupIntent } from "@lib/data/payment"

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise: Promise<Stripe | null> | null = stripeKey
  ? loadStripe(stripeKey)
  : null

const AddCardForm: React.FC<{
  onClose: () => void
  onSuccess: () => void
}> = ({ onClose, onSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [makeDefault, setMakeDefault] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: setupError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url:
            typeof window !== "undefined"
              ? `${window.location.origin}/us/account/payment-methods`
              : "/us/account/payment-methods",
        },
        redirect: "if_required",
      })
      if (setupError) {
        setError(setupError.message || "Could not save card.")
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{ layout: "tabs", fields: { billingDetails: { address: { country: "auto" } } } }}
      />
      <label className="flex items-center gap-2 text-sm text-Charcoal/80">
        <input
          type="checkbox"
          checked={makeDefault}
          onChange={(e) => setMakeDefault(e.target.checked)}
          className="rounded border-Charcoal/30 text-Gold focus:ring-Gold"
        />
        Make this my default card
      </label>
      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-3">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-semibold text-Charcoal/70 hover:text-Charcoal"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-Gold hover:bg-Gold/90 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save card"}
        </button>
      </div>
    </form>
  )
}

const AddCardModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}> = ({ isOpen, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null)
      setLoadError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const result = await createPaymentMethodSetupIntent()
      if (cancelled) return
      if ("error" in result) {
        setLoadError(result.error)
      } else {
        setClientSecret(result.client_secret)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const elementsOptions: StripeElementsOptions | null = clientSecret
    ? { clientSecret, appearance: { theme: "stripe" } }
    : null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="h-1.5 bg-Gold" />
                <div className="p-6">
                  <Dialog.Title className="text-lg font-semibold text-Charcoal mb-1">
                    Add a card
                  </Dialog.Title>
                  <p className="text-xs text-Charcoal/60 mb-4">
                    We securely save your card with Stripe so checkout is faster
                    next time.
                  </p>
                  {loadError && (
                    <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-3 mb-2">
                      {loadError}
                    </p>
                  )}
                  {!clientSecret && !loadError && (
                    <div className="py-8 text-center text-sm text-Charcoal/50">
                      Preparing secure form...
                    </div>
                  )}
                  {clientSecret && stripePromise && elementsOptions && (
                    <Elements stripe={stripePromise} options={elementsOptions}>
                      <AddCardForm onClose={onClose} onSuccess={onSuccess} />
                    </Elements>
                  )}
                  {clientSecret && !stripePromise && (
                    <p className="text-sm text-rose-600">
                      Stripe is not configured. Please contact support.
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AddCardModal
