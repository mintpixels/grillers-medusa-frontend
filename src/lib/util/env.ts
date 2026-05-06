/**
 * The canonical production hostname for Grillers Pride. Anything else is
 * treated as a non-production environment (Vercel preview, localhost, etc.)
 * for SEO purposes — those environments emit `noindex` so they can't compete
 * with the prod site in search results. Update this if the prod domain ever
 * changes.
 */
export const PRODUCTION_HOST = "grillerspride.com"

/**
 * Returns the configured public base URL (no trailing slash).
 *
 * Order of precedence:
 * 1. `NEXT_PUBLIC_BASE_URL` — explicit override (set per-environment in Vercel)
 * 2. `NEXT_PUBLIC_VERCEL_URL` — Vercel's auto-injected preview/branch URL
 * 3. `http://localhost:8000` — local dev fallback
 *
 * The prior fallback was `https://grillerspride.com`, which baked the legacy
 * production assumption into every environment and produced wrong canonicals
 * + leaked the prod domain into Vercel preview metadata. See issue #45.
 */
export const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    // Vercel injects this without a protocol
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, "")}`
  }
  return "http://localhost:8000"
}

/**
 * True only when the resolved base URL points at the canonical production
 * host. Used to gate `noindex` on staging / preview / local so search engines
 * don't index those environments and split ranking signals. See issue #45.
 */
export const isProductionHost = () => {
  try {
    const host = new URL(getBaseURL()).hostname.toLowerCase()
    return host === PRODUCTION_HOST || host === `www.${PRODUCTION_HOST}`
  } catch {
    return false
  }
}
