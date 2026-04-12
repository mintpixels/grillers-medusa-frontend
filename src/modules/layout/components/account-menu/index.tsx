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

  const links = [
    { href: "/account/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { href: "/account/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { href: "/account/reorder", label: "Reorder", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded-full transition-transform active:scale-95"
        aria-label="My account"
        aria-expanded={isOpen}
      >
        <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-Gold text-Charcoal font-maison-neue font-semibold text-[9px] leading-[0] uppercase">
          <span>{initials}</span>
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" />
          <div className="absolute right-0 top-full mt-3 z-50 origin-top-right animate-[fadeIn_0.15s_ease-out]">
            <div className="w-[180px] bg-[#FAFAF8] rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-Gold/30 overflow-hidden">
              <div className="px-4 pt-3 pb-2">
                <p className="text-[10px] font-maison-neue-mono font-semibold uppercase tracking-[0.1em] text-Gold">
                  Welcome Back, {firstName}
                </p>
              </div>

              <div className="px-1.5 pb-1.5">
                {links.map(({ href, label, icon }) => (
                  <LocalizedClientLink
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] font-maison-neue text-Charcoal rounded-md hover:bg-Scroll/60 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-3.5 h-3.5 text-Charcoal/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    {label}
                  </LocalizedClientLink>
                ))}
              </div>

              <div className="border-t border-Charcoal/6 px-1.5 py-1.5">
                <button
                  onClick={() => signout("us")}
                  className="flex items-center gap-2.5 w-full px-2.5 py-[7px] text-[13px] font-maison-neue text-Charcoal/50 rounded-md hover:bg-Scroll/60 hover:text-Charcoal transition-colors"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
