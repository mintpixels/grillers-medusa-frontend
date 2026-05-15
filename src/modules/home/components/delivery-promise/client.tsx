"use client"

import { useEffect, useMemo, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { lookupUpsGroundDays } from "@lib/util/eligible-arrival-dates"
import {
  IN_REGION_THRESHOLD,
  NATIONAL_THRESHOLD,
} from "@lib/util/free-shipping"
import { jitsuTrack } from "@lib/jitsu"

type PromiseKind = "empty" | "invalid" | "atlanta" | "ups"

type PromiseResult = {
  kind: PromiseKind
  eyebrow: string
  headline: string
  detail: string
  ctaHref: string
  ctaLabel: string
  badge: string
}

const STORAGE_KEY = "gp_delivery_zip"

function normalizeZip(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5)
}

function pluralizeDays(days: number): string {
  return days === 1 ? "1 business day" : `${days} business days`
}

function getPromise(zip: string, atlantaZipCodes: Set<string>): PromiseResult {
  if (!zip) {
    return {
      kind: "empty",
      eyebrow: "Delivery check",
      headline: "See your cold-chain options before you shop",
      detail: `Atlanta delivery and regional pickup can unlock free delivery at $${IN_REGION_THRESHOLD}. UPS cold-chain shipping is free nationwide at $${NATIONAL_THRESHOLD}.`,
      ctaHref: "/collections/kosher-beef",
      ctaLabel: "Start with beef",
      badge: "ZIP ready",
    }
  }

  if (zip.length !== 5) {
    return {
      kind: "invalid",
      eyebrow: "Delivery check",
      headline: "Enter a 5-digit ZIP code",
      detail: "We will use it to estimate local delivery or UPS cold-chain transit before checkout.",
      ctaHref: "/shipping/ups",
      ctaLabel: "Shipping details",
      badge: "Check ZIP",
    }
  }

  if (atlantaZipCodes.has(zip)) {
    return {
      kind: "atlanta",
      eyebrow: "Local route likely available",
      headline: "Atlanta delivery available for this ZIP",
      detail: `Free local delivery starts at $${IN_REGION_THRESHOLD}. Checkout confirms your exact delivery day and any route minimums before payment.`,
      ctaHref: "/collections/kosher-beef",
      ctaLabel: "Shop local favorites",
      badge: "Atlanta delivery",
    }
  }

  const days = lookupUpsGroundDays(zip)
  return {
    kind: "ups",
    eyebrow: "UPS cold-chain estimate",
    headline: `About ${pluralizeDays(days)} in transit`,
    detail: `Frozen orders ship insulated with dry ice where needed. Free nationwide UPS Ground starts at $${NATIONAL_THRESHOLD}.`,
    ctaHref: "/shipping/ups",
    ctaLabel: "Shipping details",
    badge: "Ships nationwide",
  }
}

export default function DeliveryPromiseClient({
  countryCode,
  atlantaZipCodes,
}: {
  countryCode: string
  atlantaZipCodes: string[]
}) {
  const [zip, setZip] = useState("")
  const [submittedZip, setSubmittedZip] = useState("")
  const atlantaSet = useMemo(
    () => new Set(atlantaZipCodes.map(normalizeZip).filter(Boolean)),
    [atlantaZipCodes]
  )

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const normalized = normalizeZip(saved)
        setZip(normalized)
        setSubmittedZip(normalized)
      }
    } catch {
      // Local storage is a convenience only.
    }
  }, [])

  const result = useMemo(
    () => getPromise(submittedZip, atlantaSet),
    [submittedZip, atlantaSet]
  )

  const submitZip = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = normalizeZip(zip)
    setZip(normalized)
    setSubmittedZip(normalized)
    try {
      if (normalized.length === 5) {
        window.localStorage.setItem(STORAGE_KEY, normalized)
      }
    } catch {
      // Ignore storage failures.
    }
    jitsuTrack("delivery_zip_checked", {
      zip_prefix: normalized.slice(0, 3),
      result_kind: getPromise(normalized, atlantaSet).kind,
      country_code: countryCode,
    })
  }

  return (
    <section className="bg-Scroll border-y border-Charcoal/10">
      <div className="content-container py-7 md:py-9">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="min-w-0">
            <p className="mb-2 font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
              {result.eyebrow}
            </p>
            <h2 className="max-w-2xl font-gyst text-h4 font-bold leading-tight text-Charcoal md:text-h3">
              {result.headline}
            </h2>
            <p className="mt-3 max-w-2xl font-maison-neue text-p-md leading-relaxed text-Charcoal/70">
              {result.detail}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:justify-self-end">
            <form
              onSubmit={submitZip}
              className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,180px)_auto]"
            >
              <label className="min-w-0">
                <span className="sr-only">Delivery ZIP code</span>
                <input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={zip}
                  onChange={(event) => setZip(normalizeZip(event.target.value))}
                  placeholder="ZIP code"
                  className="h-12 w-full min-w-0 rounded-[5px] border border-Charcoal bg-white px-4 font-maison-neue text-p-md text-Charcoal outline-none transition-colors placeholder:text-Charcoal/40 focus:border-Gold focus:ring-2 focus:ring-Gold/30"
                  aria-label="Delivery ZIP code"
                />
              </label>
              <button
                type="submit"
                className="h-12 rounded-[5px] border border-Charcoal bg-Charcoal px-5 font-rexton text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
              >
                Check
              </button>
            </form>

            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
              <span className="inline-flex h-9 items-center rounded-full bg-white px-4 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal shadow-sm ring-1 ring-Charcoal/10">
                {result.badge}
              </span>
              <LocalizedClientLink
                href={result.ctaHref}
                className="inline-flex min-h-[44px] items-center rounded-full bg-Gold px-4 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal shadow-sm ring-1 ring-Charcoal/10 transition-opacity hover:opacity-90"
              >
                {result.ctaLabel}
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-Charcoal/10 pt-5 sm:grid-cols-3">
          {[
            "Fresh frozen inventory, packed for transit",
            "Exact delivery and pickup slots confirmed at checkout",
            "Free thresholds surfaced before payment",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-Gold" />
              <span className="font-maison-neue text-sm leading-snug text-Charcoal/70">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
