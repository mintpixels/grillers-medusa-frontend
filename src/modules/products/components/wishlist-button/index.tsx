"use client"

import { useState, useTransition } from "react"
import { toggleWishlist } from "@lib/data/wishlist"

type WishlistButtonProps = {
  productId: string
  productHandle: string
  title: string
  thumbnail?: string
  initialWishlisted?: boolean
  variant?: "icon" | "button"
  className?: string
}

export default function WishlistButton({
  productId,
  productHandle,
  title,
  thumbnail,
  initialWishlisted = false,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleWishlist(productId, productHandle, title, thumbnail)
      if (result.success) {
        setIsWishlisted(result.isWishlisted)
      }
    })
  }

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-6 h-6 transition-colors ${
        filled ? "text-red-500 fill-current" : "text-Charcoal"
      }`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )

  if (variant === "button") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-2 px-4 py-2 border border-Charcoal/20 rounded-[5px] text-p-sm font-maison-neue text-Charcoal hover:bg-Charcoal/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold disabled:opacity-50 ${className}`}
        aria-label={isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
        aria-pressed={isWishlisted}
      >
        <HeartIcon filled={isWishlisted} />
        <span>{isWishlisted ? "Saved" : "Save"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2 rounded-full hover:bg-Charcoal/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold disabled:opacity-50 ${className}`}
      aria-label={isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
      aria-pressed={isWishlisted}
    >
      <HeartIcon filled={isWishlisted} />
    </button>
  )
}
