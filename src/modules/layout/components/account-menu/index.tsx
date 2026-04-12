"use client"

import { useState, useRef, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signout } from "@lib/data/customer"

type AccountMenuProps = {
  initials: string
  firstName: string
}

export default function AccountMenu({ initials, firstName }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded-full"
        aria-label="My account"
        aria-expanded={isOpen}
      >
        <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-Gold text-Charcoal font-maison-neue font-semibold text-[9px] leading-[0] uppercase">
          <span>{initials}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-Charcoal/10 rounded-lg shadow-lg py-2 z-50">
          <p className="px-4 py-2 text-xs font-maison-neue-mono uppercase tracking-wider text-Charcoal/50 border-b border-Charcoal/10">
            Hi, {firstName}
          </p>
          <LocalizedClientLink
            href="/account/profile"
            className="block px-4 py-2 text-sm font-maison-neue text-Charcoal hover:bg-Charcoal/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/orders"
            className="block px-4 py-2 text-sm font-maison-neue text-Charcoal hover:bg-Charcoal/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Orders
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/reorder"
            className="block px-4 py-2 text-sm font-maison-neue text-Charcoal hover:bg-Charcoal/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Reorder
          </LocalizedClientLink>
          <div className="border-t border-Charcoal/10 mt-1 pt-1">
            <button
              onClick={() => signout("us")}
              className="block w-full text-left px-4 py-2 text-sm font-maison-neue text-Charcoal/60 hover:bg-Charcoal/5 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
