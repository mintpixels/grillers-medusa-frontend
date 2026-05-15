#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const ts = require("typescript")

const ROOT = path.resolve(__dirname, "..")
const AUDIT_DATE =
  process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const TAXONOMY_VERSION =
  process.env.TAXONOMY_VERSION || `recipe-taxonomy-v1-${AUDIT_DATE}`
const ANALYSIS_DIR = path.join(ROOT, "analysis")
const DATA_DIR = path.join(ROOT, "src/modules/recipes/data")
const TAXONOMY_PATH = path.join(
  ROOT,
  "src/modules/recipes/lib/recipe-taxonomy.ts"
)
const PAGE_SIZE = 100

loadDotEnv(path.join(ROOT, ".env"))

const STRAPI_ENDPOINT = process.env.STRAPI_ENDPOINT?.replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

function loadTaxonomy() {
  const source = fs.readFileSync(TAXONOMY_PATH, "utf8")
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const mod = { exports: {} }

  new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output
  )(mod.exports, require, mod, TAXONOMY_PATH, path.dirname(TAXONOMY_PATH))

  return mod.exports
}

async function graphql(query, variables = {}) {
  if (!STRAPI_ENDPOINT) throw new Error("Missing STRAPI_ENDPOINT")
  if (!STRAPI_API_TOKEN) throw new Error("Missing STRAPI_API_TOKEN")

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

async function fetchAllRecipes() {
  const query = `
    query RecipeTaxonomyAudit($page: Int!, $pageSize: Int!) {
      recipes_connection(
        pagination: { page: $page, pageSize: $pageSize }
        sort: ["PublishedDate:desc"]
        status: PUBLISHED
        filters: {
          Title: { notContainsi: "Recipe Title" }
          ShortDescription: { notContainsi: "Etiam id nisi" }
        }
      ) {
        nodes {
          documentId
          Slug
          Title
          ShortDescription
          Image {
            url
          }
          TotalTime
          PrepTime
          CookTime
          Servings
          Difficulty
          RecipeCategories {
            Name
            Slug
          }
          Ingredients {
            ingredient
            id
          }
          Steps {
            instruction
          }
        }
        pageInfo {
          page
          pageSize
          pageCount
          total
        }
      }
    }
  `
  const getPage = (page) => graphql(query, { page, pageSize: PAGE_SIZE })
  const firstData = await getPage(1)
  const firstConnection = firstData.recipes_connection

  if (!firstConnection) return []

  const pageCount = firstConnection.pageInfo?.pageCount || 1
  const remainingPages =
    pageCount > 1
      ? await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) =>
            getPage(index + 2)
          )
        )
      : []

  return [
    ...(firstConnection.nodes || []),
    ...remainingPages.flatMap((data) => data.recipes_connection?.nodes || []),
  ]
}

function summarizeAudit(audit, buckets) {
  const bucketRows = buckets
    .map((bucket) => {
      const count = audit.bucketCounts[bucket.id] || 0
      const examples = audit.recipes
        .filter((recipe) =>
          recipe.assignments.some((item) => item.bucketId === bucket.id)
        )
        .sort((a, b) => {
          const aAssignment = a.assignments.find(
            (item) => item.bucketId === bucket.id
          )
          const bAssignment = b.assignments.find(
            (item) => item.bucketId === bucket.id
          )

          return (bAssignment?.confidence || 0) - (aAssignment?.confidence || 0)
        })
        .slice(0, 5)
        .map(
          (recipe) =>
            `  - ${recipe.title}: ${
              recipe.assignments.find((item) => item.bucketId === bucket.id)
                ?.reasons[0]
            }`
        )
        .join("\n")

      return [
        `### ${bucket.label}`,
        "",
        `Count: ${count}`,
        "",
        examples || "No recipes assigned.",
      ].join("\n")
    })
    .join("\n\n")

  return [
    `# Recipe Bucket Audit — ${AUDIT_DATE}`,
    "",
    `Generated from ${audit.total} published non-placeholder Strapi recipes using the frontend taxonomy source of truth.`,
    "",
    `Needs editorial review: ${audit.needsReviewCount}`,
    "",
    "## Bucket Counts",
    "",
    "| Bucket | Recipes |",
    "|---|---:|",
    ...buckets.map(
      (bucket) => `| ${bucket.label} | ${audit.bucketCounts[bucket.id] || 0} |`
    ),
    "",
    "## Assignment Samples",
    "",
    bucketRows,
    "",
    "## Strapi Writeback Shape",
    "",
    "Each recipe audit entry includes `primaryBucketId`, `assignments`, `attributes`, and `needsReview`. These map cleanly to future Strapi fields for occasion, cut family, method, effort level, KFP status, and editorial review state.",
    "",
  ].join("\n")
}

async function main() {
  const {
    classifyRecipe,
    getBucketById,
    parseRecipeTime,
    parseServings,
    RECIPE_BUCKETS,
  } = loadTaxonomy()
  const recipes = await fetchAllRecipes()
  const bucketCounts = Object.fromEntries(
    RECIPE_BUCKETS.map((bucket) => [bucket.id, 0])
  )
  const auditRecipes = recipes.map((recipe) => {
    const classification = classifyRecipe(recipe)
    const strapiWritebackCandidate = buildStrapiWritebackCandidate({
      recipe,
      classification,
      getBucketById,
      parseRecipeTime,
      parseServings,
    })

    for (const assignment of classification.assignments) {
      bucketCounts[assignment.bucketId] =
        (bucketCounts[assignment.bucketId] || 0) + 1
    }

    return {
      documentId: recipe.documentId,
      slug: recipe.Slug,
      title: recipe.Title,
      recipeCard: {
        documentId: recipe.documentId,
        Slug: recipe.Slug,
        Title: recipe.Title,
        ShortDescription: recipe.ShortDescription,
        Image: recipe.Image,
        RecipeCategories: recipe.RecipeCategories || [],
        TotalTime: recipe.TotalTime,
        PrepTime: recipe.PrepTime,
        CookTime: recipe.CookTime,
        Servings: recipe.Servings,
        Difficulty: recipe.Difficulty,
        Ingredients: recipe.Ingredients || [],
        PrimaryRecipeBucket: classification.primaryBucketId,
        RecipeBucketAssignments: classification.assignments,
        RecipeAttributes: classification.attributes,
        RecipeOccasions: strapiWritebackCandidate.RecipeOccasions,
        RecipeProteins: strapiWritebackCandidate.RecipeProteins,
        RecipeCutFamilies: strapiWritebackCandidate.RecipeCutFamilies,
        RecipeMethods: strapiWritebackCandidate.RecipeMethods,
        EffortLevel: strapiWritebackCandidate.EffortLevel,
        KfpStatus: strapiWritebackCandidate.KfpStatus,
        TaxonomyReviewNeeded: classification.needsReview,
      },
      categories: recipe.RecipeCategories || [],
      primaryBucketId: classification.primaryBucketId,
      primaryBucketLabel: getBucketById(classification.primaryBucketId)?.label,
      assignments: classification.assignments.map((assignment) => ({
        ...assignment,
        label: getBucketById(assignment.bucketId)?.label,
      })),
      attributes: classification.attributes,
      needsReview: classification.needsReview,
      strapiWritebackCandidate,
    }
  })

  const audit = {
    generatedAt: new Date().toISOString(),
    auditDate: AUDIT_DATE,
    source:
      "Strapi published recipes + src/modules/recipes/lib/recipe-taxonomy.ts",
    total: auditRecipes.length,
    bucketCounts,
    needsReviewCount: auditRecipes.filter((recipe) => recipe.needsReview)
      .length,
    recipes: auditRecipes,
  }

  fs.mkdirSync(ANALYSIS_DIR, { recursive: true })
  fs.mkdirSync(DATA_DIR, { recursive: true })

  const jsonPath = path.join(
    ANALYSIS_DIR,
    `recipe-bucket-audit-${AUDIT_DATE}.json`
  )
  const mdPath = path.join(ANALYSIS_DIR, `recipe-bucket-audit-${AUDIT_DATE}.md`)
  const generatedPath = path.join(
    DATA_DIR,
    "recipe-bucket-audit.generated.json"
  )

  fs.writeFileSync(jsonPath, `${JSON.stringify(audit, null, 2)}\n`)
  fs.writeFileSync(mdPath, summarizeAudit(audit, RECIPE_BUCKETS))
  fs.writeFileSync(
    generatedPath,
    `${JSON.stringify(
      {
        generatedAt: audit.generatedAt,
        auditDate: AUDIT_DATE,
        total: audit.total,
        bucketCounts,
        needsReviewCount: audit.needsReviewCount,
        recipeCards: audit.recipes.map((recipe) => recipe.recipeCard),
        recipesBySlug: Object.fromEntries(
          audit.recipes.map((recipe) => [
            recipe.slug,
            {
              documentId: recipe.documentId,
              title: recipe.title,
              primaryBucketId: recipe.primaryBucketId,
              assignments: recipe.assignments,
              attributes: recipe.attributes,
              needsReview: recipe.needsReview,
            },
          ])
        ),
      },
      null,
      2
    )}\n`
  )

  console.log(
    JSON.stringify(
      {
        total: audit.total,
        bucketCounts,
        needsReviewCount: audit.needsReviewCount,
        jsonPath: path.relative(ROOT, jsonPath),
        markdownPath: path.relative(ROOT, mdPath),
        generatedPath: path.relative(ROOT, generatedPath),
      },
      null,
      2
    )
  )
}

function buildStrapiWritebackCandidate({
  recipe,
  classification,
  getBucketById,
  parseRecipeTime,
  parseServings,
}) {
  const buckets = classification.assignments.map((item) => item.bucketId)
  const primaryAssignment = classification.assignments.find(
    (item) => item.bucketId === classification.primaryBucketId
  )
  const occasions = inferOccasions(classification)
  const kfpStatus = classification.attributes.kfpCandidate
    ? "kfp_candidate"
    : "unknown"
  const prepTimeMinutes = parseRecipeTime(recipe.PrepTime)
  const cookTimeMinutes = parseRecipeTime(recipe.CookTime)
  const totalTimeMinutes =
    parseRecipeTime(recipe.TotalTime) ||
    (prepTimeMinutes !== null && cookTimeMinutes !== null
      ? prepTimeMinutes + cookTimeMinutes
      : classification.attributes.timeMinutes)
  const servings = parseServings(recipe.Servings)
  const reasonsByBucket = Object.fromEntries(
    classification.assignments.map((assignment) => [
      assignment.bucketId,
      assignment.reasons,
    ])
  )
  const signalsByBucket = Object.fromEntries(
    classification.assignments.map((assignment) => [
      assignment.bucketId,
      assignment.signals,
    ])
  )
  const makeAhead = hasAnySignal(classification, ["make ahead", "make-ahead"])
  const freezerFriendly = recipeText(recipe).includes("freezer")
  const personalizationTags = buildPersonalizationTags({
    buckets,
    occasions,
    proteins: classification.attributes.proteins,
    cutFamilies: classification.attributes.cutFamilies,
    methods: classification.attributes.methods,
    effortLevel: classification.attributes.effortLevel,
    kfpStatus,
  })

  return {
    PrimaryRecipeBucket: classification.primaryBucketId,
    RecipeBuckets: buckets,
    RecipeBucketAssignments: classification.assignments.map((assignment) => ({
      BucketId: assignment.bucketId,
      BucketLabel: getBucketById(assignment.bucketId)?.label || assignment.bucketId,
      Confidence: assignment.confidence,
      Reasons: assignment.reasons,
      Signals: assignment.signals,
      Source: "computed",
    })),
    RecipeOccasions: occasions,
    RecipeProteins: classification.attributes.proteins,
    RecipeCutFamilies: classification.attributes.cutFamilies,
    RecipeMethods: classification.attributes.methods,
    EffortLevel: classification.attributes.effortLevel,
    KfpStatus: kfpStatus,
    PrepTimeMinutes: prepTimeMinutes,
    CookTimeMinutes: cookTimeMinutes,
    TotalTimeMinutes: totalTimeMinutes,
    ServingsMin: servings.servingsMin,
    ServingsMax: servings.servingsMax,
    MakeAhead: makeAhead,
    FreezerFriendly: freezerFriendly,
    TaxonomyVersion: TAXONOMY_VERSION,
    TaxonomyReviewNeeded: classification.needsReview,
    TaxonomyReviewStatus: classification.needsReview
      ? "needs_editorial_review"
      : "auto_classified",
    TaxonomyReasons: classification.assignments.flatMap((item) => item.reasons),
    RecipeAttributes: classification.attributes,
    RecommendationSignals: {
      source: TAXONOMY_VERSION,
      primaryBucket: classification.primaryBucketId,
      buckets,
      occasions,
      proteins: classification.attributes.proteins,
      cutFamilies: classification.attributes.cutFamilies,
      methods: classification.attributes.methods,
      effortLevel: classification.attributes.effortLevel,
      kfpStatus,
      timeMinutes: totalTimeMinutes,
      servingsMin: servings.servingsMin,
      servingsMax: servings.servingsMax,
      reviewNeeded: classification.needsReview,
      reasonsByBucket,
      signalsByBucket,
    },
    RecommendationExclusions: [],
    PersonalizationTags: personalizationTags,
    MerchandisingWeight: Math.max(
      1,
      Math.round((primaryAssignment?.confidence || 0.1) * 100)
    ),
  }
}

function inferOccasions(classification) {
  const occasions = new Set()

  for (const assignment of classification.assignments) {
    if (assignment.bucketId === "shabbos-table") occasions.add("shabbos")
    if (assignment.bucketId === "weeknight-dinner") occasions.add("weeknight")
    if (assignment.bucketId === "yom-tov-passover") {
      occasions.add("yom_tov")
      occasions.add("passover")
      occasions.add("hosting")
    }
    if (assignment.bucketId === "kfp-briskets-roasts") {
      occasions.add("passover")
      occasions.add("kfp")
    }
    if (assignment.bucketId === "butchers-picks") {
      occasions.add("butchers_pick")
    }

    for (const signal of assignment.signals || []) {
      if (signal === "rosh hashanah" || signal === "rosh hashana") {
        occasions.add("rosh_hashanah")
      }
      if (signal === "sukkot" || signal === "sukkos") occasions.add("sukkot")
      if (signal === "grill" || signal === "grilled") occasions.add("grilling")
    }
  }

  return Array.from(occasions)
}

function buildPersonalizationTags({
  buckets,
  occasions,
  proteins,
  cutFamilies,
  methods,
  effortLevel,
  kfpStatus,
}) {
  return Array.from(
    new Set([
      ...buckets.map((value) => `bucket:${value}`),
      ...occasions.map((value) => `occasion:${value}`),
      ...proteins.map((value) => `protein:${value}`),
      ...cutFamilies.map((value) => `cut:${value}`),
      ...methods.map((value) => `method:${value}`),
      `effort:${effortLevel}`,
      `kfp:${kfpStatus}`,
    ])
  )
}

function hasAnySignal(classification, signals) {
  const expected = new Set(signals)
  return classification.assignments.some((assignment) =>
    assignment.signals?.some((signal) => expected.has(signal))
  )
}

function recipeText(recipe) {
  return [
    recipe.Title,
    recipe.ShortDescription,
    recipe.Slug,
    recipe.Servings,
    recipe.TotalTime,
    recipe.PrepTime,
    recipe.CookTime,
    ...(recipe.RecipeCategories || []).flatMap((category) => [
      category.Name,
      category.Slug,
    ]),
    ...(recipe.Ingredients || []).map((ingredient) => ingredient.ingredient),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
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

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
