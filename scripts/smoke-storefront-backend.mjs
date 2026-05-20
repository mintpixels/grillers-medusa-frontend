#!/usr/bin/env node

import fs from "node:fs"
import process from "node:process"

const DEFAULT_STOREFRONT_URL = "https://grillers-medusa-frontend.vercel.app"
const DEFAULT_BACKEND_URL =
  "https://grillers-medusa-admin-production.up.railway.app"

function readDotEnv(file = ".env") {
  if (!fs.existsSync(file)) return {}

  const env = {}
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }

  return env
}

function argValue(name) {
  const equalsPrefix = `--${name}=`
  const equalsArg = process.argv.find((arg) => arg.startsWith(equalsPrefix))
  if (equalsArg) return equalsArg.slice(equalsPrefix.length)

  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function normalizeUrl(url) {
  return (url || "").replace(/\/+$/, "")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function fetchText(label, url, options = {}) {
  const startedAt = Date.now()
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    ...options,
    headers: {
      accept: "text/html,application/json,text/plain",
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  const elapsed = Date.now() - startedAt

  if (!response.ok) {
    throw new Error(
      `${label} failed: HTTP ${response.status} in ${elapsed}ms. Body: ${text
        .replace(/\s+/g, " ")
        .slice(0, 500)}`
    )
  }

  return { response, text, elapsed }
}

async function fetchJson(label, url, options = {}) {
  const result = await fetchText(label, url, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  })

  try {
    return { ...result, json: JSON.parse(result.text) }
  } catch {
    throw new Error(`${label} returned non-JSON body: ${result.text.slice(0, 300)}`)
  }
}

function assertNoBrokenSignals(label, html) {
  const brokenSignals = [
    "Application not found",
    "Something went wrong",
    "This page could not be found",
    "Medusa T-Shirt",
    "No regions found",
    "Could not fetch",
    "Error fetching regions",
  ]

  for (const signal of brokenSignals) {
    assert(!html.includes(signal), `${label} contains broken signal: ${signal}`)
  }
}

function chooseProduct(products) {
  for (const product of products) {
    const variant = product.variants?.find((candidate) => candidate?.id)
    if (product.handle && variant?.id) {
      return { product, variant }
    }
  }
  return null
}

const dotEnv = readDotEnv()
const storefrontUrl = normalizeUrl(
  argValue("storefront-url") ||
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    dotEnv.STOREFRONT_URL ||
    dotEnv.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_STOREFRONT_URL
)
const backendUrl = normalizeUrl(
  argValue("backend-url") ||
    process.env.MEDUSA_BACKEND_URL ||
    dotEnv.MEDUSA_BACKEND_URL ||
    DEFAULT_BACKEND_URL
)
const publishableKey =
  argValue("publishable-key") ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  dotEnv.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const countryCode =
  argValue("country-code") ||
  process.env.NEXT_PUBLIC_DEFAULT_REGION ||
  dotEnv.NEXT_PUBLIC_DEFAULT_REGION ||
  "us"

assert(storefrontUrl, "Missing storefront URL")
assert(backendUrl, "Missing Medusa backend URL")
assert(publishableKey, "Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")

const storeHeaders = {
  "x-publishable-api-key": publishableKey,
}

console.log(`Checking storefront: ${storefrontUrl}`)
console.log(`Checking Medusa backend: ${backendUrl}`)

const health = await fetchText("backend health", `${backendUrl}/health`, {
  headers: { accept: "text/plain" },
})
assert(
  health.text.trim() === "OK",
  `Expected backend /health to return OK, got ${JSON.stringify(health.text)}`
)
console.log(`ok backend /health (${health.elapsed}ms)`)

const regions = await fetchJson("backend regions", `${backendUrl}/store/regions`, {
  headers: storeHeaders,
})
assert(
  Array.isArray(regions.json?.regions) && regions.json.regions.length > 0,
  "Expected backend /store/regions to return regions"
)

const region =
  regions.json.regions.find((candidate) =>
    candidate.countries?.some(
      (country) => country?.iso_2?.toLowerCase() === countryCode.toLowerCase()
    )
  ) || regions.json.regions[0]
assert(region?.id, "Could not choose a Medusa region for cart creation")
console.log(`ok backend /store/regions (${regions.json.regions.length} regions)`)

const products = await fetchJson(
  "backend products",
  `${backendUrl}/store/products?limit=25`,
  { headers: storeHeaders }
)
assert(
  Array.isArray(products.json?.products) && products.json.products.length > 0,
  "Expected backend /store/products to return products"
)
assert(
  !products.json.products.some((product) => product.title === "Medusa T-Shirt"),
  "Backend appears to be serving Medusa seed products"
)

const selection = chooseProduct(products.json.products)
assert(selection, "Could not find a product with a handle and variant id")
const { product, variant } = selection
console.log(`ok backend /store/products (${product.title || product.handle})`)

const cartCreate = await fetchJson("cart create", `${backendUrl}/store/carts`, {
  method: "POST",
  headers: storeHeaders,
  body: JSON.stringify({ region_id: region.id }),
})
const cartId = cartCreate.json?.cart?.id
assert(cartId, "Expected cart create to return cart.id")

const cartLine = await fetchJson(
  "cart add line item",
  `${backendUrl}/store/carts/${cartId}/line-items`,
  {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({
      variant_id: variant.id,
      quantity: 1,
    }),
  }
)
const cart = cartLine.json?.cart
assert(cart?.items?.length, "Expected cart to contain at least one line item")
assert(
  cart.subtotal != null || cart.total != null,
  "Expected cart add response to include live pricing totals"
)
console.log(`ok backend cart create/add (${cartId})`)

const cookie = `_medusa_cart_id=${cartId}; _medusa_region_id=${region.id}`
const routeChecks = [
  {
    label: "home",
    url: `${storefrontUrl}/${countryCode}`,
    mustContain: "Griller",
  },
  {
    label: "pdp",
    url: `${storefrontUrl}/${countryCode}/products/${product.handle}`,
    mustContain: product.title || product.handle,
  },
  {
    label: "cart",
    url: `${storefrontUrl}/${countryCode}/cart`,
    headers: { cookie },
    mustContain: product.title || product.handle,
  },
  {
    label: "checkout",
    url: `${storefrontUrl}/${countryCode}/checkout`,
    headers: { cookie },
    mustContain: "Checkout",
  },
  {
    label: "account",
    url: `${storefrontUrl}/${countryCode}/account`,
    mustContain: "Sign in",
  },
]

for (const check of routeChecks) {
  const page = await fetchText(`storefront ${check.label}`, check.url, {
    headers: check.headers,
  })
  assertNoBrokenSignals(`storefront ${check.label}`, page.text)
  assert(
    page.text.toLowerCase().includes(check.mustContain.toLowerCase()),
    `storefront ${check.label} did not contain expected text: ${check.mustContain}`
  )
  console.log(`ok storefront ${check.label} (${page.elapsed}ms)`)
}

console.log("Storefront/backend smoke check passed.")
