import Image from "next/image"
import { generatedSiteImages } from "@lib/content/generated-site-images"
import HeroCta from "@modules/home/components/hero-cta"

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
}

const Hero = ({ data, countryCode = "us" }: HeroProps) => {
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
  const heroImage = data?.BackgroundImage?.url || generatedSiteImages.homeHero

  return (
    <section
      className="min-h-[440px] h-[54vh] max-h-[560px] w-full flex flex-col justify-center items-center relative overflow-hidden"
      aria-labelledby="home-hero-heading"
    >
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="absolute inset-0 object-cover"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,27,35,0.62),rgba(0,27,35,0.26))]"
        aria-hidden="true"
      />
      <div className="text-center px-6 small:p-32 gap-6 flex flex-col items-center relative z-10">
        <div className="max-w-[820px]">
          <p className="mb-4 font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-Gold drop-shadow">
            Premium Kosher Meat, Shipped Frozen to Your Door
          </p>
          <h1
            id="home-hero-heading"
            className="text-white font-gyst text-[28px] sm:text-h1-mobile md:text-h1 leading-[1.1] text-balance drop-shadow-lg"
          >
            {data?.HeroTitle}
          </h1>
        </div>
        <HeroCta
          countryCode={countryCode}
          editorialText={data?.CTAButton?.Text}
          editorialHref={data?.CTAButton?.Url}
        />
      </div>
    </section>
  )
}

export default Hero
