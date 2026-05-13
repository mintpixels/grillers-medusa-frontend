import Link from "next/link"

type HeroProps = {
  data: {
    HeroTitle: string
    BackgroundImage: {
      url: string
    }
    CTAButton?: {
      Text: string
      Url: string
    }
  }
  countryCode?: string
  // Customer state used to render a state-conditional CTA (#57). Strapi's
  // CTAButton (if set) overrides — editorial control wins.
  isLoggedIn?: boolean
  hasOrders?: boolean
}

const Hero = ({ data, countryCode = "us", isLoggedIn, hasOrders }: HeroProps) => {
  // Strapi-managed CTA wins when set; otherwise pick a state-conditional
  // default so every visitor has a clear next action.
  //
  // Two-state split — same destination on web + mobile so there's no
  // platform inconsistency:
  //   1. Returning customer (logged-in AND has orders) → /account/reorder
  //      ("Reorder your favorites"). They know what they want; surface
  //      their last cart in one tap.
  //   2. Everyone else (new visitor OR logged-in-no-orders) → a curated
  //      category, NOT /store. /store dumps users on the everything-page
  //      with every filter expanded — half a dozen scrolls before any
  //      product is visible. Kosher Beef is the highest-revenue lane
  //      (per QBD margin leaderboard) and a clean editorial landing.
  //      "Browse Bestsellers" → #bestsellers wasn't helping either —
  //      the bestsellers row sits one section below the hero already.
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
  const ctaText = data?.CTAButton?.Text || fallbackCta.text
  const ctaHref = data?.CTAButton?.Url || fallbackCta.href

  return (
    <section
      className="h-[65vh] max-h-[673px] w-full bg-no-repeat bg-center bg-cover flex flex-col justify-center items-center relative"
      role="img"
      aria-label="Hero banner featuring premium kosher meats"
      style={{
        backgroundImage: `url('${data?.BackgroundImage?.url}')`,
      }}
    >
      {/* Dark overlay for text contrast - ensures WCAG AA compliance */}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="text-center px-6 small:p-32 gap-6 flex flex-col items-center relative z-10">
        <div className="max-w-[820px]">
          <h1 className="text-white font-gyst text-[28px] sm:text-h1-mobile md:text-h1 leading-[1.1] text-balance drop-shadow-lg">
            {data?.HeroTitle}
          </h1>
        </div>
        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-8 inline-block bg-Gold hover:bg-Gold/90 text-Charcoal font-maison-neue font-bold text-p-md px-8 py-4 rounded-[5px] uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-Gold focus:ring-offset-2 focus:ring-offset-black"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  )
}

export default Hero
