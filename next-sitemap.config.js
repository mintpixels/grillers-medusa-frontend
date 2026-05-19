/** @type {import('next-sitemap').IConfig} */

const privatePaths = [
  "/checkout",
  "/checkout/*",
  "/account",
  "/account/*",
  "/cart",
  "/order/*",
  "/api/*",
]

const excludedPaths = [
  ...privatePaths,
  "/opengraph-image.jpg",
  "/twitter-image.jpg",
]

const normalizeSiteUrl = (value) => {
  const url = value || "https://grillers-medusa-frontend.vercel.app"
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`
  return withProtocol.replace(/\/$/, "")
}

const canonicalProductionUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_CANONICAL_BASE_URL ||
    process.env.NEXT_PUBLIC_PRODUCTION_BASE_URL ||
    "https://grillers-medusa-frontend.vercel.app"
)

const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_ENV === "production"
      ? canonicalProductionUrl
      : process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL) ||
    canonicalProductionUrl
)

const crawlerUserAgents = [
  "*",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
]

const staticPublicPaths = [
  { path: "/us", priority: 1.0, changefreq: "daily" },
  { path: "/us/store", priority: 0.9, changefreq: "daily" },
  { path: "/us/collections", priority: 0.8, changefreq: "weekly" },
  { path: "/us/recipes", priority: 0.8, changefreq: "weekly" },
  { path: "/us/learn", priority: 0.9, changefreq: "weekly" },
  { path: "/us/customer-service", priority: 0.6, changefreq: "monthly" },
  { path: "/us/shipping/ups", priority: 0.7, changefreq: "monthly" },
  { path: "/us/shipping/local-delivery", priority: 0.7, changefreq: "monthly" },
  {
    path: "/us/shipping/southeast-pickup",
    priority: 0.7,
    changefreq: "monthly",
  },
  { path: "/us/shipping/plant-pickup", priority: 0.7, changefreq: "monthly" },
  { path: "/us/shipping/pallet-program", priority: 0.6, changefreq: "monthly" },
  { path: "/us/holidays/order-deadlines", priority: 0.7, changefreq: "weekly" },
  { path: "/us/kashruth/passover", priority: 0.8, changefreq: "monthly" },
  { path: "/us/kashruth/hechsherim", priority: 0.8, changefreq: "monthly" },
  { path: "/us/kashruth/supervision", priority: 0.8, changefreq: "monthly" },
  { path: "/us/page/about-us", priority: 0.5, changefreq: "monthly" },
  { path: "/us/page/our-mission", priority: 0.5, changefreq: "monthly" },
  { path: "/us/page/wholesale", priority: 0.6, changefreq: "monthly" },
  { path: "/us/careers", priority: 0.4, changefreq: "monthly" },
]

const learnSlugs = [
  "kosher-meat-101",
  "cuts",
  "cuts/beef",
  "cuts/lamb",
  "cuts/poultry",
  "cuts/veal",
  "cuts/prepared-specialty",
  "guides/how-much-meat-per-person",
  "guides/brisket-first-cut-deckel-whole",
  "guides/best-cuts-for-slow-cooking",
  "guides/best-cuts-for-grilling",
  "guides/thawing-frozen-kosher-meat",
  "guides/shabbos-meat-order",
]

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchGraphql(query, variables) {
  const endpoint = process.env.STRAPI_ENDPOINT
  const token = process.env.STRAPI_API_TOKEN
  if (!endpoint || !token) return null

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "))
  }

  return data.data
}

async function getUsRegionId(headers) {
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  if (!backendUrl) return null

  const data = await fetchJson(`${backendUrl}/store/regions`, headers)
  const region = data.regions?.find((candidate) =>
    candidate.countries?.some((country) => country.iso_2 === "us")
  )

  return region?.id || null
}

async function getProductSitemapEntries() {
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backendUrl || !publishableKey) {
    return []
  }

  const headers = { "x-publishable-api-key": publishableKey }
  const regionId = await getUsRegionId(headers)
  const limit = 100
  let offset = 0
  let count = 0
  const entries = []

  do {
    const url = new URL(`${backendUrl}/store/products`)
    url.searchParams.set("limit", String(limit))
    url.searchParams.set("offset", String(offset))
    url.searchParams.set("fields", "handle,updated_at")
    if (regionId) url.searchParams.set("region_id", regionId)

    const data = await fetchJson(url.toString(), headers)
    const products = data.products || []
    count = data.count || products.length

    entries.push(
      ...products
        .filter((product) => product.handle)
        .map((product) => ({
          loc: `/us/products/${product.handle}`,
          changefreq: "weekly",
          priority: 0.8,
          lastmod: product.updated_at || new Date().toISOString(),
        }))
    )

    offset += limit
  } while (offset < count)

  return entries
}

const recipeSitemapQuery = `
  query RecipeSitemap($page: Int!, $pageSize: Int!) {
    recipes_connection(
      pagination: { page: $page, pageSize: $pageSize }
      sort: ["PublishedDate:desc"]
      status: PUBLISHED
      filters: {
        Title: { notContainsi: "Recipe Title" }
        ShortDescription: { notContainsi: "Etiam id nisi" }
      }
    ) {
      nodes {
        Slug
        PublishedDate
        updatedAt
      }
      pageInfo {
        page
        pageCount
        total
      }
    }
  }
`

async function getRecipeSitemapEntries() {
  const pageSize = 100
  let page = 1
  let pageCount = 1
  const entries = []

  do {
    const data = await fetchGraphql(recipeSitemapQuery, { page, pageSize })
    const connection = data?.recipes_connection
    const recipes = connection?.nodes || []

    entries.push(
      ...recipes
        .filter((recipe) => recipe.Slug)
        .map((recipe) => ({
          loc: `/us/recipes/${recipe.Slug}`,
          changefreq: "weekly",
          priority: 0.75,
          lastmod:
            recipe.updatedAt ||
            (recipe.PublishedDate
              ? new Date(recipe.PublishedDate).toISOString()
              : new Date().toISOString()),
        }))
    )

    pageCount = connection?.pageInfo?.pageCount || pageCount
    page += 1
  } while (page <= pageCount)

  return entries
}

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: excludedPaths,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  robotsTxtOptions: {
    policies: crawlerUserAgents.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: privatePaths,
    })),
    additionalSitemaps: [
      // Add any additional sitemaps here if needed
    ],
  },
  additionalPaths: async () => {
    const now = new Date().toISOString()
    const staticEntries = staticPublicPaths.map((entry) => ({
      loc: entry.path,
      changefreq: entry.changefreq,
      priority: entry.priority,
      lastmod: now,
    }))
    const learnEntries = learnSlugs.map((slug) => ({
      loc: `/us/learn/${slug}`,
      changefreq: "weekly",
      priority: slug === "cuts" ? 0.9 : 0.8,
      lastmod: now,
    }))

    let productEntries = []
    try {
      productEntries = await getProductSitemapEntries()
    } catch (error) {
      console.warn("[next-sitemap] Product sitemap fetch failed:", error)
    }

    let recipeEntries = []
    try {
      recipeEntries = await getRecipeSitemapEntries()
    } catch (error) {
      console.warn("[next-sitemap] Recipe sitemap fetch failed:", error)
    }

    return [
      ...staticEntries,
      ...learnEntries,
      ...productEntries,
      ...recipeEntries,
    ]
  },
  // Transform function to customize sitemap entries
  transform: async (config, path) => {
    // Higher priority for main pages
    let priority = config.priority
    let changefreq = config.changefreq

    if (path === "/" || path.match(/^\/[a-z]{2}$/)) {
      priority = 1.0
      changefreq = "daily"
    } else if (path.includes("/products/")) {
      priority = 0.8
      changefreq = "weekly"
    } else if (path.includes("/collections/")) {
      priority = 0.8
      changefreq = "weekly"
    } else if (path.includes("/recipes/")) {
      priority = 0.7
      changefreq = "weekly"
    } else if (path.includes("/store")) {
      priority = 0.9
      changefreq = "daily"
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  },
}
