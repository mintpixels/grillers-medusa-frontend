import { Metadata } from "next"
import SearchResults from "@modules/search/templates"
import ExperimentExposure from "@lib/experiments/exposure"
import { getExperimentAssignment } from "@lib/experiments/server"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { q } = await props.searchParams
  const title = q ? `Search: ${q} | Grillers Pride` : "Search | Grillers Pride"
  return { title, robots: { index: false, follow: true } }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const { q } = await props.searchParams
  const initialQuery = (q || "").trim()
  const searchExperiment = await getExperimentAssignment("search_merchandising_v1", {
    routeMarket: countryCode,
    customerType: "unknown",
  })

  return (
    <>
      <ExperimentExposure assignment={searchExperiment} />
      <SearchResults initialQuery={initialQuery} />
    </>
  )
}

export const dynamic = "force-dynamic"
