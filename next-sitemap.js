/** @type {import('next-sitemap').IConfig} */

const excludedPaths = [
  "/checkout",
  "/checkout/*",
  "/account",
  "/account/*",
  "/cart",
  "/order/*",
  "/api/*",
]

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "https://grillerspride.com",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: excludedPaths,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: excludedPaths,
      },
    ],
    additionalSitemaps: [
      // Add any additional sitemaps here if needed
    ],
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
