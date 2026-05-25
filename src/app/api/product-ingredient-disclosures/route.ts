import { NextRequest, NextResponse } from "next/server"

import { getProductIngredientDisclosureMap } from "@lib/data/strapi/ingredient-disclosures"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const productIds = Array.isArray((body as { productIds?: unknown })?.productIds)
    ? (body as { productIds: unknown[] }).productIds
        .filter((id): id is string => typeof id === "string")
        .slice(0, 1000)
    : []

  if (productIds.length === 0) {
    return NextResponse.json({ products: {} })
  }

  const products = await getProductIngredientDisclosureMap(productIds)

  return NextResponse.json({ products })
}
