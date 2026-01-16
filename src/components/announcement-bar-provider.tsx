import strapiClient from "@lib/strapi"
import {
  GetAnnouncementBarQuery,
  type AnnouncementBarData,
} from "@lib/data/strapi/announcement"
import AnnouncementBar from "./announcement-bar"

async function getAnnouncementBarConfig(): Promise<AnnouncementBarData | null> {
  try {
    const data = await strapiClient.request<AnnouncementBarData>({
      document: GetAnnouncementBarQuery,
    })
    return data
  } catch (error) {
    console.error("Error fetching announcement bar config:", error)
    return null
  }
}

export default async function AnnouncementBarProvider() {
  const announcementData = await getAnnouncementBarConfig()
  const config = announcementData?.announcementBar

  // Don't show if disabled or no config
  if (!config || !config.Enabled) {
    return null
  }

  return (
    <AnnouncementBar
      message={config.Message}
      linkUrl={config.LinkURL}
      linkText={config.LinkText}
      backgroundColor={config.BackgroundColor}
      textColor={config.TextColor}
      startDate={config.StartDate}
      endDate={config.EndDate}
      dismissible={config.Dismissible}
    />
  )
}





