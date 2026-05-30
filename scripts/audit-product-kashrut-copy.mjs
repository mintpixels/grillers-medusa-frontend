#!/usr/bin/env node

import fs from "node:fs"

const STRAPI_ENDPOINT = process.env.STRAPI_ENDPOINT?.replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL?.replace(/\/+$/, "")
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

const args = new Set(process.argv.slice(2))
const jsonOutIndex = process.argv.findIndex((arg) => arg === "--json-out")
const jsonOutPath =
  jsonOutIndex >= 0 ? process.argv[jsonOutIndex + 1] : undefined
const failOnFindings = args.has("--fail-on-findings")

const DAIRY_TERMS = [
  ["butter", /\bbutter\b/i],
  ["butter baste", /\bbutter[-\s]?bast/i],
  ["ghee", /\bghee\b/i],
  ["milk", /\bmilk\b/i],
  ["cream", /\bcream\b/i],
  ["half and half", /\bhalf[-\s]?and[-\s]?half\b/i],
  ["yogurt", /\byogurt\b/i],
  ["sour cream", /\bsour cream\b/i],
  ["cheese", /\bcheese\b/i],
  ["cheddar", /\bcheddar\b/i],
  ["mozzarella", /\bmozzarella\b/i],
  ["parmesan", /\bparmesan\b/i],
  ["feta", /\bfeta\b/i],
  ["ricotta", /\bricotta\b/i],
  ["brie", /\bbrie\b/i],
  ["blue cheese", /\bblue cheese\b/i],
  ["alfredo", /\balfredo\b/i],
  ["hollandaise", /\bhollandaise\b/i],
  ["bearnaise", /\bb[ée]arnaise\b/i],
  ["bechamel", /\bb[ée]chamel\b/i],
  ["tzatziki", /\btzatziki\b/i],
  ["queso", /\bqueso\b/i],
  ["creme fraiche", /\bcr[eè]me fra[iî]che\b|\bcreme fraiche\b/i],
]

const MEAT_TERMS =
  /\b(beef|steak|burger|hamburger|brisket|ribeye|rib eye|delmonico|chuck|roast|short rib|flanken|oxtail|veal|lamb|chicken|turkey|duck|goose|poultry|pastrami|salami|bologna|frank|hot ?dog|sausage|kebab|kebob|shank|shoulder|breast|thigh|drumstick|wing|cutlet|schnitzel|meat)\b/i

const SPECIFIC_MEAT_TERMS =
  /\b(beef|steak|burger|hamburger|brisket|ribeye|rib eye|delmonico|chuck|roast|short rib|flanken|oxtail|veal|lamb|chicken|turkey|duck|goose|poultry|pastrami|salami|bologna|frank|hot ?dog|sausage|kebab|kebob|shank|shoulder|breast|thigh|drumstick|wing|cutlet|schnitzel)\b/i

const FISH_TERMS =
  /\b(fish|salmon|trout|tilapia|tuna|cod|herring|whitefish|imitation crab|sushi)\b/i

const DAIRY_PRODUCT_TERMS =
  /\b(cheese|cheddar|mozzarella|cholov|dairy|milk chocolate|butter)\b/i

const PAREVE_TERMS = /\b(pareve|parve|non-dairy|dairy-free)\b/i

const PASSOVER_CHAMETZ_TERMS = [
  ["flour", /\bflour\b/i],
  ["bread crumbs", /\bbread[-\s]?crumbs?\b/i],
  ["panko", /\bpanko\b/i],
  ["rye", /\brye\b/i],
  ["challah", /\bchallah\b/i],
  ["bun", /\bbuns?\b/i],
  ["pasta", /\bpasta\b/i],
  ["noodles", /\bnoodles?\b/i],
  ["beer", /\bbeer\b/i],
]

function assertEnv() {
  const missing = []
  if (!STRAPI_ENDPOINT) missing.push("STRAPI_ENDPOINT")
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN")
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`)
  }
}

async function strapiGraphql(query, variables = {}) {
  const response = await fetch(`${STRAPI_ENDPOINT}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await response.json()
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors || json, null, 2))
  }
  return json.data
}

async function fetchStrapiProducts() {
  const query = `query Products($page: Int!) {
    products_connection(pagination: { page: $page, pageSize: 100 }) {
      pageInfo { page pageSize pageCount total }
      nodes {
        documentId
        publishedAt
        Title
        medusa_product_id
        SEO { metaTitle metaDescription keywords }
        SocialMeta { ogTitle ogDescription twitterTitle twitterDescription }
        Metadata { Meat Dairy Pareve KosherForPassover Uncooked Cooked }
        Categorization {
          ProductTags { Name }
          ProductCollections { Name Slug }
        }
        MedusaProduct {
          ProductId
          Title
          Handle
          Description
          ShortDescription
        }
      }
    }
  }`

  const first = await strapiGraphql(query, { page: 1 })
  const connection = first.products_connection
  const products = [...connection.nodes]

  for (let page = 2; page <= connection.pageInfo.pageCount; page += 1) {
    const data = await strapiGraphql(query, { page })
    products.push(...data.products_connection.nodes)
  }

  return products
}

async function fetchMedusaProducts() {
  if (!MEDUSA_BACKEND_URL || !MEDUSA_PUBLISHABLE_KEY) return []

  const products = []
  for (let offset = 0; ; offset += 100) {
    const url = `${MEDUSA_BACKEND_URL}/store/products?limit=100&offset=${offset}&fields=id,title,handle,description`
    const response = await fetch(url, {
      headers: { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY },
    })
    const json = await response.json()
    if (!response.ok) {
      throw new Error(JSON.stringify(json, null, 2))
    }
    products.push(...(json.products || []))
    if (!json.count || offset + (json.products || []).length >= json.count) {
      break
    }
  }
  return products
}

function productIdentity(product) {
  return [
    product.Title,
    product.title,
    product.MedusaProduct?.Title,
    product.handle,
    product.MedusaProduct?.Handle,
    ...(product.Categorization?.ProductTags || []).map((tag) => tag.Name),
    ...(product.Categorization?.ProductCollections || []).map(
      (collection) => collection.Name
    ),
  ]
    .filter(Boolean)
    .join(" | ")
}

function isPareveProduct(product) {
  const identity = productIdentity(product)
  return Boolean(product.Metadata?.Pareve || PAREVE_TERMS.test(identity))
}

function isDairyProduct(product) {
  const identity = productIdentity(product)
  return Boolean(product.Metadata?.Dairy || DAIRY_PRODUCT_TERMS.test(identity))
}

function isFishProduct(product) {
  const identity = productIdentity(product)
  return FISH_TERMS.test(identity) && !MEAT_TERMS.test(identity)
}

function isMeatProduct(product) {
  const identity = productIdentity(product)
  if (product.Metadata?.Meat) return true
  if (SPECIFIC_MEAT_TERMS.test(identity)) return true
  if (
    isPareveProduct(product) ||
    isDairyProduct(product) ||
    isFishProduct(product)
  ) {
    return false
  }
  return MEAT_TERMS.test(identity)
}

function isPassoverProduct(product) {
  const identity = productIdentity(product)
  if (product.Metadata?.KosherForPassover) return true
  if (/\bnot kosher for passover\b/i.test(identity)) return false
  return /\b(kosher for passover|kfp|pesach)\b/i.test(identity)
}

function strapiFields(product) {
  return [
    ["MedusaProduct.Description", product.MedusaProduct?.Description],
    ["MedusaProduct.ShortDescription", product.MedusaProduct?.ShortDescription],
    ["SEO.metaDescription", product.SEO?.metaDescription],
    ["SocialMeta.ogDescription", product.SocialMeta?.ogDescription],
    ["SocialMeta.twitterDescription", product.SocialMeta?.twitterDescription],
  ].filter(([, value]) => typeof value === "string" && value.trim())
}

function medusaFields(product) {
  return [["description", product.description]].filter(
    ([, value]) => typeof value === "string" && value.trim()
  )
}

function findTermMatches(text, termList) {
  return termList.filter(([, regex]) => regex.test(text)).map(([label]) => label)
}

function isAllowedPassoverFlourContext(text) {
  const flourMatches = text.match(/\b(?:almond|potato|coconut|tapioca|cassava|matzo)[-\s]+flour\b/gi)
  const allFlourMatches = text.match(/\bflour\b/gi)
  return Boolean(
    allFlourMatches?.length && flourMatches?.length === allFlourMatches.length
  )
}

function findPassoverChametzMatches(text, product) {
  const matches = []
  const identity = productIdentity(product)
  for (const [label, regex] of PASSOVER_CHAMETZ_TERMS) {
    if (!regex.test(text)) continue
    if (label === "flour" && isAllowedPassoverFlourContext(text)) continue
    if (
      label === "panko" &&
      /\bpanko[-\s]?style matzo meal\b/i.test(`${identity} ${text}`)
    ) {
      continue
    }
    matches.push(label)
  }
  return matches
}

function auditProduct({ source, product, fields }) {
  const findings = []
  const meat = isMeatProduct(product)
  const dairy = isDairyProduct(product)
  const fish = isFishProduct(product)
  const passover = isPassoverProduct(product)

  for (const [field, text] of fields(product)) {
    if (meat) {
      const dairyMatches = findTermMatches(text, DAIRY_TERMS)
      if (dairyMatches.length) {
        findings.push({
          source,
          severity: "blocker",
          rule: "meat_copy_contains_dairy_language",
          matches: dairyMatches,
          field,
          text,
        })
      }
      if (FISH_TERMS.test(text) && !FISH_TERMS.test(productIdentity(product))) {
        findings.push({
          source,
          severity: "blocker",
          rule: "meat_copy_contains_fish_language",
          matches: ["fish"],
          field,
          text,
        })
      }
    }

    if (dairy && MEAT_TERMS.test(text)) {
      findings.push({
        source,
        severity: "blocker",
        rule: "dairy_copy_contains_meat_language",
        matches: ["meat"],
        field,
        text,
      })
    }

    if (fish && MEAT_TERMS.test(text)) {
      findings.push({
        source,
        severity: "blocker",
        rule: "fish_copy_contains_meat_language",
        matches: ["meat"],
        field,
        text,
      })
    }

    if (passover) {
      const passoverMatches = findPassoverChametzMatches(text, product)
      if (passoverMatches.length) {
        findings.push({
          source,
          severity: "blocker",
          rule: "passover_copy_contains_chametz_language",
          matches: passoverMatches,
          field,
          text,
        })
      }
    }
  }

  return findings.map((finding) => ({
    ...finding,
    productId: product.medusa_product_id || product.id,
    documentId: product.documentId,
    title: product.Title || product.title,
    handle: product.MedusaProduct?.Handle || product.handle,
  }))
}

function summarize(findings) {
  const byRule = findings.reduce((acc, finding) => {
    acc[finding.rule] = (acc[finding.rule] || 0) + 1
    return acc
  }, {})

  return {
    findings: findings.length,
    byRule,
  }
}

async function main() {
  assertEnv()
  const strapiProducts = await fetchStrapiProducts()
  const medusaProducts = await fetchMedusaProducts()

  const findings = [
    ...strapiProducts.flatMap((product) =>
      auditProduct({ source: "strapi", product, fields: strapiFields })
    ),
    ...medusaProducts.flatMap((product) =>
      auditProduct({ source: "medusa", product, fields: medusaFields })
    ),
  ]

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      strapiProducts: strapiProducts.length,
      medusaProducts: medusaProducts.length,
    },
    summary: summarize(findings),
    findings,
  }

  if (jsonOutPath) {
    fs.writeFileSync(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`)
  }

  console.log(JSON.stringify(report.summary, null, 2))
  if (findings.length) {
    for (const finding of findings) {
      console.log(
        `- [${finding.source}] ${finding.rule}: ${finding.title} :: ${finding.field} :: ${finding.matches.join(", ")}`
      )
    }
  }

  if (failOnFindings && findings.length) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
