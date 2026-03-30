"use client"

import { clx } from "@medusajs/ui"
import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const navItems = [
  {
    label: "Overview",
    href: "/account",
    testId: "overview-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/account/profile",
    testId: "profile-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/account/orders",
    testId: "orders-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    label: "Reorder",
    href: "/account/reorder",
    testId: "reorder-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652" />
      </svg>
    ),
  },
  {
    label: "Addresses",
    href: "/account/addresses",
    testId: "addresses-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    label: "Payment Methods",
    href: "/account/payment-methods",
    testId: "payment-methods-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
]

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const isActive = (href: string) => {
    const path = route.split(countryCode)[1]
    if (href === "/account") return path === "/account" || path === "/account/"
    return path?.startsWith(href)
  }

  return (
    <div>
      {/* Mobile: horizontal scrollable tabs */}
      <div className="small:hidden border-b border-gray-200 -mx-4 px-4" data-testid="mobile-account-nav">
        <nav className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
          {navItems.map((item) => (
            <LocalizedClientLink
              key={item.href}
              href={item.href}
              className={clx(
                "flex items-center gap-1.5 px-3 py-3 text-sm font-maison-neue whitespace-nowrap border-b-2 transition-colors",
                isActive(item.href)
                  ? "border-Gold text-Charcoal font-semibold"
                  : "border-transparent text-Charcoal/50 hover:text-Charcoal hover:border-gray-300"
              )}
              data-testid={item.testId}
            >
              {item.icon}
              <span>{item.label}</span>
            </LocalizedClientLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-3 text-sm font-maison-neue whitespace-nowrap border-b-2 border-transparent text-Charcoal/40 hover:text-VibrantRed transition-colors"
            data-testid="logout-button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Log out</span>
          </button>
        </nav>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden small:block" data-testid="account-nav">
        <div className="pr-8 border-r border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-Gold/10 flex items-center justify-center">
              <span className="text-Gold font-gyst font-bold text-lg">
                {customer?.first_name?.charAt(0) || "G"}
              </span>
            </div>
            <div>
              <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                {customer?.first_name} {customer?.last_name}
              </p>
              <p className="text-xs font-maison-neue text-Charcoal/50">
                {customer?.email}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <LocalizedClientLink
                key={item.href}
                href={item.href}
                className={clx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-maison-neue transition-all duration-150",
                  isActive(item.href)
                    ? "bg-Gold/10 text-Charcoal font-semibold border-l-2 border-Gold"
                    : "text-Charcoal/60 hover:bg-gray-50 hover:text-Charcoal"
                )}
                data-testid={item.testId}
              >
                <span className={clx(
                  isActive(item.href) ? "text-Gold" : "text-Charcoal/40"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </LocalizedClientLink>
            ))}

            <div className="border-t border-gray-100 mt-4 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-maison-neue text-Charcoal/40 hover:text-VibrantRed hover:bg-red-50/50 transition-all duration-150 w-full"
                data-testid="logout-button"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Log out
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default AccountNav
