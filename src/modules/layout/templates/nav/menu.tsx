import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
const Menu = () => {
  return (
    <div className="hidden md:block sticky top-[107px] inset-x-0 z-10">
      <nav className="bg-white border-b border-[#000/25]">
        <div className="flex items-center justify-center space-x-10 py-2 h-12">
          <LocalizedClientLink
            href="/beef"
            className="text-p-sm-mono uppercase text-black"
          >
            Beef
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/poultry"
            className="text-p-sm-mono uppercase text-black"
          >
            Poultry
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/prepared-food"
            className="text-p-sm-mono uppercase text-black"
          >
            Prepared Food
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/bakery-grocery"
            className="text-p-sm-mono uppercase text-black"
          >
            Bakery &amp; Grocery
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/other-meats"
            className="text-p-sm-mono uppercase text-black"
          >
            Other Meats
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/best-sellers"
            className="text-p-sm-mono uppercase text-black"
          >
            Best Sellers
          </LocalizedClientLink>
        </div>
      </nav>
    </div>
  )
}

export default Menu
