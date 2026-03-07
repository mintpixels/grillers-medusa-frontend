"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Checkout ran into a problem
        </h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          We couldn&apos;t load the checkout page. Your cart and items are safe
          &mdash; please try again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-6 h-11 text-sm font-semibold text-white bg-Gold rounded-lg hover:bg-Gold/90 transition-colors"
          >
            Try again
          </button>
          <LocalizedClientLink
            href="/cart"
            className="w-full sm:w-auto px-6 h-11 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
          >
            Return to cart
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
