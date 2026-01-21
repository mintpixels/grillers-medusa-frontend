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
import type { HeaderNavLink } from "@lib/data/strapi/header"

// Mobile version with enhanced keyboard navigation
export const MobileNavMenu = ({ navLinks }: { navLinks: HeaderNavLink[] }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent, idx: number, hasChildren: boolean) => {
    if (hasChildren) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setExpandedIndex(expandedIndex === idx ? null : idx)
      } else if (e.key === "Escape" && expandedIndex === idx) {
        setExpandedIndex(null)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        className="md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded"
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        onClick={() => setMobileOpen(true)}
      >
        <Image
          src={"/images/icons/hamburger.svg"}
          alt=""
          width={24}
          height={24}
          aria-hidden="true"
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

        <DialogPanel
          id="mobile-menu"
          className="fixed inset-y-0 left-0 z-40 w-full max-w-sm bg-white shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold font-maison-neue-mono uppercase" id="mobile-menu-title">
              Menu
            </h2>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
              aria-label="Close navigation menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col space-y-2" aria-labelledby="mobile-menu-title">
            {navLinks?.map((item, idx) => (
              <div key={item.Link.id} role="none">
                {item?.Children?.length ? (
                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === idx ? null : idx)
                    }
                    onKeyDown={(e) => handleKeyDown(e, idx, true)}
                    className="px-4 py-2 w-full flex items-center justify-between text-p-sm-mono font-maison-neue-mono uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
                    aria-expanded={expandedIndex === idx}
                    aria-controls={`submenu-${idx}`}
                  >
                    <span>{item.Link.Text}</span>
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
                      alt=""
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <LocalizedClientLink
                    href={item.Link.Url}
                    className="block px-4 py-2 text-p-sm-mono font-maison-neue-mono uppercase hover:bg-gray-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.Link.Text}
                  </LocalizedClientLink>
                )}
                {item?.Children?.length && (
                  <div
                    id={`submenu-${idx}`}
                    className="ml-4 mt-1"
                    role="group"
                    aria-label={`${item.Link.Text} submenu`}
                  >
                    {expandedIndex === idx && (
                      <div className="mt-1 flex flex-col space-y-1">
                        {item.Children.map((sub) => (
                          <LocalizedClientLink
                            key={sub.id}
                            href={sub.Url}
                            className="block px-4 py-2 text-p-sm-mono font-maison-neue-mono uppercase hover:bg-gray-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
                            onClick={() => setMobileOpen(false)}
                          >
                            {sub.Text}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </DialogPanel>
      </Dialog>
    </>
  )
}

// Desktop version with enhanced keyboard navigation
const DesktopNavMenu = ({ navLinks }: { navLinks: HeaderNavLink[] }) => (
  <div className="hidden md:block sticky top-[107px] inset-x-0 z-10">
    <nav className="bg-white border-b border-[#000/25]" aria-label="Main navigation">
      <div className="flex items-center justify-center space-x-8 py-2 h-12" role="menubar">
        {navLinks.map((item) =>
          item?.Children?.length > 0 ? (
            <Menu
              as="div"
              className="relative inline-flex text-left h-[20px]"
              key={item.Link.id}
            >
              {({ open }) => (
                <>
                  <MenuButton
                    className="inline-flex items-center text-p-sm-mono font-maison-neue-mono uppercase text-black hover:opacity-70 gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded"
                    aria-haspopup="true"
                    aria-expanded={open}
                  >
                    {item.Link.Text}
                    <Image
                      className={classNames(
                        "ml-1 transform transition-transform duration-200",
                        {
                          "rotate-180": open,
                        }
                      )}
                      src="/images/icons/chevron.svg"
                      width={10}
                      height={5}
                      alt=""
                      aria-hidden="true"
                    />
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
                    <MenuItems
                      className="absolute mt-[34px] w-48 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      aria-label={`${item.Link.Text} submenu`}
                    >
                      {item.Children.map((sub) => (
                        <MenuItem key={sub.id}>
                          {({ active, close }) => (
                            <LocalizedClientLink
                              href={sub.Url}
                              className={classNames(
                                "block px-4 py-2 text-p-sm-mono font-maison-neue-mono uppercase",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-Gold",
                                {
                                  "bg-gray-100": active,
                                }
                              )}
                              onClick={() => close()}
                            >
                              {sub.Text}
                            </LocalizedClientLink>
                          )}
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Transition>
                </>
              )}
            </Menu>
          ) : (
            <LocalizedClientLink
              key={item.Link.id}
              href={item.Link.Url}
              className="text-p-sm-mono font-maison-neue-mono uppercase text-black hover:opacity-70 h-[20px] focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded"
            >
              {item.Link.Text}
            </LocalizedClientLink>
          )
        )}
      </div>
    </nav>
  </div>
)

const NavMenu = ({ navLinks }: { navLinks: HeaderNavLink[] }) => (
  <>
    <DesktopNavMenu navLinks={navLinks} />
  </>
)

export default NavMenu
