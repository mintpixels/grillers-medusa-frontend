"use client"

import { clx } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"

type CollapsibleSectionProps = {
  title: string
  summary?: React.ReactNode
  isComplete: boolean
  isExpanded: boolean
  onEdit: () => void
  children: React.ReactNode
  className?: string
}

/**
 * A collapsible section component that follows Shopify's checkout pattern.
 * - When expanded: shows title + children
 * - When collapsed and complete: shows title + summary + Edit button
 * - When collapsed and incomplete: shows title only (grayed out)
 */
export default function CollapsibleSection({
  title,
  summary,
  isComplete,
  isExpanded,
  onEdit,
  children,
  className,
}: CollapsibleSectionProps) {
  return (
    <div
      className={clx(
        "border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-300",
        className
      )}
    >
      {/* Header - always visible */}
      <div
        className={clx(
          "flex items-center justify-between p-4 transition-colors",
          {
            "bg-white": isExpanded || isComplete,
            "bg-gray-50": !isExpanded && !isComplete,
          }
        )}
      >
        <div className="flex items-center gap-3">
          {/* Checkmark for completed sections */}
          {isComplete && !isExpanded && (
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {/* Section number for incomplete, not expanded sections */}
          {!isComplete && !isExpanded && (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="sr-only">Not completed</span>
            </div>
          )}

          <h3
            className={clx("text-lg font-medium transition-colors", {
              "text-gray-900": isExpanded || isComplete,
              "text-gray-400": !isExpanded && !isComplete,
            })}
          >
            {title}
          </h3>
        </div>

        {/* Edit button - shows when collapsed and complete */}
        {!isExpanded && isComplete && (
          <button
            onClick={onEdit}
            className="text-Gold hover:text-Gold/80 text-sm font-medium transition-colors"
            type="button"
          >
            Edit
          </button>
        )}
      </div>

      {/* Summary - shows when collapsed and complete */}
      {!isExpanded && isComplete && summary && (
        <div className="px-4 pb-4 text-sm text-gray-600 -mt-2">{summary}</div>
      )}

      {/* Content - shows when expanded */}
      <div
        className={clx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          {
            "max-h-[2000px] opacity-100": isExpanded,
            "max-h-0 opacity-0": !isExpanded,
          }
        )}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}
