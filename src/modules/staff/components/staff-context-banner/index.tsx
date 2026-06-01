"use client"

import StaffContextActions from "@modules/staff/components/staff-context-actions"
import { useStorefrontSession } from "@modules/layout/components/storefront-session"

export default function StaffContextBanner() {
  const { staffImpersonation } = useStorefrontSession()

  if (!staffImpersonation) {
    return null
  }

  return (
    <div className="border-b border-Gold/30 bg-Gold/10 px-4 py-2 text-xs font-maison-neue text-Charcoal">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 small:flex-row small:items-center small:justify-between">
        <p className="text-center small:text-left">
          <span className="font-semibold">
            Staff context active: acting as {staffImpersonation.targetName}.
          </span>{" "}
          Actions are audited to {staffImpersonation.staffName}.
        </p>
        <StaffContextActions />
      </div>
    </div>
  )
}
