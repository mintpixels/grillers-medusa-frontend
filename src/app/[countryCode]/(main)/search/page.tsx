import { Metadata } from "next"
import SearchResults from "@modules/search/templates"

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
  const { q } = await props.searchParams
  const initialQuery = (q || "").trim()
  return <SearchResults initialQuery={initialQuery} />
}

export const dynamic = "force-dynamic"
