import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

const SECRET =
  process.env.REVIEW_CLICK_SECRET ||
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.CRON_SECRET ||
  ""

function sign(platform: string, orderId: string, destination: string): string {
  return createHmac("sha256", SECRET)
    .update(`${platform}:${orderId}:${destination}`)
    .digest("base64url")
}

function timingSafeStringEq(a: string, b: string): boolean {
  const aBuf = new Uint8Array(Buffer.from(a))
  const bBuf = new Uint8Array(Buffer.from(b))
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function decodeDestination(encoded: string): string | null {
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8")
    const url = new URL(decoded)
    if (url.protocol !== "https:") return null
    if (
      ![
        "search.google.com",
        "www.google.com",
        "maps.google.com",
        "www.yelp.com",
        "yelp.com",
      ].includes(url.hostname)
    ) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

function renderRedirectHtml(opts: {
  destination: string
  platform: string
  orderId: string
}): string {
  const destination = JSON.stringify(opts.destination)
  const platform = JSON.stringify(opts.platform)
  const orderId = JSON.stringify(opts.orderId)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="refresh" content="1;url=${opts.destination.replace(/"/g, "%22")}" />
  <title>Opening review page...</title>
</head>
<body>
  <p>Opening the review page...</p>
  <script>
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "review_ask_clicked",
      review_platform: ${platform},
      order_id: ${orderId}
    });
    setTimeout(function () {
      window.location.replace(${destination});
    }, 250);
  </script>
  <p><a href="${opts.destination.replace(/"/g, "%22")}">Continue</a></p>
</body>
</html>`
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const platform = url.searchParams.get("platform") || ""
  const orderId = url.searchParams.get("order") || ""
  const encodedDestination = url.searchParams.get("d") || ""
  const providedSig = url.searchParams.get("s") || ""
  const destination = decodeDestination(encodedDestination)

  if (!SECRET || !platform || !orderId || !destination || !providedSig) {
    return NextResponse.redirect(new URL("/us", url.origin), 302)
  }

  const expected = sign(platform, orderId, encodedDestination)
  if (!timingSafeStringEq(expected, providedSig)) {
    return NextResponse.redirect(new URL("/us", url.origin), 302)
  }

  console.info("[review-click]", {
    event: "review_ask_clicked",
    platform,
    orderId,
  })

  return new NextResponse(
    renderRedirectHtml({
      destination,
      platform,
      orderId,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  )
}
