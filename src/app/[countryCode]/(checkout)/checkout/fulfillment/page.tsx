import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | Grillers Pride",
  robots: {
    index: false,
    follow: false,
  },
}

type PageProps = {
  params: Promise<{ countryCode: string }>
}

/**
 * This page now redirects to the unified checkout page.
 * Fulfillment selection is handled as the first step in /checkout.
 */
export default async function FulfillmentPage({ params }: PageProps) {
  const { countryCode } = await params
  redirect(`/${countryCode}/checkout`)
}
