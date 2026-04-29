"use client"

import { useEffect, useRef, useState } from "react"

type CollectionDescriptionProps = {
  text: string
  // Whether the description renders on a dark hero (white text + lighter
  // accent for the toggle) vs. on a light page background (Charcoal text).
  variant?: "light" | "dark"
  className?: string
}

const CLAMP_LINES = 3

export default function CollectionDescription({
  text,
  variant = "light",
  className,
}: CollectionDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement | null>(null)

  // Detect whether the clamped text actually overflows its three-line box.
  // Short descriptions don't get a toggle button.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      setOverflows(el.scrollHeight - el.clientHeight > 1)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [text])

  const isDark = variant === "dark"
  const textColor = isDark ? "text-white/90" : "text-Charcoal/80"
  const linkColor = isDark
    ? "text-white underline decoration-white/60 hover:decoration-white"
    : "text-Gold hover:text-Gold/80"

  return (
    <div className={className}>
      <p
        ref={ref}
        className={`text-p-md ${textColor} max-w-5xl mx-auto text-balance transition-[max-height] duration-200`}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: CLAMP_LINES,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`mt-2 text-p-sm font-maison-neue ${linkColor}`}
          aria-expanded={expanded}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  )
}
