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

async function fetchTextResult(label, url, options = {}) {
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

  return { response, text, elapsed, ok: response.ok, status: response.status }
}

async function fetchText(label, url, options = {}) {
  const result = await fetchTextResult(label, url, options)

  if (!result.ok) {
    throw new Error(
      `${label} failed: HTTP ${result.status} in ${result.elapsed}ms. Body: ${result.text
        .replace(/\s+/g, " ")
        .slice(0, 500)}`
    )
  }

  return result
}

async function fetchJsonResult(label, url, options = {}) {
  const result = await fetchTextResult(label, url, {
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
    if (result.ok) {
      throw new Error(`${label} returned non-JSON body: ${result.text.slice(0, 300)}`)
    }
    return { ...result, json: null }
  }
}

async function fetchJson(label, url, options = {}) {
  const result = await fetchJsonResult(label, url, options)

  if (!result.ok) {
    throw new Error(
      `${label} failed: HTTP ${result.status} in ${result.elapsed}ms. Body: ${result.text
        .replace(/\s+/g, " ")
        .slice(0, 500)}`
    )
  }

  return result
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

function productVariantCandidates(products) {
  const candidates = []
  for (const product of products) {
    if (!product.handle) continue
    for (const variant of product.variants || []) {
      if (variant?.id) candidates.push({ product, variant })
    }
  }
  return candidates
}

function positiveNumber(...values) {
  return values.some((value) => Number.isFinite(value) && value > 0)
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
  `${backendUrl}/store/products?limit=50&region_id=${encodeURIComponent(
    region.id
  )}`,
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

const candidates = productVariantCandidates(products.json.products)
assert(candidates.length > 0, "Could not find a product with a handle and variant id")
const { product } = candidates[0]
console.log(`ok backend /store/products (${product.title || product.handle})`)

const cartCreate = await fetchJson("cart create", `${backendUrl}/store/carts`, {
  method: "POST",
  headers: storeHeaders,
  body: JSON.stringify({ region_id: region.id }),
})
const cartId = cartCreate.json?.cart?.id
assert(cartId, "Expected cart create to return cart.id")

let cartLine = null
let selection = null
let lastAddFailure = null
for (const candidate of candidates) {
  const result = await fetchJsonResult(
    "cart add line item",
    `${backendUrl}/store/carts/${cartId}/line-items`,
    {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({
        variant_id: candidate.variant.id,
        quantity: 1,
      }),
    }
  )

  if (result.ok) {
    cartLine = result
    selection = candidate
    break
  }

  lastAddFailure = `HTTP ${result.status}: ${result.text
    .replace(/\s+/g, " ")
    .slice(0, 200)}`
}

assert(
  cartLine && selection,
  `Expected at least one catalog variant to be addable to cart. Last failure: ${
    lastAddFailure || "none"
  }`
)
const cart = cartLine.json?.cart
assert(cart?.items?.length, "Expected cart to contain at least one line item")
assert(
  positiveNumber(cart.subtotal, cart.total, cart.items[0]?.unit_price, cart.items[0]?.subtotal),
  "Expected cart add response to include positive live pricing totals"
)
console.log(`ok backend cart create/add (${cartId})`)

const cookie = `_medusa_cart_id=${cartId}; _medusa_region_id=${region.id}`
const { product: selectedProduct } = selection
const routeChecks = [
  {
    label: "home",
    url: `${storefrontUrl}/${countryCode}`,
    mustContain: "Griller",
  },
  {
    label: "pdp",
    url: `${storefrontUrl}/${countryCode}/products/${selectedProduct.handle}`,
    mustContain: selectedProduct.title || selectedProduct.handle,
  },
  {
    label: "cart",
    url: `${storefrontUrl}/${countryCode}/cart`,
    headers: { cookie },
    mustContain: selectedProduct.title || selectedProduct.handle,
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
