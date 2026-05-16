// Cookie consent utilities

export type ConsentPreferences = {
  analytics: boolean
  marketing: boolean
  timestamp: number
}

const CONSENT_COOKIE_NAME = "cookie_consent"
const CONSENT_COOKIE_EXPIRY_DAYS = 365

export function getConsentCookie(): ConsentPreferences | null {
  if (typeof document === "undefined") return null

  let cookie: string | undefined
  try {
    cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
  } catch {
    return null
  }

  if (!cookie) return null

  try {
    const equalsIndex = cookie.indexOf("=")
    const value = equalsIndex >= 0 ? cookie.slice(equalsIndex + 1) : ""
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
}

export function setConsentCookie(preferences: ConsentPreferences): void {
  if (typeof document === "undefined") return

  try {
    const expires = new Date()
    expires.setDate(expires.getDate() + CONSENT_COOKIE_EXPIRY_DAYS)

    const cookieValue = encodeURIComponent(JSON.stringify(preferences))
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : ""
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`
  } catch {
    // Consent UI should never break browsing if storage is unavailable.
  }
}

export function hasConsent(category: "analytics" | "marketing"): boolean {
  const consent = getConsentCookie()
  if (!consent) return false
  return consent[category] === true
}

export function hasAnyConsent(): boolean {
  return getConsentCookie() !== null
}

export function acceptAllCookies(): void {
  setConsentCookie({
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
  })
}

export function rejectAllCookies(): void {
  setConsentCookie({
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
  })
}




