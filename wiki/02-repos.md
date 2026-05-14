# 02 — Repositories

Five repos work together. Agents working on the storefront usually touch 1–2; almost never all 5. **Know which lane you're in before you start editing.**

| Repo | Path | Owner | Purpose | When you touch it |
|---|---|---|---|---|
| **grillers-medusa-frontend** | `~/coding/grillers-medusa-frontend` | Avi | This repo — Next.js 15 storefront | PLP, PDP, home, recipes, cart, account, checkout UI, mobile parity, brand work |
| **grillers-medusa-admin** | `~/coding/grillers-medusa-admin` | Chris | Medusa V2 backend (Railway) | Catalog data model, cart/checkout/order logic, webhook subscribers, payment providers |
| **grillerspride** | `~/coding/grillerspride` | Avi | Strategy portal (Next.js, separate site) | Internal leadership dashboards, analysis docs, KPIs — NOT customer-facing |
| **product-merch** | `~/coding/product-merch` | Avi | Convex + Fal.ai pipeline | Product image generation (`nano-banana/edit`), recipe imagery generation |
| **(Strapi Cloud)** | — (hosted) | Avi | Strapi v5 CMS | Product copy, recipes, footer pages, SEO; deploy via Strapi Cloud's GitHub integration |

## How they connect

```
                          Strapi Cloud (CMS)
                           ▲       │
                           │ admin │ GraphQL read
                  writes via JWT   │
                           │       ▼
   ┌────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
   │ product-   │───▶│  Strapi             │◀───│ grillers-medusa-     │
   │ merch      │    │  (canonical product │    │ frontend (this repo) │
   │ (Fal.ai)   │    │   imagery + copy)   │    └──────────┬───────────┘
   └────────────┘    └─────────────────────┘               │
                                                            │ SDK
                                                            ▼
   ┌────────────┐                                ┌──────────────────────┐
   │ QuickBooks │ ──── (inventory truth) ───────▶│ grillers-medusa-     │
   │ Desktop    │                                │ admin (Medusa V2)    │
   │ (Peter)    │                                │ on Railway           │
   └────────────┘                                └──────────────────────┘

   ┌────────────┐
   │ grillers-  │ ←── (reads analytics, doesn't write back to live systems) ──
   │ pride      │     Internal-only dashboards, decision docs, financials.
   │ (strategy) │     If you find yourself looking at this for storefront
   └────────────┘     work, you're in the wrong place.
```

## Detail per repo

### grillers-medusa-frontend (this repo)

- **Framework:** Next.js 15.5 App Router, React 19 RC, Tailwind, TypeScript.
- **Hosted on:** Vercel — production alias auto-promotes on `main`.
- **Critical files for orientation:** see [[03-getting-started]] § "The 5-file tour."
- **Build oddity:** `scripts/fix-parallel-route-manifests.js` runs post-build. It's a defensive patch for Next.js bug [vercel/next.js#76148](https://github.com/vercel/next.js/issues/76148). After the May 2026 account-routes refactor it generates 0 files, but leave it in place. See `~/.claude/rules/nextjs-parallel-routes-bug.md` for full context.
- **`ignoreBuildErrors: true`** in `next.config.js` — TypeScript errors do NOT block builds. Agents must run `tsc --noEmit` separately to catch them.
- **`ignoreDuringBuilds: true`** for ESLint — same situation. Run `yarn lint` manually.

### grillers-medusa-admin (Medusa V2 backend)

- **Framework:** Medusa V2 (forked from official template).
- **Hosted on:** Railway. **The active admin UI is at the URL in [`medusa-admin-url.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/medusa-admin-url.md)**, not at a local instance.
- **Owner:** Chris. **Don't push code here without explicit handoff.** Bugs / feature requests → file in the `grillers-pride-strategy` repo with a `checkout` label.
- **Subscribers / webhooks** (the back-in-stock-trigger pattern lives here): May 2026 attempt was sandbox-blocked from Codex; ultimately implemented manually. See `~/.claude/rules/codex-pair-programming-fallbacks.md` § 1 for the sandbox-write-block constraint.

### grillerspride (strategy portal)

- **Framework:** Next.js 16, React 19, App Router. **DIFFERENT FROM THE STOREFRONT.**
- **Purpose:** Internal-only leadership dashboard. Reads from QBD (Conductor SDK), legacy MySQL, GA4. Renders strategy docs from `analysis/*.md`.
- **NOT customer-facing.** If a request is about something Peter/Dan/Jacob see in the portal, this is the repo. If it's about something a customer sees on grillerspride.com (or `grillers-medusa-frontend.vercel.app/us`), this is the WRONG repo.
- **Where the GitHub issue tracker lives** — `aviswerdlow/grillers-pride-strategy` is where all storefront issues are filed. The storefront repo doesn't have public issue tracking enabled.

### product-merch (image generation)

- **Framework:** Convex + Fal.ai (`nano-banana`, `nano-banana/edit`, `recraft/upscale/crisp`).
- **Purpose:** Generate product imagery from text prompts, edit existing images via image-to-image.
- **Reference patterns** for the storefront imagery briefs (`~/Downloads/pdp-imagery-brief.md`, `~/Downloads/recipe-imagery-brief.md`).
- See [[13-imagery-pipeline]].

### Strapi Cloud (CMS, not a code repo)

- **Strapi v5.** Schema and plugins managed via the Strapi Cloud GitHub integration — when a contributor pushes a content-type change to the connected repo, Strapi Cloud deploys it (~3 min).
- **Patch-package patches don't always apply** on Strapi Cloud's build environment — see `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-cloud-deploy-quirks.md`.
- **Admin URL + credentials** live in project memory: see `strapi-admin-credentials.md`.
- **The `data:` wrapper trap** is the #1 silent killer of programmatic Strapi writes — see [[06-critical-traps]] § Strapi.

## When you're not sure which repo

Default rule: **the bug or feature lives in the repo where the visible behavior is.** A customer seeing a wrong PLP price → start in `grillers-medusa-frontend`. A wrong order total in a confirmation email → likely Medusa admin (Chris). A wrong margin number in the strategy dashboard → `grillerspride`. An AI-looking product photo → `product-merch` for regeneration, Strapi to attach.

## Next reads

- [[01-architecture]] — system map and data flow
- [[03-getting-started]] — agent quickstart for THIS repo
- [[12-people-and-lanes]] — who decides what
- [[14-services-and-access]] — where each service lives, what credentials are where
