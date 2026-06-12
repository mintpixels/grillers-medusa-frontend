import { emitStorefrontOpsAlert } from "@lib/ops-alert"

export async function emitFallbackHomepageOpsAlert({
  countryCode,
  hasStrapiData,
  hasGlobalData,
}: {
  countryCode: string
  hasStrapiData: boolean
  hasGlobalData: boolean
}) {
  return emitStorefrontOpsAlert({
    alertKind: "fallback_homepage_rendered",
    title: `Fallback homepage rendered for ${countryCode}`,
    path: "src/app/[countryCode]/(main)/page.tsx",
    meta: {
      country_code: countryCode,
      has_strapi_data: hasStrapiData,
      has_global_data: hasGlobalData,
    },
  })
}
