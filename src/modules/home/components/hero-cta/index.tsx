"use client"

import Link from "next/link"
import { useHomePersonalization } from "@modules/home/components/home-personalization/use-home-personalization"

export default function HeroCta({
  countryCode,
  editorialText,
  editorialHref,
}: {
  countryCode: string
  editorialText?: string | null
  editorialHref?: string | null
}) {
  const { isLoggedIn, hasOrders } = useHomePersonalization()
  const fallbackCta =
    isLoggedIn && hasOrders
      ? {
          text: "Reorder your favorites",
          href: `/${countryCode}/account/reorder`,
        }
      : {
          text: "Shop Kosher Beef",
          href: `/${countryCode}/collections/kosher-beef`,
        }
  const ctaText = editorialText || fallbackCta.text
  const ctaHref = editorialHref || fallbackCta.href

  if (!ctaText || !ctaHref) {
    return null
  }

  return (
    <Link
      href={ctaHref}
      className="mt-8 inline-block bg-Gold hover:bg-Gold/90 text-Charcoal font-maison-neue font-bold text-p-md px-8 py-4 rounded-[5px] uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-Gold focus:ring-offset-2 focus:ring-offset-black"
    >
      {ctaText}
    </Link>
  )
}
