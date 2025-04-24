import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { rexton, maisonNeue, maisonNeueMono } from "styles/fonts/fonts"
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
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
