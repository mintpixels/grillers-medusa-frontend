"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AccountMenu from "@modules/layout/components/account-menu"
import { useStorefrontSession } from "@modules/layout/components/storefront-session"

export default function AccountButton() {
  const { customer } = useStorefrontSession()

  if (customer?.initials) {
    return (
      <AccountMenu
        initials={customer.initials}
        firstName={customer.firstName || ""}
        canUseStaffTools={customer.canUseStaffTools}
      />
    )
  }

  return (
    <LocalizedClientLink
      className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center hover:text-ui-fg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
      href="/account"
      data-testid="nav-account-link"
      aria-label="My account"
    >
      <Image
        src="/images/icons/account.svg"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
    </LocalizedClientLink>
  )
}
