/* eslint-disable */
/**
 * Migrate legal-page entries from the markdown-spec Content blob into the
 * structured Hero + Body + SEO + SocialMeta fields. Generates a hero image
 * for each page via fal.ai, uploads it to Strapi media, and PUTs the
 * structured fields back. Idempotent: re-runs skip pages that already have
 * Hero set unless --force is passed.
 *
 * Usage:
 *   node --env-file=.env.local --env-file=scripts/.migrate.env \\
 *     scripts/migrate-info-pages.cjs [--only=slug] [--force] [--dry] [--no-image]
 *
 * Required env:
 *   STRAPI_ENDPOINT      — Strapi base URL
 *   STRAPI_WRITE_TOKEN   — full-access Strapi API token (writes)
 *   STRAPI_API_TOKEN     — read token (used as fallback)
 *   FAL_KEY              — fal.ai key
 */

const args = process.argv.slice(2)
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1]
const FORCE = args.includes("--force")
const DRY = args.includes("--dry")
const SKIP_IMAGE = args.includes("--no-image")

const STRAPI = process.env.STRAPI_ENDPOINT
const WRITE_TOKEN = process.env.STRAPI_WRITE_TOKEN || process.env.STRAPI_API_TOKEN
const FAL_KEY = process.env.FAL_KEY

if (!STRAPI || !WRITE_TOKEN) {
  console.error("Missing STRAPI_ENDPOINT or STRAPI_WRITE_TOKEN/STRAPI_API_TOKEN")
  process.exit(1)
}
if (!SKIP_IMAGE && !FAL_KEY) {
  console.error("Missing FAL_KEY (or pass --no-image to skip image generation)")
  process.exit(1)
}

const writeHeaders = { Authorization: `Bearer ${WRITE_TOKEN}` }
const jsonHeaders = { ...writeHeaders, "Content-Type": "application/json" }

// ───────────────────────────────────────────────────────────── helpers

function flatten(node) {
  if (!node) return ""
  if (typeof node === "string") return node
  if (node.text) return node.text
  if (Array.isArray(node.children)) return node.children.map(flatten).join("")
  return ""
}

function paraText(p) {
  return flatten(p).trim()
}

const FIELD_LABELS = [
  ["eyebrow", /^eyebrow\s*:\s*/i],
  ["headline", /^headline\s*:\s*/i],
  ["subhead", /^sub-?head(line)?\s*:\s*/i],
  ["primaryCta", /^primary cta\s*:\s*/i],
  ["secondaryCta", /^secondary cta\s*:\s*/i],
  ["cta", /^cta\s*:\s*/i],
  ["image", /^image\s*:\s*/i],
]

function matchFieldLabel(text) {
  for (const [name, re] of FIELD_LABELS) {
    if (re.test(text)) return { name, value: text.replace(re, "").trim() }
  }
  return null
}

// "[Verify Our Supervision →](/legal/kashruth-supervision)" → { Text, Url }
// "[Verify Our Supervision →]" → { Text } only (no Url)
function parseCta(raw, fallbackUrl) {
  if (!raw) return null
  const md = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
  if (md) {
    return { Text: md[1].replace(/\s*[→›]\s*$/, "").trim(), Url: md[2].trim() }
  }
  const bracketed = raw.match(/^\[([^\]]+)\]$/)
  const text = bracketed ? bracketed[1] : raw
  const cleanText = text.replace(/\s*[→›]\s*$/, "").trim()
  if (!cleanText) return null
  return { Text: cleanText, Url: fallbackUrl || "/" }
}

/**
 * Splits Content into:
 *   - hero: { Eyebrow, Headline, Subhead, PrimaryCta, SecondaryCta, ImageHint }
 *   - sections: Array<{ Title, Body[] }>
 *
 * Hero block is detected as the first h2 whose text is "Hero" (case-insensitive).
 * Field labels live in paragraphs as bold-prefixed "Label: value" lines.
 * After the hero, every h2 starts a new section; following non-h2 blocks
 * compose its Body.
 */
function parseContent(content, fallbackTitle) {
  const blocks = Array.isArray(content) ? content : []
  const hero = {}
  const sections = []
  let mode = "preheader"
  let currentSection = null

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.type === "heading" && b.level === 2) {
      const t = paraText(b)
      if (/^hero(\s|$)/i.test(t)) {
        mode = "hero"
        continue
      }
      if (currentSection) sections.push(currentSection)
      currentSection = { Title: t, Body: [] }
      mode = "section"
      continue
    }

    if (mode === "hero") {
      if (b.type !== "paragraph") continue
      const text = paraText(b)
      const field = matchFieldLabel(text)
      if (field) {
        if (field.name === "eyebrow") hero.Eyebrow = field.value
        else if (field.name === "headline") hero.Headline = field.value
        else if (field.name === "subhead") hero.Subhead = field.value
        else if (field.name === "primaryCta" || field.name === "cta")
          hero.PrimaryCtaRaw = field.value
        else if (field.name === "secondaryCta")
          hero.SecondaryCtaRaw = field.value
        else if (field.name === "image") hero.ImageHint = field.value
      }
      continue
    }

    if (mode === "section" && currentSection) {
      currentSection.Body.push(b)
      continue
    }
  }
  if (currentSection) sections.push(currentSection)

  if (!hero.Headline) hero.Headline = fallbackTitle
  return { hero, sections }
}

// Truncate to a sentence boundary, max chars.
function trimTo(text, max) {
  if (!text) return ""
  const t = text.trim()
  if (t.length <= max) return t
  const sliced = t.slice(0, max)
  const lastPunct = Math.max(sliced.lastIndexOf(". "), sliced.lastIndexOf("! "), sliced.lastIndexOf("? "))
  if (lastPunct > max * 0.5) return sliced.slice(0, lastPunct + 1).trim()
  const lastSpace = sliced.lastIndexOf(" ")
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim() + "…"
}

function padTo(text, min, fillerSeed) {
  let t = text.trim()
  if (t.length >= min) return t
  // Pad with filler seed words until min length is met.
  const filler = fillerSeed || "Premium glatt kosher meat from Griller's Pride."
  while (t.length < min) t = `${t} ${filler}`.trim()
  return t.slice(0, Math.max(min, t.length))
}

// ───────────────────────────────────────────────────────────── fal.ai

function buildImagePrompt(slug, title, headline, subhead) {
  const subjectMap = {
    "privacy-policy":
      "elegant editorial still-life of a leather-bound document and a vintage brass key on a dark walnut surface, warm rim light, intimate close-up",
    "terms-of-sale":
      "editorial photograph of a butcher's classic ledger book, fountain pen, and a wax seal on dark stone, warm tungsten light, premium kosher butcher shop ambiance",
    "terms-of-use":
      "editorial photograph of a stack of pristine cream paper sheets and an antique fountain pen on dark walnut, soft directional light, refined and serious",
    "shipping-ups":
      "editorial photograph of a premium kraft shipping box wrapped with twine, dry-ice vapor curling around it, on dark slate, dramatic side light, cinematic",
    "shipping-atlanta":
      "editorial photograph of a refrigerated delivery van's open back doors revealing kraft boxes, golden hour light on a Southern brick street, cinematic",
    "shipping-pallet-program":
      "editorial photograph of a wood pallet stacked with kraft boxes and dry-ice mist, warehouse setting, dramatic side light, premium logistics",
    "kashruth-passover":
      "editorial photograph of matzah, a silver kiddush cup, and a sprig of fresh parsley arranged on dark walnut, warm candlelight, reverent and elegant",
    "kashruth-supervision":
      "editorial photograph of a rabbinical kashrut certificate scroll with a wax seal and silver chalice on dark walnut, warm directional light, reverent",
    "shipping-southeast-pickup":
      "editorial photograph of a Southern barn entrance with a wood crate of kraft boxes at sunrise, warm golden light, premium pickup ambiance",
    "shipping-plant-pickup":
      "editorial photograph of a pristine industrial loading dock with a single kraft box on a stainless steel cart, warm overhead light, premium butcher plant",
    "holidays-order-deadlines":
      "editorial photograph of a vintage Hebrew calendar page with a silver kiddush cup and pomegranate on dark walnut, warm candlelight, reverent and intimate",
    "about-us":
      "editorial photograph of a multi-generational family kosher butcher shop interior, warm tungsten light, polished wood and stainless steel, intimate atmosphere",
    "our-mission":
      "editorial photograph of hand-trimmed glatt kosher beef on a butcher block under warm pendant light, premium meat counter ambiance, refined and intimate",
    careers:
      "editorial photograph of a kosher butcher's leather apron hanging on a wood peg with knives and twine on dark walnut, warm directional light, craft and tradition",
    "catch-weight-pricing":
      "editorial photograph of an antique brass kitchen scale with a slab of premium beef on butcher paper, warm tungsten light, refined butcher shop ambiance",
  }

  const subject =
    subjectMap[slug] ||
    `editorial photograph evoking the topic "${title}", premium kosher butcher shop ambiance, warm tungsten light, walnut and stainless steel, refined and intimate`

  return `${subject}. Wide cinematic 16:9 composition. Rich shadow detail. Premium magazine editorial style. No people. No text, no logos, no watermarks. Brand-neutral. Soft warm color palette anchored in deep charcoal, walnut, gold, and cream.`
}

const NEGATIVE_PROMPT =
  "text, watermark, logo, brand name, hands, faces, deformed, low quality, oversaturated, vibrant cartoon colors"

async function callFal(prompt) {
  const r = await fetch("https://fal.run/fal-ai/nano-banana-pro", {
    method: "POST",
    headers: {
      Authorization: "Key " + FAL_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      aspect_ratio: "16:9",
    }),
  })
  if (!r.ok) {
    const txt = await r.text()
    throw new Error(`fal.ai ${r.status}: ${txt.slice(0, 200)}`)
  }
  const data = await r.json()
  const url = data.images?.[0]?.url || data.image?.url
  if (!url) throw new Error("fal.ai response missing image URL")
  return url
}

async function uploadToStrapi(imageUrl, filename) {
  const r = await fetch(imageUrl)
  if (!r.ok) throw new Error(`download failed: ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())

  const fd = new FormData()
  fd.append(
    "files",
    new Blob([buf], { type: "image/jpeg" }),
    filename
  )
  const up = await fetch(`${STRAPI}/api/upload`, {
    method: "POST",
    headers: writeHeaders,
    body: fd,
  })
  if (!up.ok) {
    const txt = await up.text()
    throw new Error(`Strapi upload ${up.status}: ${txt.slice(0, 200)}`)
  }
  const uploaded = await up.json()
  return uploaded[0]
}

// ───────────────────────────────────────────────────────────── main

async function fetchAllLegalPages() {
  const r = await fetch(
    `${STRAPI}/api/legal-pages?populate=*&pagination[pageSize]=100`,
    { headers: writeHeaders }
  )
  if (!r.ok) throw new Error(`fetch legal-pages ${r.status}`)
  const j = await r.json()
  return j.data || []
}

function buildBodyDynamicZone(sections) {
  return sections.map((s) => ({
    __component: "info.section",
    Title: s.Title,
    Body: s.Body,
    ImagePosition: "none",
  }))
}

function buildSeo(title, headline, subhead) {
  const metaTitleRaw = `${title} | Griller's Pride`
  const metaTitle = trimTo(metaTitleRaw, 60)
  const descSource = subhead || headline || `Read about ${title} from Griller's Pride.`
  let metaDescription = trimTo(descSource, 160)
  if (metaDescription.length < 50) {
    metaDescription = padTo(
      metaDescription,
      50,
      "Glatt kosher butcher with Atlanta Kashruth Commission supervision."
    )
    metaDescription = trimTo(metaDescription, 160)
  }
  return {
    metaTitle,
    metaDescription,
    metaRobots: "index, follow",
  }
}

function buildSocialMeta(title, headline, subhead, imageId) {
  const ogTitle = trimTo(headline || title, 60)
  const ogDescription = trimTo(subhead || `${title} — Griller's Pride.`, 200)
  return {
    ogTitle,
    ogDescription,
    ogType: "article",
    ogImage: imageId || undefined,
    twitterCard: "summary_large_image",
    twitterTitle: trimTo(ogTitle, 70),
    twitterDescription: ogDescription,
    twitterImage: imageId || undefined,
  }
}

async function migrateOne(entry) {
  const slug = entry.Slug
  const title = entry.Title
  const docId = entry.documentId
  console.log(`\n── ${slug} (${docId})`)

  if (!FORCE && entry.Hero?.Headline) {
    console.log("  skip (Hero already set; pass --force to overwrite)")
    return { slug, status: "skipped" }
  }

  const { hero, sections } = parseContent(entry.Content, title)
  const primaryCta = parseCta(hero.PrimaryCtaRaw, "/")
  const secondaryCta = parseCta(hero.SecondaryCtaRaw, null)

  console.log(
    `  parsed: eyebrow="${hero.Eyebrow || ""}" headline="${(hero.Headline || "").slice(0, 60)}" sections=${sections.length}`
  )

  let imageId = null
  if (!SKIP_IMAGE) {
    try {
      const prompt = buildImagePrompt(slug, title, hero.Headline, hero.Subhead)
      console.log("  generating image…")
      const falUrl = await callFal(prompt)
      console.log("  uploading to Strapi…")
      const uploaded = await uploadToStrapi(falUrl, `${slug}-hero.jpg`)
      imageId = uploaded.id
      console.log(`  image #${imageId}`)
    } catch (err) {
      console.warn("  image step failed:", err.message)
    }
  }

  const seo = buildSeo(title, hero.Headline, hero.Subhead)
  const socialMeta = buildSocialMeta(title, hero.Headline, hero.Subhead, imageId)

  const heroPayload = {
    Eyebrow: hero.Eyebrow || null,
    Headline: hero.Headline || title,
    Subhead: hero.Subhead || null,
    Image: imageId || null,
    ImageAlt: hero.Headline || title,
    PrimaryCta: primaryCta || null,
    SecondaryCta: secondaryCta || null,
  }

  const body = {
    Hero: heroPayload,
    Body: buildBodyDynamicZone(sections),
    SEO: seo,
    SocialMeta: socialMeta,
  }

  if (DRY) {
    console.log("  DRY RUN — would PUT:", JSON.stringify({ Hero: heroPayload, sections: sections.length, seo }, null, 2).slice(0, 800))
    return { slug, status: "dry" }
  }

  const r = await fetch(`${STRAPI}/api/legal-pages/${docId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ data: body }),
  })
  if (!r.ok) {
    const txt = await r.text()
    console.error(`  PUT ${r.status}: ${txt.slice(0, 400)}`)
    return { slug, status: "error", error: txt }
  }
  console.log("  ✓ updated")
  return { slug, status: "updated" }
}

;(async () => {
  console.log("Fetching legal-pages…")
  const entries = await fetchAllLegalPages()
  console.log(`Found ${entries.length} entries`)

  const filtered = ONLY ? entries.filter((e) => e.Slug === ONLY) : entries
  if (!filtered.length) {
    console.error(`No entries match (--only=${ONLY})`)
    process.exit(1)
  }

  const results = []
  for (const e of filtered) {
    try {
      results.push(await migrateOne(e))
    } catch (err) {
      console.error(`  fatal: ${err.message}`)
      results.push({ slug: e.Slug, status: "fatal", error: err.message })
    }
  }

  console.log("\n── summary")
  for (const r of results) console.log(` ${r.status.padEnd(8)} ${r.slug}`)
})()
