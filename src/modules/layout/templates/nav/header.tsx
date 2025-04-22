import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Image from "next/image"
import { MobileNavMenu } from "./menu"

const Header = () => {
  return (
    <header className="sticky top-0 inset-x-0 z-10 bg-white border-b border-[#000/25]">
      <nav className="flex items-center justify-between w-full h-[106px] px-4 lg:px-8">
        <MobileNavMenu />

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
          <input
            type="search"
            placeholder="Search..."
            className="w-full h-full border rounded-[5px] border-Charcoal px-5 py-3 focus:outline-none focus:border-gray-500 text-p-md text-Pewter"
          />
        </div>

        <div className="flex items-center gap-8">
          <span className="hidden md:inline-block text-p-md text-Charcoal">
            (888) 627-3284
          </span>

          <div className="flex items-center gap-4">
            <div className="h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                <Image
                  src={"/images/icons/account.svg"}
                  alt="account"
                  width={24}
                  height={24}
                />
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <Image
                    src={"/images/icons/cart.svg"}
                    alt="account"
                    width={24}
                    height={24}
                  />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Search bar for mobile  */}
    </header>
  )
}

export default Header
