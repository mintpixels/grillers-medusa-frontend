"use client"
import React, { Fragment, useState } from "react"
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react"
import classNames from "classnames"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const menuItems = [
  {
    label: "Beef",
    href: "/beef",
    links: [
      { label: "Beef1", href: "/beef" },
      { label: "Beef2", href: "/beef" },
      { label: "Beef3", href: "/beef" },
    ],
  },
  {
    label: "Poultry",
    href: "/poultry",
    links: [
      { label: "Poultry1", href: "/poultry" },
      { label: "Poultry2", href: "/poultry" },
      { label: "Poultry3", href: "/poultry" },
    ],
  },
  { label: "Prepared Food", href: "/prepared-food" },
  { label: "Bakery & Grocery", href: "/bakery-grocery" },
  { label: "Other Meats", href: "/other-meats" },
  { label: "Best Sellers", href: "/best-sellers" },
]

// Mobile version
export const MobileNavMenu = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <>
      <button
        type="button"
        className="md:hidden"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
      >
        <Image
          src={"/images/icons/hamburger.svg"}
          alt="menu"
          width={24}
          height={24}
        />
      </button>

      <Dialog
        as="div"
        className="relative z-20"
        open={mobileOpen}
        onClose={setMobileOpen}
      >
        <Transition
          as={Fragment}
          show={mobileOpen}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition>

        <DialogPanel className="fixed inset-y-0 left-0 z-40 w-full max-w-sm bg-white  shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold font-maison-neue-mono uppercase">
              Menu
            </h2>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 focus:outline-none"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item, idx) => (
              <div key={item.href}>
                {item?.links ? (
                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === idx ? null : idx)
                    }
                    className="px-4 py-2 w-full flex items-center justify-between text-p-sm-mono font-maison-neue-mono uppercase focus:outline-none"
                  >
                    <span>{item.label}</span>
                    <Image
                      className={classNames(
                        "ml-1 transform transition-transform duration-200",
                        {
                          "rotate-180": expandedIndex === idx,
                        }
                      )}
                      src="/images/icons/chevron.svg"
                      width={10}
                      height={5}
                      alt="chevron"
                    />
                  </button>
                ) : (
                  <LocalizedClientLink
                    href={item.href}
                    className="block px-4 py-2 text-p-sm-mono font-maison-neue-mono uppercase hover:bg-gray-100 rounded"
                  >
                    {item.label}
                  </LocalizedClientLink>
                )}
                {item?.links && (
                  <>
                    <div className="ml-4 mt-1">
                      {expandedIndex === idx && (
                        <div className="mt-1 flex flex-col space-y-1">
                          {item.links.map((sub) => (
                            <LocalizedClientLink
                              key={sub.href + sub.label}
                              href={sub.href}
                              className="block px-4 py-2 text-p-sm-mono font-maison-neue-mono uppercase hover:bg-gray-100 rounded"
                            >
                              {sub.label}
                            </LocalizedClientLink>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </DialogPanel>
      </Dialog>
    </>
  )
}

// Desktop version
const DesktopNavMenu = () => (
  <div className="hidden md:block sticky top-[107px] inset-x-0 z-10">
    <nav className="bg-white border-b border-[#000/25]">
      <div className="flex items-center justify-center space-x-8 py-2 h-12">
        {menuItems.map((item) =>
          item.links ? (
            <Menu
              as="div"
              className="relative inline-block text-left"
              key={item.href}
            >
              <MenuButton className="inline-flex items-center text-p-sm-mono font-maison-neue-mono uppercase text-black hover:opacity-70 focus:outline-none gap-0.5">
                {({ active }) => (
                  <>
                    {item.label}
                    <Image
                      className={classNames(
                        "ml-1 transform transition-transform duration-200",
                        {
                          "rotate-180": active,
                        }
                      )}
                      src="/images/icons/chevron.svg"
                      width={10}
                      height={5}
                      alt="chevron"
                    />
                  </>
                )}
              </MenuButton>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute mt-2 w-48 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {item.links.map((sub) => (
                    <MenuItem key={sub.href + sub.label}>
                      {({ active }) => (
                        <LocalizedClientLink
                          href={sub.href}
                          className={`block px-4 py-2 text-p-sm-mono font-maison-neue-mono uppercase ${
                            active ? "bg-gray-100" : ""
                          }`}
                        >
                          {sub.label}
                        </LocalizedClientLink>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Transition>
            </Menu>
          ) : (
            <LocalizedClientLink
              key={item.href}
              href={item.href}
              className="text-p-sm-mono font-maison-neue-mono uppercase text-black hover:opacity-70"
            >
              {item.label}
            </LocalizedClientLink>
          )
        )}
      </div>
    </nav>
  </div>
)

const NavMenu = () => (
  <>
    <DesktopNavMenu />
  </>
)

export default NavMenu
