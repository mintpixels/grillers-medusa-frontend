import strapiClient from "@lib/strapi"
import { GetAnalyticsQuery, type AnalyticsData } from "@lib/data/strapi/analytics"
import ConditionalGTMScript from "./conditional-gtm-script"

async function getAnalyticsConfig(): Promise<AnalyticsData | null> {
  try {
    const data = await strapiClient.request<AnalyticsData>({
      document: GetAnalyticsQuery,
    })
    return data
  } catch (error) {
    console.error("Error fetching analytics config:", error)
    return null
  }
}

export default async function AnalyticsProvider() {
  const analyticsData = await getAnalyticsConfig()
  const config = analyticsData?.analytic

  // Don't load if analytics is disabled or no GTM ID
  if (!config?.EnableAnalytics || !config?.GTMContainerID) {
    return null
  }

  return (
    <ConditionalGTMScript
      gtmId={config.GTMContainerID}
      ga4Id={config.GA4MeasurementID}
      enabled={config.EnableAnalytics}
      debug={config.DebugMode}
    />
  )
}

