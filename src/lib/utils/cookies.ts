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

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))

  if (!cookie) return null

  try {
    const value = cookie.split("=")[1]
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
}

export function setConsentCookie(preferences: ConsentPreferences): void {
  if (typeof document === "undefined") return

  const expires = new Date()
  expires.setDate(expires.getDate() + CONSENT_COOKIE_EXPIRY_DAYS)

  const cookieValue = encodeURIComponent(JSON.stringify(preferences))
  document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
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

