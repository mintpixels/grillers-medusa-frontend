"use client"

import { useRef, ReactNode } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"

type LazySectionProps = {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  className?: string
  minHeight?: string
}

/**
 * Lazy loading wrapper for below-the-fold sections
 * Uses Intersection Observer to defer rendering until section is near viewport
 */
export default function LazySection({
  children,
  fallback,
  rootMargin = "200px",
  className = "",
  minHeight = "400px",
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(ref, rootMargin)

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
