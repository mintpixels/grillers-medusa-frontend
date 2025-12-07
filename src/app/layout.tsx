import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { rexton, maisonNeue, maisonNeueMono } from "styles/fonts/fonts"
import NextTopLoader from "nextjs-toploader"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${rexton.variable} ${maisonNeue.variable} ${maisonNeueMono.variable}`}
    >
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/ddo8gwe.css" />
      </head>
      <body>
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
