"use client"

import { useEffect } from "react"

import { pushToDataLayer } from "@lib/gtm"

export default function LearnAnalytics() {
  useEffect(() => {
    pushToDataLayer({
      event: "view_learn_hub",
      learn_surface: "butcher_education_hub",
    })

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest<HTMLElement>("[data-learn-event]")
      if (!link) return

      pushToDataLayer({
        event: link.dataset.learnEvent,
        learn_label: link.dataset.learnLabel,
        learn_section: link.dataset.learnSection,
        learn_destination:
          link.dataset.learnDestination ||
          link.getAttribute("href") ||
          undefined,
      })
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
