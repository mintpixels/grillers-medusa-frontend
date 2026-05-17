import { getBaseURL, isProductionHost } from "@lib/util/env"
import { Metadata } from "next"
import { rexton, maisonNeue, maisonNeueMono } from "styles/fonts/fonts"
import NextTopLoader from "nextjs-toploader"
import AnalyticsProvider from "../components/analytics-provider"
import JitsuScript from "../components/jitsu-script"
import CookieConsentProvider from "../components/cookie-consent-provider"
import "styles/globals.css"

// Site-wide robots policy. Production indexes normally; every other
// environment (Vercel previews, localhost) emits `noindex, nofollow` so
// search engines can't index staging URLs and split ranking signal away
// from the live site. See issue #45.
const robots = isProductionHost()
  ? { index: true, follow: true }
  : { index: false, follow: false }

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  robots,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const baseUrl = getBaseURL()
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "Grillers Pride",
        url: baseUrl,
        telephone: "+1-770-454-8108",
        logo: `${baseUrl}/images/logos/logo-horizontal.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Grillers Pride",
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/us/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }

  return (
    <html
      lang="en"
      data-mode="light"
      className={`${rexton.variable} ${maisonNeue.variable} ${maisonNeueMono.variable}`}
    >
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/ddo8gwe.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body>
        <AnalyticsProvider />
        <JitsuScript />
        <CookieConsentProvider />
        <NextTopLoader
          color="#1A1A1A"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #1A1A1A,0 0 5px #1A1A1A"
        />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
