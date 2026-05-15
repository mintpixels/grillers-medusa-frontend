"use client"

import { useRef, ReactNode } from "react"
import { useIntersectionOnce } from "@lib/hooks/use-in-view"

type LazySectionProps = {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  className?: string
  minHeight?: string
}

/**
 * Lazy loading wrapper for below-the-fold sections. Once visible, keep
 * children mounted so page height cannot collapse while the user scrolls.
 */
export default function LazySection({
  children,
  fallback,
  rootMargin = "200px",
  className = "",
  minHeight = "400px",
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionOnce(ref, rootMargin)

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        children
      ) : (
        fallback || (
          <div
            className="animate-pulse bg-gray-100"
            style={{ minHeight }}
            aria-hidden="true"
          />
        )
      )}
    </div>
  )
}
