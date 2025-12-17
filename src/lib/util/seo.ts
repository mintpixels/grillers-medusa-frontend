import { listRegions } from "@lib/data/regions"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

/**
 * Generate canonical URL for a page
 * Strips unnecessary query params but preserves pagination
 */
export function getCanonicalUrl(
  path: string,
  countryCode: string,
  options?: {
    preserveParams?: string[]
    searchParams?: Record<string, string | undefined>
  }
): string {
  // Clean the path (remove leading slash if present, we'll add it)
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  
  // Build the canonical URL
  let canonicalUrl = `${BASE_URL}/${countryCode}${cleanPath}`

  // Optionally preserve specific query params (like page for pagination)
  if (options?.preserveParams && options.searchParams) {
    const params = new URLSearchParams()
    options.preserveParams.forEach((param) => {
      const value = options.searchParams?.[param]
      if (value) {
        params.set(param, value)
      }
    })
    const queryString = params.toString()
    if (queryString) {
      canonicalUrl += `?${queryString}`
    }
  }

  return canonicalUrl
}

/**
 * Generate hreflang alternates for multi-region support
 * Returns an object compatible with Next.js Metadata alternates.languages
 */
export async function getHreflangAlternates(
  path: string
): Promise<Record<string, string>> {
  const regions = await listRegions()
  
  if (!regions || regions.length === 0) {
    return {}
  }

  const alternates: Record<string, string> = {}

  // Build alternates for each region/country
  regions.forEach((region) => {
    region.countries?.forEach((country) => {
      if (country.iso_2) {
        // Use language-COUNTRY format (e.g., en-US, en-CA)
        // For now, assume English for all regions
        const locale = `en-${country.iso_2.toUpperCase()}`
        alternates[locale] = `${BASE_URL}/${country.iso_2}${path}`
      }
    })
  })

  // Add x-default pointing to default region
  alternates["x-default"] = `${BASE_URL}/${DEFAULT_REGION}${path}`

  return alternates
}

/**
 * Generate complete alternates object for Next.js Metadata
 * Includes both canonical and hreflang
 */
export async function getSeoAlternates(
  path: string,
  countryCode: string,
  options?: {
    preserveParams?: string[]
    searchParams?: Record<string, string | undefined>
  }
): Promise<{
  canonical: string
  languages: Record<string, string>
}> {
  const canonical = getCanonicalUrl(path, countryCode, options)
  const languages = await getHreflangAlternates(path)

  return {
    canonical,
    languages,
  }
}

/**
 * Simplified helper that returns metadata-ready alternates
 */
export async function generateAlternates(
  path: string,
  countryCode: string,
  options?: {
    preserveParams?: string[]
    searchParams?: Record<string, string | undefined>
  }
) {
  const canonical = getCanonicalUrl(path, countryCode, options)
  const languages = await getHreflangAlternates(path)

  return {
    canonical,
    languages,
  }
}

