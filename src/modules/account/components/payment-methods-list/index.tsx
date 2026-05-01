"use client"

import { Fragment, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, Transition } from "@headlessui/react"
import {
  SavedPaymentMethod,
  deleteSavedPaymentMethod,
  setDefaultPaymentMethod,
} from "@lib/data/payment"
import AddCardModal from "./add-card-modal"

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
}

const ConfirmDeleteModal: React.FC<{
  open: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}> = ({ open, busy, onCancel, onConfirm }) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as="div" className="relative z-[80]" onClose={onCancel}>
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
            <Dialog.Panel className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6">
              <Dialog.Title className="text-base font-semibold text-Charcoal">
                Remove this card?
              </Dialog.Title>
              <p className="text-sm text-Charcoal/70 mt-2">
                You can add it again at any time.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-semibold text-Charcoal/70 hover:text-Charcoal"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={busy}
                  className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-VibrantRed hover:bg-VibrantRed/90 disabled:opacity-60"
                >
                  {busy ? "Removing..." : "Remove card"}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
)

export default function PaymentMethodsList({
  initialMethods,
}: {
  initialMethods: SavedPaymentMethod[]
}) {
  const router = useRouter()
  const [methods, setMethods] = useState(initialMethods)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null)
  const [busyDefaultId, setBusyDefaultId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setBusyDeleteId(pendingDelete)
    const result = await deleteSavedPaymentMethod(pendingDelete)
    setBusyDeleteId(null)
    setPendingDelete(null)
    if (result.success) {
      setMethods((prev) => prev.filter((m) => m.id !== pendingDelete))
      router.refresh()
    }
  }

  const handleSetDefault = async (id: string) => {
    setBusyDefaultId(id)
    const result = await setDefaultPaymentMethod(id)
    setBusyDefaultId(null)
    if (result.success) {
      setMethods((prev) =>
        prev.map((m) => ({ ...m, is_default: m.id === id }))
      )
      router.refresh()
    }
  }

  const handleAddSuccess = () => {
    setShowAddModal(false)
    router.refresh()
  }

  const renderEmpty = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <svg
        className="w-16 h-16 mx-auto text-Charcoal/20 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
      <p className="text-lg font-gyst font-bold text-Charcoal mb-2">
        No saved cards yet
      </p>
      <p className="text-sm font-maison-neue text-Charcoal/60 mb-5">
        Save a card for faster checkout next time.
      </p>
      <button
        onClick={() => setShowAddModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-Gold hover:bg-Gold/90 transition-colors"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add a card
      </button>
    </div>
  )

  return (
    <>
      <ConfirmDeleteModal
        open={!!pendingDelete}
        busy={!!busyDeleteId}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
      <AddCardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {methods.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-Charcoal border border-Charcoal/20 hover:border-Gold hover:text-Gold transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add a card
            </button>
          </div>

          {methods.map((method) => {
            const card = method.data?.card
            const brand = (card?.brand || "card").toLowerCase()
            const brandLabel = BRAND_LABELS[brand] || (card?.brand || "Card")

            return (
              <div
                key={method.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-maison-neue font-bold text-Charcoal/60 uppercase">
                    {brandLabel}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-maison-neue font-semibold text-Charcoal flex items-center gap-2">
                    {brandLabel} ending in {card?.last4 || "****"}
                    {method.is_default && (
                      <span className="inline-flex items-center text-[10px] font-maison-neue-mono uppercase tracking-wide text-Gold bg-Gold/10 border border-Gold/30 rounded px-1.5 py-0.5">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-maison-neue text-Charcoal/50">
                    Expires{" "}
                    {String(card?.exp_month || 0).padStart(2, "0")}/
                    {card?.exp_year}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!method.is_default && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      disabled={busyDefaultId === method.id}
                      className="text-xs font-maison-neue text-Charcoal/60 hover:text-Gold transition-colors disabled:opacity-50"
                    >
                      {busyDefaultId === method.id
                        ? "Setting..."
                        : "Set as default"}
                    </button>
                  )}
                  <button
                    onClick={() => setPendingDelete(method.id)}
                    disabled={busyDeleteId === method.id}
                    className="text-xs font-maison-neue text-Charcoal/40 hover:text-VibrantRed transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
