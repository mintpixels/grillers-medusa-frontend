"use client"

import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { trackRecipeClick } from "@lib/gtm"

type RecipeCardLinkProps = {
  href: string
  listName: string
  recipe: {
    id?: string
    slug: string
    title: string
    position?: number
  }
  className?: string
  children: React.ReactNode
}

export default function RecipeCardLink({
  href,
  listName,
  recipe,
  className,
  children,
}: RecipeCardLinkProps) {
  return (
    <LocalizedClientLink
      href={href}
      className={className}
      onClick={() => trackRecipeClick({ listName, recipe })}
    >
      {children}
    </LocalizedClientLink>
  )
}
