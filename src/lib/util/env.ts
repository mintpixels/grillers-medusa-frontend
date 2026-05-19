const normalizeBaseUrl = (value: string) => {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return withProtocol.replace(/\/$/, "")
}

export const CANONICAL_PRODUCTION_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_CANONICAL_BASE_URL ||
    process.env.NEXT_PUBLIC_PRODUCTION_BASE_URL ||
    "https://grillers-medusa-frontend.vercel.app"
)

export const LEGACY_PRODUCTION_HOST = "grillerspride.com"

const getProductionHosts = () => {
  const canonicalHost = new URL(CANONICAL_PRODUCTION_URL).hostname.toLowerCase()

  return new Set([
    canonicalHost,
    `www.${canonicalHost}`,
    LEGACY_PRODUCTION_HOST,
    `www.${LEGACY_PRODUCTION_HOST}`,
  ])
}

/**
 * Returns the configured public base URL (no trailing slash).
 *
 * Order of precedence:
 * 1. `NEXT_PUBLIC_BASE_URL` - explicit override
 * 2. canonical production URL when `VERCEL_ENV=production`
 * 3. `NEXT_PUBLIC_VERCEL_URL` or `VERCEL_URL` - Vercel preview URL
 * 4. `http://localhost:8000` - local dev fallback
 *
 * The prior fallback was `https://grillerspride.com`, which baked the legacy
 * production assumption into every environment and produced wrong canonicals
 * + leaked the prod domain into Vercel preview metadata. See issue #45.
 */
export const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL)
  }
  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_PRODUCTION_URL
  }
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL
  if (vercelUrl) {
    return normalizeBaseUrl(vercelUrl)
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
    return getProductionHosts().has(host)
  } catch {
    return false
  }
}
