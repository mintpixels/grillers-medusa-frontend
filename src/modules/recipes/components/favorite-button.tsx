"use client"

import { useState, useTransition } from "react"
import { toggleFavoriteRecipe } from "@lib/data/favorites"
import LoginPromptModal from "./login-prompt-modal"

type FavoriteButtonProps = {
  recipeSlug: string
  recipeTitle: string
  initialFavorited?: boolean
  isLoggedIn: boolean
  variant?: "icon" | "button"
  className?: string
}

export default function FavoriteButton({
  recipeSlug,
  recipeTitle,
  initialFavorited = false,
  isLoggedIn,
  variant = "button",
  className = "",
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    // If not logged in, show login prompt
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    // Toggle favorite
    startTransition(async () => {
      setError(null)
      const result = await toggleFavoriteRecipe(recipeSlug, recipeTitle)
      
      if (result.success) {
        setIsFavorited(result.isFavorited)
      } else {
        setError(result.error || "Failed to update favorite")
      }
    })
  }

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-6 h-6 transition-colors ${
        filled ? "fill-red-500 stroke-red-500" : "fill-transparent stroke-current"
      }`}
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  )

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`p-2 rounded-full transition-all hover:bg-gray-100 disabled:opacity-50 ${className}`}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          title={isFavorited ? "Remove from favorites" : "Save to favorites"}
        >
          {isPending ? (
            <svg className="animate-spin w-6 h-6 text-gray-400" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <HeartIcon filled={isFavorited} />
          )}
        </button>

        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="Sign in to save your favorite recipes"
        />

        {error && (
          <span className="text-xs text-red-500 ml-2">{error}</span>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all disabled:opacity-50 ${
          isFavorited
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-gray-100 text-Charcoal hover:bg-gray-200"
        } ${className}`}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        {isPending ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <HeartIcon filled={isFavorited} />
        )}
        <span className="text-sm font-medium">
          {isFavorited ? "Saved" : "Save Recipe"}
        </span>
      </button>

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Sign in to save your favorite recipes"
      />

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </>
  )
}

