"use client"
import React, { Fragment, useState, useRef } from "react"
import {
  Dialog,
  DialogPanel,
  Transition,
} from "@headlessui/react"
import classNames from "classnames"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import type { HeaderNavLink } from "@lib/data/strapi/header"
import { Award, Clock, Star } from "lucide-react"

// Icon mapper for bottom bar certifications
const iconMap = {
  award: Award,
  clock: Clock,
  star: Star,
}

// Mobile version with sections
export const MobileNavMenu = ({ navLinks }: { navLinks: HeaderNavLink[] }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setExpandedIndex(expandedIndex === idx ? null : idx)
    } else if (e.key === "Escape" && expandedIndex === idx) {
      setExpandedIndex(null)
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
          className="fixed inset-y-0 left-0 z-40 w-full max-w-sm bg-white shadow-lg p-6 overflow-y-auto"
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
              <div key={item.id} role="none">
                <button
                  onClick={() =>
                    setExpandedIndex(expandedIndex === idx ? null : idx)
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="px-4 py-2 w-full flex items-center justify-between text-p-sm-mono font-maison-neue-mono uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
                  aria-expanded={expandedIndex === idx}
                  aria-controls={`submenu-${idx}`}
                >
                  <span>{item.title}</span>
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
                {expandedIndex === idx && (
                  <div
                    id={`submenu-${idx}`}
                    className="ml-4 mt-1"
                    role="group"
                    aria-label={`${item.title} submenu`}
                  >
                    {item.sections.map((section, sectionIdx) => (
                      <div key={sectionIdx} className="mb-3">
                        <button
                          onClick={() => 
                            setExpandedSection(
                              expandedSection === `${idx}-${sectionIdx}` 
                                ? null 
                                : `${idx}-${sectionIdx}`
                            )
                          }
                          className="w-full text-left px-4 py-1 text-xs font-semibold text-gray-700 flex items-center justify-between"
                        >
                          {section.title}
                          <Image
                            className={classNames(
                              "ml-1 transform transition-transform duration-200",
                              {
                                "rotate-180": expandedSection === `${idx}-${sectionIdx}`,
                              }
                            )}
                            src="/images/icons/chevron.svg"
                            width={8}
                            height={4}
                            alt=""
                            aria-hidden="true"
                          />
                        </button>
                        {expandedSection === `${idx}-${sectionIdx}` && (
                          <div className="mt-1 flex flex-col space-y-1">
                            {section.items.map((navItem, itemIdx) => (
                              <LocalizedClientLink
                                key={itemIdx}
                                href={navItem.Url}
                                className="block px-6 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold"
                                onClick={() => setMobileOpen(false)}
                              >
                                {navItem.Text}
                              </LocalizedClientLink>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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

// Pack sections into columns smartly:
// - Section with 8+ items gets its own column
// - Sections with <8 items stack together (max 3 per column, max 11 combined L3s)
type NavSection = HeaderNavLink["sections"][number]
type PackedColumn = NavSection[]

function packSectionsIntoColumns(sections: NavSection[]): PackedColumn[] {
  const columns: PackedColumn[] = []
  let currentColumn: NavSection[] = []
  let currentItemCount = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const itemCount = section.items.length

    if (itemCount >= 8) {
      // Flush current column if it has anything
      if (currentColumn.length > 0) {
        columns.push(currentColumn)
        currentColumn = []
        currentItemCount = 0
      }
      // This section gets its own column
      columns.push([section])
    } else {
      // Check if adding this section would exceed 11 combined items or 3 sections
      if (currentColumn.length >= 3 || (currentItemCount + itemCount >= 10 && currentColumn.length > 0)) {
        columns.push(currentColumn)
        currentColumn = []
        currentItemCount = 0
      }
      currentColumn.push(section)
      currentItemCount += itemCount
    }
  }

  // Flush remaining
  if (currentColumn.length > 0) {
    columns.push(currentColumn)
  }

  return columns
}

// Desktop mega menu
const DesktopNavMenu = ({ navLinks }: { navLinks: HeaderNavLink[] }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (menuId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (activeMenu !== menuId) {
      setIsAnimating(true)
      setActiveMenu(menuId)
      setTimeout(() => setIsAnimating(false), 50)
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
      setIsAnimating(false)
    }, 100)
  }

  return (
    <div className="hidden md:block sticky top-0 inset-x-0 z-30">
      {/* Navigation Bar */}
      <nav className="bg-Charcoal border-b border-white/10" aria-label="Main navigation">
        <div className="flex items-center justify-center space-x-16 py-2 h-12" role="menubar">
          {navLinks.map((item) => (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center text-p-sm-mono font-maison-neue-mono uppercase text-white hover:text-Gold gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded group">
                {item.title}
                <svg
                  className={classNames(
                    "ml-1 transform transition-transform duration-200 text-Gold",
                    {
                      "rotate-180": activeMenu === item.id,
                    }
                  )}
                  width="10"
                  height="5"
                  viewBox="0 0 10 5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M0 0L5 5L10 0H0Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </nav>

      {/* Mega Menu Overlay */}
      {activeMenu && (
        <div
          className="absolute top-full left-0 w-full bg-gray-100 shadow-xl border-t border-gray-300 z-50"
          onMouseEnter={() => handleMouseEnter(activeMenu)}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={classNames(
              "transition-all duration-300 ease-out",
              {
                "opacity-0 translate-y-[-10px]": isAnimating,
                "opacity-100 translate-y-0": !isAnimating,
              }
            )}
          >
            {navLinks
              .filter((item) => item.id === activeMenu)
              .map((item) => (
                <div key={item.id} className="container mx-auto px-6 py-6">
                  <div className="grid grid-cols-12 gap-6">
                    {/* Menu Sections - smart column packing */}
                    <div className={item.featured ? "col-span-8" : "col-span-12"}>
                      <div className="flex gap-6">
                        {packSectionsIntoColumns(item.sections).map((column, colIdx) => (
                          <div key={colIdx} className="flex-1 min-w-0 space-y-6">
                            {column.map((section, secIdx) => (
                              <div key={secIdx} className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 border-b border-orange-200 pb-2">
                                  <LocalizedClientLink
                                    href={`/collections/kosher-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                                    className="hover:text-orange-600 transition-colors"
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    {section.title}
                                  </LocalizedClientLink>
                                </h3>
                                <ul className="space-y-1 pl-2">
                                  {section.items.map((navItem, subIndex) => (
                                    <li key={subIndex} className="flex items-center gap-2">
                                      <span className="w-1 h-1 rounded-full bg-Gold shrink-0" aria-hidden="true" />
                                      <LocalizedClientLink
                                        href={navItem.Url}
                                        className="text-sm text-gray-600 hover:text-orange-600 transition-colors block py-1 hover:translate-x-1 transform duration-200"
                                        onClick={() => setActiveMenu(null)}
                                      >
                                        {navItem.Text}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Featured Section */}
                    {item.featured && (
                      <div className="col-span-4">
                        <div className="bg-Charcoal rounded-lg p-5 h-full cursor-pointer hover:shadow-lg transition-shadow">
                          {item.featured.badge && (
                            <div className="flex items-start justify-between mb-4">
                              <span className="bg-Gold text-Charcoal px-2 py-1 rounded text-xs font-medium">
                                {item.featured.badge}
                              </span>
                            </div>
                          )}

                          {/* Featured Product Image */}
                          {item.featured.image?.url ? (
                            <div className="bg-white rounded-lg mb-4 h-40 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <Image
                                src={item.featured.image.url}
                                alt={item.featured.title || "Featured"}
                                width={400}
                                height={160}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg mb-4 h-40 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                                <span className="text-sm">Product Image</span>
                              </div>
                            </div>
                          )}

                          {item.featured.title && (
                            <h4 className="text-xl font-bold text-white mb-3">
                              {item.featured.title}
                            </h4>
                          )}
                          {item.featured.description && (
                            <p className="text-sm text-gray-300 mb-4">
                              {item.featured.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  {item.bottomBar && (
                  <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-xs text-gray-600">
                      {item.bottomBar.certifications?.map((cert, idx) => {
                        const IconComponent = iconMap[cert.icon as keyof typeof iconMap]
                        return (
                          <div key={idx} className="flex items-center">
                            {IconComponent && (
                              <IconComponent className="h-3 w-3 mr-1 text-Gold" />
                            )}
                            {cert.text}
                          </div>
                        )
                      })}
                    </div>
                    <LocalizedClientLink
                      href={item.bottomBar.viewAllUrl}
                      className="text-Gold hover:text-Gold/80 font-medium text-xs flex items-center"
                      onClick={() => setActiveMenu(null)}
                    >
                      {item.bottomBar.viewAllText} →
                    </LocalizedClientLink>
                  </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

const NavMenu = ({ navLinks }: { navLinks: HeaderNavLink[] }) => (
  <>
    <DesktopNavMenu navLinks={navLinks} />
  </>
)

export default NavMenu
