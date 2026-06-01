"use client"

import ReorderRow from "@modules/home/components/reorder-row"
import { useHomePersonalization } from "@modules/home/components/home-personalization/use-home-personalization"

export default function PersonalizedReorderRow({
  countryCode,
}: {
  countryCode: string
}) {
  const { purchaseHistory, strapiMap, firstName } = useHomePersonalization()

  if (!purchaseHistory.length) {
    return null
  }

  return (
    <ReorderRow
      history={purchaseHistory}
      strapiMap={strapiMap}
      firstName={firstName}
      countryCode={countryCode}
    />
  )
}
