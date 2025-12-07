import strapiClient from "@lib/strapi"
import {
  GetCookieConsentQuery,
  type CookieConsentData,
} from "@lib/data/strapi/cookie-consent"
import CookieConsentBanner from "./cookie-consent-banner"

async function getCookieConsentConfig(): Promise<CookieConsentData | null> {
  try {
    const data = await strapiClient.request<CookieConsentData>({
      document: GetCookieConsentQuery,
    })
    return data
  } catch (error) {
    console.error("Error fetching cookie consent config:", error)
    return null
  }
}

export default async function CookieConsentProvider() {
  const consentData = await getCookieConsentConfig()
  const config = consentData?.cookieConsent

  if (!config) {
    return null
  }

  return (
    <CookieConsentBanner
      message={config.BannerMessage}
      acceptText={config.AcceptButtonText}
      rejectText={config.RejectButtonText}
      preferencesText={config.PreferencesButtonText}
      privacyLink={config.PrivacyPolicyLink}
      categories={config.CookieCategories}
      position={config.Position}
      backgroundColor={config.BackgroundColor}
      textColor={config.TextColor}
    />
  )
}

