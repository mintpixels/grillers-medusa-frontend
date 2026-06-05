"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useExitStaffContext } from "@modules/staff/hooks/use-exit-staff-context"

type StaffContextActionsProps = {
  compact?: boolean
}

export default function StaffContextActions({
  compact = false,
}: StaffContextActionsProps) {
  const { exitContext, isExiting } = useExitStaffContext()

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2"
          : "flex flex-col gap-2 xsmall:flex-row xsmall:items-center"
      }
    >
      <LocalizedClientLink
        href="/account/staff/orders"
        className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-Charcoal px-3 text-xs font-rexton font-bold uppercase text-Charcoal transition-colors hover:bg-Charcoal hover:text-white"
      >
        Staff console
      </LocalizedClientLink>
      <button
        type="button"
        onClick={exitContext}
        disabled={isExiting}
        className="inline-flex min-h-[36px] items-center justify-center rounded-md bg-Charcoal px-3 text-xs font-rexton font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExiting ? "Exiting" : "Exit context"}
      </button>
    </div>
  )
}
