import { Suspense } from "react"
import { getBaseURL, isProductionHost } from "@lib/util/env"
import { Metadata } from "next"
import { rexton, maisonNeue, maisonNeueMono } from "styles/fonts/fonts"
import NextTopLoader from "nextjs-toploader"
import AnalyticsProvider from "../components/analytics-provider"
import JitsuScript from "../components/jitsu-script"
import CookieConsentProvider from "../components/cookie-consent-provider"
import GlobalErrorListeners from "../components/global-error-listeners"
import "styles/globals.css"
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
} from "@lib/util/seo"

const TYPEKIT_STYLESHEET = "https://use.typekit.net/ddo8gwe.css"

// Site-wide robots policy. Production indexes normally; every other
// environment (Vercel previews, localhost) emits `noindex, nofollow` so
// search engines can't index staging URLs and split ranking signal away
// from the live site. See issue #45.
const robots = isProductionHost()
  ? { index: true, follow: true }
  : { index: false, follow: false }

function getStrapiMediaOrigin() {
  const endpoint = process.env.STRAPI_ENDPOINT
  if (!endpoint) return null

  try {
    const url = new URL(endpoint)
    if (url.hostname.endsWith(".strapiapp.com")) {
      url.hostname = url.hostname.replace(
        ".strapiapp.com",
        ".media.strapiapp.com"
      )
      return url.origin
    }
  } catch {
    return null
  }

  return null
}

function getAlgoliaDsnOrigin() {
  const appId = process.env.ALGOLIA_APPLICATION_ID?.replace(/^['"]|['"]$/g, "")
  return appId ? `https://${appId.toLowerCase()}-dsn.algolia.net` : null
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  applicationName: SITE_NAME,
  title: DEFAULT_SEO_TITLE,
  description: DEFAULT_SEO_DESCRIPTION,
  robots,
  openGraph: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    type: "website",
    url: getBaseURL(),
    siteName: SITE_NAME,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const baseUrl = getBaseURL()
  const strapiMediaOrigin = getStrapiMediaOrigin()
  const algoliaDsnOrigin = getAlgoliaDsnOrigin()
  const asyncTypekitLoader = `
!function(d){
  var href=${JSON.stringify(TYPEKIT_STYLESHEET)};
  if(d.querySelector('link[href="'+href+'"]')) return;
  var l=d.createElement('link');
  l.rel='stylesheet';
  l.href=href;
  l.media='print';
  l.onload=function(){this.media='all'};
  d.head.appendChild(l);
}(document);
`
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
        {strapiMediaOrigin && (
          <link rel="preconnect" href={strapiMediaOrigin} crossOrigin="" />
        )}
        {algoliaDsnOrigin && (
          <link rel="preconnect" href={algoliaDsnOrigin} crossOrigin="" />
        )}
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://p.typekit.net" />
        <script dangerouslySetInnerHTML={{ __html: asyncTypekitLoader }} />
        <noscript>
          <link rel="stylesheet" href={TYPEKIT_STYLESHEET} />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
        <Suspense fallback={null}>
          <JitsuScript />
        </Suspense>
        <Suspense fallback={null}>
          <CookieConsentProvider />
        </Suspense>
        <GlobalErrorListeners />
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
          template='<div class="bar" role="bar" aria-hidden="true"><div class="peg"></div></div><div class="spinner" role="spinner" aria-hidden="true"><div class="spinner-icon"></div></div>'
        />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
