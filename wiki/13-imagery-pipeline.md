# 13 — Imagery Pipeline

How product, PDP, and recipe imagery gets generated, approved, and shipped.

## The stack

```
Fal.ai (nano-banana, nano-banana/edit, recraft/upscale/crisp)
   ↓
product-merch repo (Convex workflows for production runs)
   ↓
Local Python / shell scripts for one-off generation
   ↓
Strapi admin /upload (multipart) → media id
   ↓
Strapi content-manager PUT (attach by media id) → publish
   ↓
Storefront via Strapi → Next.js Image
```

## Two image flows

### Flow 1: Text-to-image (PDP imagery, hero shots, lifestyle imagery)

**Endpoint:** `fal-ai/nano-banana`.

**Pattern:** Pure text prompt → image. Used for HowItWorks cards, WhyUs heroes, on-site lifestyle shots. The full reference brief for Codex handoff is at `~/Downloads/pdp-imagery-brief.md` — gives credentials, schemas, prompt-engineering rules, and end-to-end checklist.

**When to use:** New imagery with no source-image constraint. E.g. a new homepage hero, a category landing photo, a generic kashruth-page background.

**Aspect ratios:**
- `16:9` — hero shots (WhyUs hero)
- `4:3` — card images (HowItWorks cards)
- `1:1` — square product tile placeholders
- `3:4` — mobile heros (rare)

### Flow 2: Image-to-image (per-product / per-recipe imagery)

**Endpoint:** `fal-ai/nano-banana/edit`.

**Pattern:** Source image URL + prompt → edited image. Used for recipe imagery where the underlying meat color/texture must match the product's actual `FeaturedImage`. The reference brief is at `~/Downloads/recipe-imagery-brief.md`.

**When to use:** Generating a "plated brisket" recipe shot from a "raw brisket" product photo. Generating a regional/holiday variant of an existing hero. Anything where source-image fidelity matters.

**Source image conventions:**
- Strapi `Product.FeaturedImage.url` — raw photographed product
- Strapi `Recipe.RelatedProducts[0].FeaturedImage.url` — recipe routes through this relation

### Optional: Upscale

After either flow, optionally chain through `fal-ai/recraft/upscale/crisp` for higher-res output. The product-merch repo has this wired up in `convex/falImageService.ts`. For one-off scripts, only upscale if Peter needs a print-quality image; storefront delivery doesn't benefit (Next.js Image handles responsive sizing).

## End-to-end checklist (for any new asset)

The full per-step protocol lives in `~/Downloads/pdp-imagery-brief.md` and `~/Downloads/recipe-imagery-brief.md`. The compressed version:

1. **Plan the prompt.** Documentary photography spec, no AI tells. See [[11-brand-and-voice]] § Image quality.
2. **Generate.** Fal queue API (`/fal-ai/nano-banana` or `.../edit`); poll for completion; download from response URL.
3. **Resize** to ≤1600px max edge, ≤700kB. macOS: `sips -Z 1600 --setProperty format jpeg input.png --out output.jpg`.
4. **Upload to Strapi.** `POST /upload` multipart with admin JWT. Capture the returned media `id` (integer — unstable across Strapi publishes, but stable for THIS asset).
5. **Attach to the target entry.** `PUT /content-manager/.../entry-id` with `{"FieldName": <media_id>}` — NO `data:` wrapper. See [[06-critical-traps]] § ST-1.
6. **Publish.** `POST .../actions/publish`.
7. **Revalidate** the Next.js cache (`POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET` OR rely on the Strapi webhook to fire).
8. **Verify on production** at 1440px AND 375px. **Show Peter for approval before considering the work shipped.**

## Per-recipe / per-product loop pattern

When generating imagery for many entries at once, the loop pattern in `~/Downloads/recipe-imagery-brief.md` covers:

- JWT refresh every ~25 minutes (Strapi JWTs expire ~30 min)
- Polite delay between Fal requests (1.5–3s) to avoid rate limit
- Per-entry try/except with a failures file for retry
- Status logging to `/tmp/imagery-progress.jsonl` so you can resume

For >100 entries, prefer the Convex workflow in `product-merch` over a raw shell loop — Convex handles retries, idempotency, and failure isolation cleanly.

## AI tells — the failure modes that have shipped

From real history (May 2026 PDP imagery rounds):

- **WhyUs hero v1 had unmistakably AI meat.** Bright pink, no surface texture, frozen geometry. Peter flagged it. v2 used a sharper documentary-photography prompt (Hasselblad spec, natural window light, "deep burgundy not neon," "visible cutting marks") — approved.
- **HowItWorks card 1 sign in background said "KASHIRTH"** (gibberish). The prompt mentioned "kashruth sign" — Fal hallucinated text. **Rule:** if the image needs literal text, generate WITHOUT specifying the text in the prompt, then composite the text in graphic design afterward.
- **WhyUs hero v1 AKC seal had garbled Hebrew "הכרב"** — same root cause. Removed in v2 by not mentioning the seal in the prompt.

The two briefs in `~/Downloads/` capture the v2 prompt patterns that produced approved images. Copy them as starting points.

## Where the briefs live

- `/Users/aviswerdlow/Downloads/pdp-imagery-brief.md` — 14KB. Text-to-image PDP imagery. Self-contained for Codex handoff: credentials, endpoints, the `data:` wrapper trap, 4-stage pipeline, aspect-ratio table, schema reference, prompt engineering, AI tells, brand aesthetic, end-to-end checklist.
- `/Users/aviswerdlow/Downloads/recipe-imagery-brief.md` — 21KB. Image-to-image per-recipe imagery. Adds: recipe schema, per-recipe loop pattern, RelatedProducts traversal, recipe-specific AI tells (sauce physics, char-mark uniformity), Atlanta family-run aesthetic specifics.

These briefs include **credentials**. They are **for paste-into-Codex use only** — do NOT commit them to a public repo, do NOT paste them into a public issue body.

## Strapi schema reference (quick)

For attaching imagery:

| Entry | Media field | Field shape | Path in PUT body |
|---|---|---|---|
| Product | `FeaturedImage` | single media | `{"FeaturedImage": <media_id>}` |
| Product | `GalleryImages` | multiple media | `{"GalleryImages": [<id>, <id>, ...]}` |
| Recipe | `Image` | single media | `{"Image": <media_id>}` |
| Pdp single-type | (multiple nested in components) | see brief | Component-specific; preserve existing component `id` |
| Collection | `Image` | single media | `{"Image": <media_id>}` |

For the dynamic-zone `Body` fields (info pages with `info.image-block`), the media goes inside the component AND the component `id` must be preserved — see [[06-critical-traps]] § ST-3 for the Body vs Content trap.

## Cost notes

Fal.ai pricing as of May 2026:
- `nano-banana` (text-to-image) — ~$0.04 per generation
- `nano-banana/edit` (image-to-image) — ~$0.05 per generation
- `recraft/upscale/crisp` — ~$0.10 per upscale

A full recipe-imagery backfill (~50 recipes × 1 image each) is ~$2.50. PDP imagery for the full catalog (~600 products × FeaturedImage regen) would be ~$24 (text-to-image) or ~$30 (image-to-image). Cost is not the bottleneck; quality control and approval bandwidth is.

## Next reads

- [[11-brand-and-voice]] § Image quality — what "no AI tells" means in detail
- [[06-critical-traps]] § Strapi — the `data:` wrapper, integer id instability
- The two briefs in `~/Downloads/` for actual prompt + code patterns
