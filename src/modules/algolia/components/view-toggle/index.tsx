"use client"

import { clsx } from "clsx"

type ViewMode = "grid" | "list"

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

const ViewToggle = ({ viewMode, onViewModeChange }: ViewToggleProps) => {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onViewModeChange("grid")}
        className={clsx(
          "flex items-center justify-center w-10 h-10 rounded-md transition-all",
          viewMode === "grid"
            ? "bg-white text-Charcoal shadow-sm"
            : "text-gray-500 hover:text-Charcoal"
        )}
        aria-label="Grid view"
        title="Grid view"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange("list")}
        className={clsx(
          "flex items-center justify-center w-10 h-10 rounded-md transition-all",
          viewMode === "list"
            ? "bg-white text-Charcoal shadow-sm"
            : "text-gray-500 hover:text-Charcoal"
        )}
        aria-label="List view"
        title="List view"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="3" width="16" height="3" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="8.5" width="16" height="3" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="14" width="16" height="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  )
}

export default ViewToggle
export type { ViewMode }