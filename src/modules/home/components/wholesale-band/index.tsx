import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const WholesaleBand: React.FC = () => {
  return (
    <section
      aria-label="Wholesale and catering"
      className="bg-Charcoal text-Scroll"
    >
      <div className="content-container py-12 md:py-20">
        {/* Mobile (<lg): single line link */}
        <div className="lg:hidden text-center">
          <p className="text-p-md font-maison-neue text-Scroll/85">
            Catering, restaurant, or congregation?{" "}
            <LocalizedClientLink
              href="/contact#wholesale"
              className="text-Gold font-semibold underline-offset-4 hover:underline"
            >
              Wholesale pricing →
            </LocalizedClientLink>
          </p>
        </div>

        {/* Desktop (>=lg): full two-column band */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="text-[11px] tracking-[2px] uppercase text-Gold font-rexton font-bold mb-4">
              For caterers · restaurants · congregations
            </div>
            <h2 className="text-h2 font-rexton text-Scroll leading-tight mb-5">
              Volume orders, standing accounts, custom packaging.
            </h2>
            <p className="text-p-md font-maison-neue text-Scroll/85 leading-relaxed mb-3 max-w-[600px]">
              If you order in volume — Friday-night dinners for a synagogue,
              weekly catering, restaurant supply, school lunch programs,
              simchas — we'd love to talk.
            </p>
            <p className="text-p-md font-maison-neue text-Scroll/70 max-w-[600px]">
              Volume pricing &middot; Standing orders &middot; Net-30 terms
              &middot; Custom packaging
            </p>
          </div>

          <div className="lg:col-span-5 flex justify-start lg:justify-end">
            <LocalizedClientLink
              href="/contact#wholesale"
              className="inline-flex items-center gap-3 px-8 py-4 bg-Gold text-Charcoal font-rexton text-h6 font-bold uppercase tracking-wide hover:bg-Gold/90 transition-colors rounded-[5px]"
            >
              Get wholesale pricing
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WholesaleBand
