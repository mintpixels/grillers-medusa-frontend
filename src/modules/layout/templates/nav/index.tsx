import { listRegions } from "@lib/data/regions"
import { HeaderNavQuery } from "@lib/data/strapi/header"
import type { HeaderNavLink } from "@lib/data/strapi/header"
import type { HttpTypes } from "@medusajs/types"
import strapiClient from "@lib/strapi"
import { countsForNavUrls } from "@lib/data/strapi/nav-counts"
import AnnouncementBarProvider from "../../../../components/announcement-bar-provider"
import Header from "./header"
import Menu from "./menu"

type NavProps = {
  customer?: HttpTypes.StoreCustomer | null
}

export default async function Nav({ customer }: NavProps = {}) {
  const navLinksData: any = await strapiClient.request(HeaderNavQuery)
  const navLinks: HeaderNavLink[] = navLinksData?.header?.HeaderNav || []
  const phoneNumber: string | null = navLinksData?.header?.PhoneNumber || null

  const regions = await listRegions()

  // Live count badge per nav link — derived from Strapi product→tag data,
  // mirroring the storefront's `containsi` filter so the badge matches what
  // the user lands on after clicking. Cached for 5 min on the server side.
  const navUrls = Array.from(
    new Set(
      navLinks.flatMap((link) =>
        (link.sections ?? []).flatMap((s) =>
          (s.items ?? []).map((i) => i.Url).filter(Boolean) as string[],
        ),
      ),
    ),
  )
  const navCounts = await countsForNavUrls(navUrls).catch(() => ({}))

  return (
    <>
      <AnnouncementBarProvider />
      <Header navLinks={navLinks} regions={regions || []} phoneNumber={phoneNumber} customer={customer} navCounts={navCounts} />
      <Menu navLinks={navLinks} navCounts={navCounts} />
    </>
  )
}
