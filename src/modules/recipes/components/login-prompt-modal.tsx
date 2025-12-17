"use client"

import { Fragment } from "react"
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type LoginPromptModalProps = {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  message = "Sign in to access this feature",
}: LoginPromptModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-Charcoal/50" aria-hidden="true" />
        </TransitionChild>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-Gold/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-Gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <DialogTitle className="text-xl font-gyst font-bold text-Charcoal text-center mb-2">
                Save Your Favorites
              </DialogTitle>

              {/* Message */}
              <p className="text-center text-gray-600 mb-6">
                {message}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <LocalizedClientLink
                  href="/account"
                  className="w-full bg-Gold hover:bg-Gold/90 text-Charcoal font-medium py-3 px-4 rounded-md text-center transition-colors"
                  onClick={onClose}
                >
                  Sign In
                </LocalizedClientLink>
                
                <LocalizedClientLink
                  href="/account?mode=register"
                  className="w-full bg-transparent border border-Charcoal hover:bg-gray-50 text-Charcoal font-medium py-3 px-4 rounded-md text-center transition-colors"
                  onClick={onClose}
                >
                  Create Account
                </LocalizedClientLink>

                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-gray-700 text-center mt-2"
                >
                  Continue without signing in
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

