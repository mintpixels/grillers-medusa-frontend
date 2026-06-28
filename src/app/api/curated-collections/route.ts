import { NextRequest, NextResponse } from "next/server"

import {
  getCuratedCollectionCards,
  type CuratedCollection,
} from "@lib/data/strapi/curated-collections"

function dedupeCollections(collections: CuratedCollection[]) {
  const seen = new Set<string>()
  const result: CuratedCollection[] = []

  for (const collection of collections) {
    const key = collection.documentId || collection.Slug
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(collection)
  }

  return result.sort((a, b) => (a.SortOrder || 999) - (b.SortOrder || 999))
}

export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 60)
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 100)
    : 60
  const collections = await getCuratedCollectionCards({
    alertSurface: "api_list",
    customerState: "any",
    limit,
  })
  const headers = {
    "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
  }

  return NextResponse.json(
    { collections: dedupeCollections(collections) },
    { headers }
  )
}
