#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const ADMIN_JWT_CACHE = "/tmp/strapi_admin_jwt.txt"
const DEFAULT_AUDIT_PATH = path.join(
  ROOT,
  "analysis/recipe-bucket-audit-2026-05-15.json"
)
const APPLY = process.argv.includes("--apply")
const SKIP_SCHEMA_CHECK = process.argv.includes("--skip-schema-check")
const LIMIT = parseIntegerArg("--limit")
const OFFSET = parseIntegerArg("--offset") || 0
const DOCUMENT_ID = argValue("--document-id")
const AUDIT_PATH = path.resolve(argValue("--audit") || DEFAULT_AUDIT_PATH)
const REQUIRED_SCHEMA_FIELDS = [
  "PrimaryRecipeBucket",
  "RecipeBuckets",
  "RecipeBucketAssignments",
  "RecipeOccasions",
  "RecipeProteins",
  "RecipeCutFamilies",
  "RecipeMethods",
  "EffortLevel",
  "KfpStatus",
  "PrepTimeMinutes",
  "CookTimeMinutes",
  "TotalTimeMinutes",
  "ServingsMin",
  "ServingsMax",
  "MakeAhead",
  "FreezerFriendly",
  "TaxonomyVersion",
  "TaxonomyReviewNeeded",
  "TaxonomyReviewStatus",
  "TaxonomyReasons",
  "RecipeAttributes",
  "RecommendationSignals",
  "RecommendationExclusions",
  "PersonalizationTags",
  "MerchandisingWeight",
]

loadDotEnv(path.join(ROOT, ".env"))

const STRAPI_ENDPOINT = process.env.STRAPI_ENDPOINT?.replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

if (!STRAPI_ENDPOINT || !STRAPI_API_TOKEN) {
  throw new Error("Missing STRAPI_ENDPOINT or STRAPI_API_TOKEN")
}

function getAdminJwt() {
  if (process.env.STRAPI_ADMIN_JWT) return process.env.STRAPI_ADMIN_JWT
  if (fs.existsSync(ADMIN_JWT_CACHE)) {
    return fs.readFileSync(ADMIN_JWT_CACHE, "utf8").trim()
  }
  throw new Error(`Missing STRAPI_ADMIN_JWT and ${ADMIN_JWT_CACHE}`)
}

async function graphql(query, variables = {}) {
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
    throw new Error(
      JSON.stringify(
        {
          status: response.status,
          errors: json.errors,
        },
        null,
        2
      )
    )
  }

  return json.data
}

async function adminJson(route, options = {}) {
  const response = await fetch(`${STRAPI_ENDPOINT}${route}`, {
    ...options,
    headers: {
      authorization: `Bearer ${getAdminJwt()}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`)
  }

  return text ? JSON.parse(text) : null
}

async function assertLiveSchema() {
  const data = await graphql(`
    query RecipeTaxonomySchemaCheck {
      __type(name: "Recipe") {
        fields {
          name
        }
      }
    }
  `)
  const fields = new Set(data.__type?.fields?.map((field) => field.name) || [])
  const missing = REQUIRED_SCHEMA_FIELDS.filter((field) => !fields.has(field))

  if (missing.length) {
    throw new Error(
      `Live Strapi Recipe GraphQL schema is missing fields: ${missing.join(
        ", "
      )}. Deploy the Strapi schema before running --apply.`
    )
  }
}

function loadAudit() {
  const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"))
  const recipes = audit.recipes || []
  return {
    ...audit,
    recipes: recipes
      .filter((recipe) => !DOCUMENT_ID || recipe.documentId === DOCUMENT_ID)
      .slice(OFFSET, LIMIT ? OFFSET + LIMIT : undefined),
  }
}

function writebackPayload(recipe) {
  const candidate = recipe.strapiWritebackCandidate
  if (!candidate) {
    throw new Error(`Missing strapiWritebackCandidate for ${recipe.documentId}`)
  }

  return removeNullish({
    PrimaryRecipeBucket: candidate.PrimaryRecipeBucket,
    RecipeBuckets: candidate.RecipeBuckets,
    RecipeBucketAssignments: candidate.RecipeBucketAssignments,
    RecipeOccasions: candidate.RecipeOccasions,
    RecipeProteins: candidate.RecipeProteins,
    RecipeCutFamilies: candidate.RecipeCutFamilies,
    RecipeMethods: candidate.RecipeMethods,
    EffortLevel: candidate.EffortLevel,
    KfpStatus: candidate.KfpStatus,
    PrepTimeMinutes: candidate.PrepTimeMinutes,
    CookTimeMinutes: candidate.CookTimeMinutes,
    TotalTimeMinutes: candidate.TotalTimeMinutes,
    ServingsMin: candidate.ServingsMin,
    ServingsMax: candidate.ServingsMax,
    MakeAhead: candidate.MakeAhead,
    FreezerFriendly: candidate.FreezerFriendly,
    TaxonomyVersion: candidate.TaxonomyVersion,
    TaxonomyReviewNeeded: candidate.TaxonomyReviewNeeded,
    TaxonomyReviewStatus: candidate.TaxonomyReviewStatus,
    TaxonomyReasons: candidate.TaxonomyReasons,
    RecipeAttributes: candidate.RecipeAttributes,
    RecommendationSignals: candidate.RecommendationSignals,
    RecommendationExclusions: candidate.RecommendationExclusions,
    PersonalizationTags: candidate.PersonalizationTags,
    MerchandisingWeight: candidate.MerchandisingWeight,
  })
}

async function writeRecipe(recipe, index, total) {
  const payload = writebackPayload(recipe)

  if (!APPLY) {
    return {
      mode: "dry-run",
      documentId: recipe.documentId,
      title: recipe.title,
      primaryBucket: payload.PrimaryRecipeBucket,
      buckets: payload.RecipeBuckets,
    }
  }

  await adminJson(
    `/content-manager/collection-types/api::recipe.recipe/${recipe.documentId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  )
  await adminJson(
    `/content-manager/collection-types/api::recipe.recipe/${recipe.documentId}/actions/publish`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )

  const readback = (
    await adminJson(
      `/content-manager/collection-types/api::recipe.recipe/${recipe.documentId}`
    )
  ).data

  if (readback.PrimaryRecipeBucket !== payload.PrimaryRecipeBucket) {
    throw new Error(
      `Readback mismatch for ${recipe.documentId}: expected ${payload.PrimaryRecipeBucket}, got ${readback.PrimaryRecipeBucket}`
    )
  }

  return {
    mode: "applied",
    index,
    total,
    documentId: recipe.documentId,
    title: readback.Title || recipe.title,
    primaryBucket: readback.PrimaryRecipeBucket,
  }
}

function removeNullish(value) {
  if (Array.isArray(value)) {
    return value.map(removeNullish)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined && nested !== null)
        .map(([key, nested]) => [key, removeNullish(nested)])
    )
  }

  return value
}

function argValue(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

function parseIntegerArg(name) {
  const value = argValue(name)
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: ${value}`)
  }
  return parsed
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const index = trimmed.indexOf("=")
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, "")

    if (!process.env[key]) process.env[key] = value
  }
}

async function main() {
  const audit = loadAudit()

  if (!audit.recipes.length) {
    throw new Error("No recipes matched the requested audit slice")
  }

  if (!SKIP_SCHEMA_CHECK) {
    await assertLiveSchema()
  }

  const results = []
  const failures = []
  const total = audit.recipes.length

  for (const [index, recipe] of audit.recipes.entries()) {
    try {
      const result = await writeRecipe(recipe, index + 1, total)
      results.push(result)
      if (!APPLY || (index + 1) % 25 === 0 || index + 1 === total) {
        console.log(
          `${result.mode}: ${index + 1}/${total} ${result.title} -> ${
            result.primaryBucket
          }`
        )
      }
    } catch (error) {
      failures.push({ documentId: recipe.documentId, error: error.message })
      console.error(`failed: ${recipe.documentId}: ${error.message}`)
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        auditPath: path.relative(ROOT, AUDIT_PATH),
        total,
        succeeded: results.length,
        failed: failures.length,
        failures,
      },
      null,
      2
    )
  )

  if (failures.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
