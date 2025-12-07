// import { Suspense } from "react"
// import { listRegions } from "@lib/data/regions"
// import { StoreRegion } from "@medusajs/types"
// import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import CartButton from "@modules/layout/components/cart-button"
// import SideMenu from "@modules/layout/components/side-menu"
import { HeaderNavQuery } from "@lib/data/strapi/header"
import type { HeaderNavLink } from "@lib/data/strapi/header"
import strapiClient from "@lib/strapi"
import AnnouncementBarProvider from "@/components/announcement-bar-provider"
import Header from "./header"
import Menu from "./menu"

export default async function Nav() {
  const navLinksData: any = await strapiClient.request(HeaderNavQuery)
  const navLinks: HeaderNavLink[] = navLinksData?.header?.HeaderNav || []

  return (
    <>
      <AnnouncementBarProvider />
      <Header navLinks={navLinks} />
      <Menu navLinks={navLinks} />
    </>
  )
}
