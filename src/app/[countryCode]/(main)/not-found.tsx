import { Metadata } from "next"
import Link from "next/link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Page Not Found | Grillers Pride",
  description:
    "The page you're looking for doesn't exist. Browse the counter, find a recipe, or get in touch.",
  robots: { index: false, follow: false },
}

const COLLECTIONS = [
  {
    label: "Beef",
    href: "/collections/kosher-beef",
    description: "Brisket, chuck, ribeye, ground.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 26c0-7 6-13 14-13s14 6 14 13c0 5-3 9-7 11l-1 5h-12l-1-5c-4-2-7-6-7-11z" />
        <path d="M18 24c0-2 2-3 4-3M28 25c1-1 3-1 4 0" />
      </svg>
    ),
  },
  {
    label: "Chicken",
    href: "/collections/kosher-chicken",
    description: "Wings, breasts, drumsticks, whole.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 30c-3-3-3-9 0-12s8-3 11 0l8 8c3 3 3 8 0 11s-8 3-11 0" />
        <path d="M22 26l-8 8-3-1 1 3-4 4M19 33l3 3" />
      </svg>
    ),
  },
  {
    label: "Lamb & Veal",
    href: "/collections/kosher-lamb",
    description: "Chops, shanks, scallopini.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 12l4 14M32 12l-4 14M22 12h4M14 26h20l-2 12H16z" />
      </svg>
    ),
  },
  {
    label: "Prepared & Provisions",
    href: "/collections/prepared-and-provisions",
    description: "Heat-and-serve, sausages, deli.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="14" width="28" height="22" rx="3" />
        <path d="M16 14V9M24 14V9M32 14V9M10 22h28" />
      </svg>
    ),
  },
]

const TRUST_ITEMS = [
  {
    title: "Glatt Kosher",
    body: "AKC supervised since 2002.",
  },
  {
    title: "72-hr Cold Chain",
    body: "Engineered shipper from dock to door.",
  },
  {
    title: "Family-Owned",
    body: "Family-run from Doraville.",
  },
]

const HELPFUL_LINKS = [
  {
    label: "Bestsellers",
    href: "/#bestsellers",
    description: "What's flying off the counter this week.",
  },
  {
    label: "Recipes",
    href: "/recipes",
    description: "Cooking inspiration from our kitchen.",
  },
  {
    label: "Customer Service",
    href: "/customer-service",
    description: "FAQ, returns, hours, contact.",
  },
]

export default function NotFound() {
  return (
    <>
      {/* Hero — branded, dramatic */}
      <section className="bg-Charcoal text-white relative overflow-hidden">
        {/* Decorative gold accent rings */}
        <div
          aria-hidden="true"
          className="absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full border border-Gold/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-48 -left-24 w-[420px] h-[420px] rounded-full border border-Gold/10"
        />

        <div className="content-container py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.25em] text-Gold mb-5">
              Error 404
            </p>
            <h1 className="text-h1-mobile md:text-h1 font-gyst leading-[1.05] mb-6">
              We can&apos;t find that cut.
            </h1>
            <p className="text-p-md md:text-p-lg text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
              The page or product you&apos;re after isn&apos;t here — it may
              have moved, sold out, or never existed. Try a search, or jump
              into one of the counters below.
            </p>

            {/* Search bar — server-rendered form posts to /search */}
            <form
              action="/us/search"
              method="GET"
              className="max-w-xl mx-auto mb-6"
              role="search"
            >
              <label htmlFor="not-found-search" className="sr-only">
                Search products
              </label>
              <div className="flex gap-2">
                <input
                  id="not-found-search"
                  type="search"
                  name="q"
                  placeholder="Search for brisket, wings, lamb chops…"
                  className="flex-1 h-12 px-4 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-Gold focus:bg-white/15"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="h-12 px-6 bg-Gold text-Charcoal font-maison-neue font-bold text-p-sm uppercase tracking-wide rounded-md hover:bg-Gold/90 transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </form>

            <p className="text-p-sm text-white/50">
              Or{" "}
              <LocalizedClientLink
                href="/store"
                className="text-Gold hover:text-Gold/80 underline underline-offset-2"
              >
                shop the full counter →
              </LocalizedClientLink>
            </p>
          </div>
        </div>
      </section>

      {/* Counter shortcuts — visual cards, no wrapping buttons */}
      <section
        aria-labelledby="nf-counters"
        className="bg-Scroll/40 border-b border-Charcoal/10"
      >
        <div className="content-container py-14 md:py-20">
          <div className="text-center mb-10">
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.25em] text-Charcoal/50 mb-3">
              Jump to a counter
            </p>
            <h2
              id="nf-counters"
              className="text-h2-mobile md:text-h2 font-gyst text-Charcoal"
            >
              Where would you like to go?
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {COLLECTIONS.map((c) => (
              <LocalizedClientLink
                key={c.href}
                href={c.href}
                className="group flex flex-col items-center text-center bg-white border border-Charcoal/10 rounded-xl p-6 md:p-8 transition-all hover:border-Gold hover:shadow-lg"
              >
                <span
                  aria-hidden="true"
                  className="w-14 h-14 md:w-16 md:h-16 mb-4 flex items-center justify-center text-Gold transition-transform group-hover:scale-110"
                >
                  <span className="block w-full h-full">{c.icon}</span>
                </span>
                <span className="font-gyst font-bold text-h5 md:text-h4 text-Charcoal mb-2">
                  {c.label}
                </span>
                <span className="text-p-sm text-Charcoal/60 mb-4">
                  {c.description}
                </span>
                <span className="text-p-sm-mono font-maison-neue-mono uppercase text-xs text-Gold tracking-wider mt-auto">
                  Browse →
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      {/* Trust band — quick reassurance */}
      <section
        aria-label="Why shop Griller's Pride"
        className="bg-white border-b border-Charcoal/10"
      >
        <div className="content-container py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {TRUST_ITEMS.map((t) => (
              <div key={t.title} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-Gold/15 text-Gold flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div>
                  <p className="font-gyst font-bold text-Charcoal">{t.title}</p>
                  <p className="text-p-sm text-Charcoal/70">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help section — two-column: navigation links + contact card */}
      <section className="bg-Scroll/30">
        <div className="content-container py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 max-w-5xl mx-auto">
            {/* Helpful links */}
            <div>
              <h2 className="text-h3-mobile md:text-h3 font-gyst text-Charcoal mb-6">
                Looking for something else?
              </h2>
              <ul className="divide-y divide-Charcoal/10 border-t border-b border-Charcoal/10">
                {HELPFUL_LINKS.map((link) => (
                  <li key={link.href}>
                    <LocalizedClientLink
                      href={link.href}
                      className="flex items-start justify-between gap-4 py-4 group hover:text-Gold transition-colors"
                    >
                      <span>
                        <span className="block font-gyst font-bold text-h5 text-Charcoal group-hover:text-Gold transition-colors">
                          {link.label}
                        </span>
                        <span className="block text-p-sm text-Charcoal/60 mt-1">
                          {link.description}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 mt-1 text-Charcoal/40 group-hover:text-Gold group-hover:translate-x-1 transition-all"
                      >
                        →
                      </span>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact card */}
            <div className="bg-Charcoal text-white rounded-2xl p-8 md:p-10 flex flex-col">
              <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.25em] text-Gold mb-3">
                Still stuck?
              </p>
              <h2 className="text-h3-mobile md:text-h3 font-gyst mb-6">
                Talk to a real person.
              </h2>
              <p className="text-p-md text-white/75 mb-8 leading-relaxed">
                When something&apos;s off, our team picks up the phone. No
                tickets, no chatbots — just call or email and we&apos;ll find
                what you need.
              </p>
              <div className="space-y-4 mb-8">
                <a
                  href="tel:7704548108"
                  className="flex items-center gap-3 text-white hover:text-Gold transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-Gold/15 flex items-center justify-center text-Gold"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-white/50">
                      Phone
                    </span>
                    <span className="block font-semibold">
                      (770) 454-8108
                    </span>
                  </span>
                </a>
                <a
                  href="mailto:peter@grillerspride.com"
                  className="flex items-center gap-3 text-white hover:text-Gold transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-Gold/15 flex items-center justify-center text-Gold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-white/50">
                      Email
                    </span>
                    <span className="block font-semibold break-all">
                      peter@grillerspride.com
                    </span>
                  </span>
                </a>
              </div>
              <LocalizedClientLink
                href="/customer-service"
                className="mt-auto inline-flex items-center justify-center h-12 px-6 bg-Gold text-Charcoal font-maison-neue font-bold text-p-sm uppercase tracking-wide rounded-md hover:bg-Gold/90 transition-colors"
              >
                Visit customer service
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
