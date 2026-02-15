import { listRegions } from "@lib/data/regions"
import { HeaderNavQuery } from "@lib/data/strapi/header"
import type { HeaderNavLink } from "@lib/data/strapi/header"
import strapiClient from "@lib/strapi"
import AnnouncementBarProvider from "../../../../components/announcement-bar-provider"
import Header from "./header"
import Menu from "./menu"

export default async function Nav() {
  const navLinksData: any = await strapiClient.request(HeaderNavQuery)
  const navLinks: HeaderNavLink[] = navLinksData?.header?.HeaderNav || []
  const phoneNumber: string | null = navLinksData?.header?.PhoneNumber || null

  // Fetch regions for country selector
  const regions = await listRegions()

  return (
    <>
      <AnnouncementBarProvider />
      <Header navLinks={navLinks} regions={regions || []} phoneNumber={phoneNumber} />
      <Menu navLinks={navLinks} />
    </>
  )
}
