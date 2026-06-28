import { NextRequest, NextResponse } from "next/server"

import { getCuratedCollectionBySlug } from "@lib/data/strapi/curated-collections"

type RouteProps = {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { slug } = await params
  const countryCode = request.nextUrl.searchParams.get("countryCode") || "us"
  const collection = await getCuratedCollectionBySlug(
    slug,
    countryCode,
    "api_detail"
  )

  const headers = {
    "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
  }

  if (!collection) {
    return NextResponse.json({ collection: null }, { status: 404, headers })
  }

  return NextResponse.json({ collection }, { headers })
}
