import React from "react"
import { HttpTypes } from "@medusajs/types"

type TrustBandProps = {
  customer?: HttpTypes.StoreCustomer | null
  // Phone is plumbed from the same Strapi header config the desktop nav uses,
  // so a single source of truth for the brand phone number.
  phoneNumber?: string | null
}

// In-region states qualifying for the $250 free-delivery threshold
// (GA + neighboring Southeast). Eventually this should come from the
// Strapi `shipping-setting` single type — see #19. Hardcoded here so the
// trust band can ship before that schema work is done.
const IN_REGION_STATES = ["GA", "TN", "TX", "NC", "FL", "SC", "AL"] as const
const IN_REGION_THRESHOLD = 250
const NATIONAL_THRESHOLD = 500

const Pill: React.FC<{
  icon: React.ReactNode
  children: React.ReactNode
  href?: string
}> = ({ icon, children, href }) => {
  const className =
    "flex items-center gap-2.5 text-Charcoal text-p-sm font-maison-neue leading-snug"
  if (href) {
    return (
      <a href={href} className={`${className} hover:text-Gold transition-colors`}>
        <span aria-hidden="true" className="shrink-0 text-Gold">
          {icon}
        </span>
        <span>{children}</span>
      </a>
    )
  }
  return (
    <div className={className}>
      <span aria-hidden="true" className="shrink-0 text-Gold">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  )
}

export default function TrustBand({ customer, phoneNumber }: TrustBandProps) {
  const defaultShipping =
    customer?.addresses?.find((a) => a.is_default_shipping) ||
    customer?.addresses?.[0]
  const shipState = (defaultShipping?.province || "").toUpperCase()
  const isInRegion =
    !!shipState &&
    (IN_REGION_STATES as readonly string[]).includes(shipState)
  const isOutOfRegion = !!shipState && !isInRegion

  let shippingPill: string
  if (isInRegion) {
    shippingPill = `Free delivery over $${IN_REGION_THRESHOLD} in your area`
  } else if (isOutOfRegion) {
    shippingPill = `Free shipping over $${NATIONAL_THRESHOLD} nationwide`
  } else {
    shippingPill = `Free delivery over $${IN_REGION_THRESHOLD} in-region · Free shipping over $${NATIONAL_THRESHOLD} nationwide`
  }

  const phoneDigits = phoneNumber?.replace(/\D/g, "") || "7704548108"
  const phoneDisplay = phoneNumber || "(770) 454-8108"

  return (
    <section
      aria-label="Why shop Griller's Pride"
      className="bg-Scroll border-y border-Charcoal/10"
    >
      <div className="content-container py-5 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-center">
          <Pill
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V5l-8-3z" />
              </svg>
            }
          >
            <span>
              <strong>Glatt Kosher</strong> · AKC supervised since 2002
            </span>
          </Pill>
          <Pill
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13l5 5v6h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3V7z" />
              </svg>
            }
          >
            {shippingPill}
          </Pill>
          <Pill
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" />
              </svg>
            }
          >
            <span>
              <strong>Family-owned</strong>, family-run from Doraville
            </span>
          </Pill>
          <Pill
            href={`tel:${phoneDigits}`}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            }
          >
            <span>
              <strong>{phoneDisplay}</strong> — we still answer
            </span>
          </Pill>
        </div>
      </div>
    </section>
  )
}
