import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import HeaderCountrySelect from "@modules/layout/components/header-country-select"
import Image from "next/image"
import type { HeaderNavLink } from "@lib/data/strapi/header"
import type { HttpTypes } from "@medusajs/types"
import { MobileNavMenu } from "./menu"
import SearchBar from "./search-bar"
import MobileSearch from "./mobile-search"

type HeaderProps = {
  navLinks: HeaderNavLink[]
  regions: HttpTypes.StoreRegion[]
}

const Header = ({ navLinks, regions }: HeaderProps) => {
  return (
    <header className="sticky top-0 inset-x-0 z-20 bg-white border-b border-[#000/25]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:border focus:border-black focus:rounded"
      >
        Skip to main content
      </a>
      <nav className="flex items-center justify-between w-full h-[106px] px-4 lg:px-8">
        <MobileNavMenu navLinks={navLinks} />

        <div className="flex items-center gap-4">
          <LocalizedClientLink href="/" data-testid="nav-store-link">
            <Image
              className="hidden md:block"
              src={"/images/logos/logo-horizontal.svg"}
              alt="logo"
              width={256}
              height={24}
              quality={100}
              priority
            />
            <Image
              className="md:hidden"
              src={"/images/logos/logo-mobile.svg"}
              alt="logo"
              width={82}
              height={36}
              quality={100}
              priority
            />
          </LocalizedClientLink>
        </div>

        {/* Search Bar */}
        <div className="hidden md:block w-1/2 max-w-[558px] h-[50px] mx-4">
          <SearchBar />
          {/* <input
            type="search"
            placeholder="Search..."
            className="w-full h-full border rounded-[5px] border-Charcoal px-5 py-3 focus:outline-none focus:border-gray-500 text-p-md text-Pewter"
          /> */}
        </div>

        <div className="flex items-center gap-8">
          {/* Country Selector - Desktop */}
          <div className="hidden md:block">
            <HeaderCountrySelect regions={regions} />
          </div>

          <a href="tel:+18886273284" className="hidden md:inline-block text-p-md font-maison-neue text-Charcoal hover:underline">
            (888) 627-3284
          </a>

          <div className="flex items-center gap-4">
            {/* Mobile Search */}
            <MobileSearch />

            <div className="h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
                href="/account"
                data-testid="nav-account-link"
                aria-label="My account"
              >
                <Image
                  src={"/images/icons/account.svg"}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                  aria-label="Shopping cart"
                >
                  <Image
                    src={"/images/icons/cart.svg"}
                    alt=""
                    width={24}
                    height={24}
                    aria-hidden="true"
                  />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
