"use client"

import { useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { stopStaffImpersonation } from "@lib/data/staff/impersonation"
import { dispatchStorefrontSessionUpdated } from "@lib/util/storefront-session-events"

type StaffContextActionsProps = {
  compact?: boolean
}

export default function StaffContextActions({
  compact = false,
}: StaffContextActionsProps) {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode?: string }
  const [isPending, startTransition] = useTransition()

  function exitContext() {
    startTransition(async () => {
      await stopStaffImpersonation()
      dispatchStorefrontSessionUpdated({
        reason: "staff-impersonation-stopped",
      })
      router.push(`/${countryCode || "us"}/account/staff/orders`)
      router.refresh()
    })
  }

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
        disabled={isPending}
        className="inline-flex min-h-[36px] items-center justify-center rounded-md bg-Charcoal px-3 text-xs font-rexton font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Exiting" : "Exit context"}
      </button>
    </div>
  )
}
