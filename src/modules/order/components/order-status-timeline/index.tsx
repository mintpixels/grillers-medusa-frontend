const steps = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

const statusToStep: Record<string, number> = {
  pending: 0,
  not_fulfilled: 1,
  partially_fulfilled: 1,
  fulfilled: 2,
  shipped: 2,
  partially_shipped: 2,
  delivered: 3,
  canceled: -1,
}

export default function OrderStatusTimeline({
  status,
  createdAt,
}: {
  status?: string
  createdAt?: string
}) {
  const currentStep = statusToStep[status || "pending"] ?? 0
  const isCanceled = status === "canceled"

  if (isCanceled) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-maison-neue font-semibold text-red-700">Order Canceled</p>
            {createdAt && (
              <p className="text-xs font-maison-neue text-Charcoal/50">
                Originally placed {new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isComplete = idx <= currentStep
          const isCurrent = idx === currentStep
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isComplete
                      ? "bg-Gold border-Gold"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  )}
                </div>
                <span
                  className={`mt-2 text-[11px] font-maison-neue ${
                    isCurrent ? "font-semibold text-Charcoal" : isComplete ? "text-Gold" : "text-Charcoal/40"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${idx < currentStep ? "bg-Gold" : "bg-gray-200"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
