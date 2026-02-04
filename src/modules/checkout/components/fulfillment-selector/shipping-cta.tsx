"use client"

import { Button } from "@medusajs/ui"

type ShippingCtaProps = {
  locationName: string
  scheduledDate: string
  onContinue: () => void
  onSwitchToShipping: () => void
  isSubmitting?: boolean
}

export default function ShippingCta({
  locationName,
  scheduledDate,
  onContinue,
  onSwitchToShipping,
  isSubmitting = false,
}: ShippingCtaProps) {
  return (
    <div>
      {/* Success Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Your pickup is scheduled!
            </h3>
            <div className="space-y-1 text-sm text-green-800">
              <p>
                <span className="font-medium">Location:</span> {locationName}
              </p>
              <p>
                <span className="font-medium">Date:</span> {scheduledDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        className="w-full mb-6"
        size="large"
        onClick={onContinue}
        isLoading={isSubmitting}
      >
        Continue to Checkout
      </Button>

      {/* Shipping Alternative */}
      <div className="border-t border-gray-200 pt-6">
        <div className="text-center">
          <p className="text-gray-600 mb-3">Prefer to have it shipped instead?</p>
          <button
            type="button"
            onClick={onSwitchToShipping}
            className="inline-flex items-center gap-2 text-Gold hover:text-Gold/80 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Switch to UPS Shipping
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
