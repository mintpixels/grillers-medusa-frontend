"use client"

import { useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { stopStaffImpersonation } from "@lib/data/staff/impersonation"
import { dispatchStorefrontSessionUpdated } from "@lib/util/storefront-session-events"

export function useExitStaffContext() {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode?: string }
  const [isExiting, startTransition] = useTransition()

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

  return { exitContext, isExiting }
}
