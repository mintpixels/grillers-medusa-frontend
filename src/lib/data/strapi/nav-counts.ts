import "server-only"
import { extractTagValue, generateTagSlug } from "./collections"

// Live nav-link product counts.
//
// At render time we resolve each /collections/<slug> URL the same way the
// runtime collection page does: prefer a Strapi product-collection match,
// then fall back to a Strapi product-tag match. Counts use the storefront's
// `containsi` filter semantics so the badge in the nav matches what the user
// actually lands on after clicking — over-counting and all (e.g., the
// "Brisket" link's count includes "Brisket Deckel" / "Brisket First Cut"
// because that's what the runtime filter returns).

type ProductTagSet = { tags: string[] }

type CacheEntry = {
  ts: number
  products: ProductTagSet[]
  collectionSlugs: Set<string>
  uniqueTagNames: Set<string>
}

const TTL_MS = 5 * 60 * 1000

let cache: CacheEntry | null = null
let inflight: Promise<CacheEntry> | null = null

async function loadDataset(): Promise<CacheEntry> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache
  if (inflight) return inflight

  inflight = (async () => {
    const endpoint = process.env.STRAPI_ENDPOINT
    const token = process.env.STRAPI_API_TOKEN
    if (!endpoint || !token) {
      const empty: CacheEntry = {
        ts: Date.now(),
        products: [],
        collectionSlugs: new Set(),
        uniqueTagNames: new Set(),
      }
      cache = empty
      return empty
    }

    const headers = { Authorization: `Bearer ${token}` }

    const products: ProductTagSet[] = []
    const uniqueTagNames = new Set<string>()
    let start = 0
    const pageSize = 100

    while (true) {
      const url = new URL(`${endpoint}/api/products`)
      url.searchParams.set("fields[0]", "id")
      url.searchParams.set(
        "populate[Categorization][populate][ProductTags][fields][0]",
        "Name",
      )
      // Strapi rejects mixing `pageSize` (page-based) with `start`
      // (offset-based). Use `start` + `limit` for offset pagination.
      url.searchParams.set("pagination[start]", String(start))
      url.searchParams.set("pagination[limit]", String(pageSize))

      const res = await fetch(url.toString(), {
        headers,
        next: { revalidate: 300 },
      })
      if (!res.ok) break

      const json = (await res.json()) as {
        data?: Array<{
          Categorization?: { ProductTags?: Array<{ Name?: string | null }> }
        }>
        meta?: { pagination?: { total?: number } }
      }
      const data = json.data ?? []
      for (const p of data) {
        const tagNames: string[] = (p.Categorization?.ProductTags ?? [])
          .map((t) => t?.Name ?? "")
          .filter((s): s is string => Boolean(s))
        for (const t of tagNames) uniqueTagNames.add(t)
        products.push({ tags: tagNames })
      }
      if (data.length < pageSize) break
      start += pageSize
    }

    const collectionSlugs = new Set<string>()
    try {
      const cu = new URL(`${endpoint}/api/product-collections`)
      cu.searchParams.set("fields[0]", "Slug")
      cu.searchParams.set("pagination[limit]", "200")
      const cr = await fetch(cu.toString(), {
        headers,
        next: { revalidate: 300 },
      })
      if (cr.ok) {
        const cj = (await cr.json()) as {
          data?: Array<{ Slug?: string | null }>
        }
        for (const c of cj.data ?? []) {
          if (c?.Slug) collectionSlugs.add(c.Slug)
        }
      }
    } catch {
      // best-effort — fall back to tag-only resolution
    }

    const entry: CacheEntry = {
      ts: Date.now(),
      products,
      collectionSlugs,
      uniqueTagNames,
    }
    cache = entry
    return entry
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

// The storefront's collection page resolves /collections/<slug> by finding
// the Strapi tag whose generated slug matches, then runs
//   contains: tag.Name
// against ProductTags.Name. We mirror that precisely so the nav badge
// matches what the user lands on after clicking — including the implicit
// "case-sensitive substring of the FULL tag name" semantics of Strapi's
// `contains` operator. Crucially, we count using the *full* tag name
// (e.g. "L2: Beef"), not the extracted value ("Beef") — the L2/L3 prefix
// is what scopes "L3: Brisket" away from "L3: Whole Packer Brisket".
function fullTagNameForCollectionSlug(
  slug: string,
  uniqueTagNames: Set<string>,
): string | null {
  let result: string | null = null
  uniqueTagNames.forEach((tagName) => {
    if (result) return
    const value = extractTagValue(tagName)
    if (generateTagSlug(value) === slug) result = tagName
  })
  return result
}

async function countProductsContainingTagSubstring(
  needle: string,
  products: ProductTagSet[],
): Promise<number> {
  let count = 0
  for (const p of products) {
    if (p.tags.some((t) => t.includes(needle))) count++
  }
  return count
}

async function countProductsInCollection(
  slug: string,
): Promise<number | null> {
  // For the rare case a nav URL points at an actual Strapi collection
  // (e.g. `kosher-prepared-food`), we hit the count endpoint directly —
  // the collection→product join isn't represented in the cached dataset.
  const endpoint = process.env.STRAPI_ENDPOINT
  const token = process.env.STRAPI_API_TOKEN
  if (!endpoint || !token) return null
  const u = new URL(`${endpoint}/api/products`)
  u.searchParams.set(
    "filters[Categorization][ProductCollections][Slug][$eq]",
    slug,
  )
  u.searchParams.set("pagination[limit]", "1")
  u.searchParams.set("pagination[withCount]", "true")
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) return null
  const j = (await res.json()) as {
    meta?: { pagination?: { total?: number } }
  }
  return j.meta?.pagination?.total ?? null
}

export async function countForNavUrl(url: string): Promise<number | null> {
  if (!url) return null
  const m = url.match(/^\/collections\/([^/?#]+)/)
  if (!m) return null
  const slug = m[1]

  const data = await loadDataset()

  if (data.collectionSlugs.has(slug)) {
    return countProductsInCollection(slug)
  }

  const fullTagName = fullTagNameForCollectionSlug(slug, data.uniqueTagNames)
  if (!fullTagName) return null

  return countProductsContainingTagSubstring(fullTagName, data.products)
}

export async function countsForNavUrls(
  urls: string[],
): Promise<Record<string, number | null>> {
  if (urls.length === 0) return {}
  await loadDataset() // warm cache once
  const out: Record<string, number | null> = {}
  await Promise.all(
    urls.map(async (u) => {
      try {
        out[u] = await countForNavUrl(u)
      } catch {
        out[u] = null
      }
    }),
  )
  return out
}
