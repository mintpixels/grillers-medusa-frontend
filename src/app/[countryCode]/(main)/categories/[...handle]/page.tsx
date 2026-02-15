import { notFound } from "next/navigation"
import { Metadata } from "next"
import CategoryTemplate from "@modules/categories/templates"
import { generateAlternates } from "@lib/util/seo"

interface CategoryPageParams {
  params: {
    countryCode: string
    handle: string[]
  }
}

type MetadataProps = CategoryPageParams

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { handle, countryCode } = params
  try {
    const title = handle
      .map((segment) => segment.replace(/-/g, " "))
      .join(" / ")
    
    const path = `/categories/${handle.join("/")}`
    const alternates = await generateAlternates(path, countryCode)
    
    return { 
      title: `${title} | Grillers Pride`,
      description: `Shop our selection of ${title.toLowerCase()} at Grillers Pride.`,
      alternates,
    }
  } catch (error) {
    notFound()
  }
}

export default function CategoryPage({ params }: CategoryPageParams) {
  const { countryCode, handle } = params

  if (!handle || handle.length === 0) {
    return notFound()
  }

  const title = handle.map((segment) => segment.replace(/-/g, " ")).join(" / ")

  return (
    <CategoryTemplate title={title} slug={handle} countryCode={countryCode} />
  )
}

export const dynamic = "force-dynamic"
