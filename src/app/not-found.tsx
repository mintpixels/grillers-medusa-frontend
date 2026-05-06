import { Metadata } from "next"
import NotFoundContent from "@modules/layout/components/not-found-content"

export const metadata: Metadata = {
  title: "Page Not Found | Grillers Pride",
  description:
    "The page you're looking for doesn't exist. Browse the counter, find a recipe, or get in touch.",
  robots: { index: false, follow: false },
}

// Root not-found — for top-level paths that never reached the [countryCode]
// segment. Defaults links to the "us" locale since there's no params here.
export default function NotFound() {
  return <NotFoundContent countryCode="us" />
}
