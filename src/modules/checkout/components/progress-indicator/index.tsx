"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { clx } from "@medusajs/ui"

type Step = {
  id: string
  label: string
  param: string
}

const CHECKOUT_STEPS: Step[] = [
  { id: "address", label: "Address", param: "address" },
  { id: "delivery", label: "Delivery", param: "delivery" },
  { id: "payment", label: "Payment", param: "payment" },
  { id: "review", label: "Review", param: "review" },
]

type ProgressIndicatorProps = {
  cart: any
}

export default function ProgressIndicator({ cart }: ProgressIndicatorProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  const currentStep = searchParams.get("step") || "address"

  // Determine which steps are completed based on cart data
  const getStepStatus = (stepId: string): "completed" | "current" | "upcoming" => {
    const stepIndex = CHECKOUT_STEPS.findIndex((s) => s.id === stepId)
    const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "current"
    return "upcoming"
  }

  // Check if a step can be navigated to
  const canNavigateTo = (stepId: string): boolean => {
    const stepIndex = CHECKOUT_STEPS.findIndex((s) => s.id === stepId)
    const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep)
    
    // Can only navigate to completed steps (going back)
    return stepIndex < currentIndex
  }

  // Handle step click
  const handleStepClick = (step: Step) => {
    if (canNavigateTo(step.id)) {
      router.push(`${pathname}?step=${step.param}`, { scroll: false })
    }
  }

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {CHECKOUT_STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const isClickable = canNavigateTo(step.id)
          const isLast = index === CHECKOUT_STEPS.length - 1

          return (
            <li
              key={step.id}
              className={clx("flex items-center", {
                "flex-1": !isLast,
              })}
            >
              {/* Step indicator */}
              <button
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={clx(
                  "flex flex-col items-center gap-2 transition-colors",
                  {
                    "cursor-pointer": isClickable,
                    "cursor-default": !isClickable,
                  }
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                {/* Circle with number or checkmark */}
                <span
                  className={clx(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold transition-colors",
                    {
                      // Completed - filled with checkmark
                      "bg-Charcoal border-Charcoal text-white": status === "completed",
                      // Current - gold ring
                      "bg-Gold border-Gold text-Charcoal": status === "current",
                      // Upcoming - gray outline
                      "bg-white border-Pewter/40 text-Pewter/60": status === "upcoming",
                      // Hover for clickable
                      "hover:bg-Charcoal/90": isClickable && status === "completed",
                    }
                  )}
                >
                  {status === "completed" ? (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Label */}
                <span
                  className={clx(
                    "text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-wide hidden sm:block",
                    {
                      "text-Charcoal font-bold": status === "current",
                      "text-Charcoal": status === "completed",
                      "text-Pewter/60": status === "upcoming",
                    }
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={clx(
                    "flex-1 h-0.5 mx-2 sm:mx-4 transition-colors",
                    {
                      "bg-Charcoal": status === "completed",
                      "bg-Pewter/20": status !== "completed",
                    }
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

