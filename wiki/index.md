# Grillers Pride Storefront — Agent Wiki

A persistent, compounding knowledge base for agents working on the **grillers-medusa-frontend** Next.js storefront. Built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

**The wiki sits between agents and raw sources.** Each page is a synthesis — it doesn't repeat what's in the code (read the code) or in [global rules](#external-rule-files) (read those), but it tells you **what to read, in what order, and what NOT to do**.

The schema for the wiki lives in [`../CLAUDE.md`](../CLAUDE.md) and [`../AGENTS.md`](../AGENTS.md). Read those first when entering a fresh session.

---

## Page catalog

### Foundations (read first when joining)

| Page | One-line summary |
|---|---|
| [01-architecture](./01-architecture.md) | System map — Medusa backend + Strapi CMS + Next.js storefront + Algolia + Stripe + Vercel relationships and data flow. |
| [02-repos](./02-repos.md) | Five interconnected repos — what lives where, what each owns, when to touch which. |
| [03-getting-started](./03-getting-started.md) | Agent quickstart — dev server, where to look first, how to verify a change, what to never touch without permission. |

### Patterns to follow

| Page | One-line summary |
|---|---|
| [04-data-patterns](./04-data-patterns.md) | Server actions everywhere; Medusa SDK singleton via `@lib/config`; Strapi via GraphQL with read-only token; force-cache + revalidateTag for ISR. |
| [05-pricing-and-catch-weight](./05-pricing-and-catch-weight.md) | `PricingMode` resolver pattern — single source of truth for per-lb vs fixed-price labels. The regression class is "rendering pack price with /lb label" or vice versa. |
| [11-brand-and-voice](./11-brand-and-voice.md) | Brand colors, fonts, copy voice. **No em-dashes anywhere.** Mobile-first, AKC-kosher voice. |

### Critical traps (load-bearing — production has broken on each of these)

| Page | One-line summary |
|---|---|
| [06-critical-traps](./06-critical-traps.md) | Single-page index of every known production-breaker, each pointing to the global rule with the deep diagnostic and fix. |
| [10-recent-incidents](./10-recent-incidents.md) | Outage timeline — what broke, when, why, and the one-line takeaway for each. |

### Workflows

| Page | One-line summary |
|---|---|
| [07-shipping-an-issue](./07-shipping-an-issue.md) | The ship-an-issue validation gate: Chrome 1440px + 375px verification, Codex review for shared abstractions, GitHub close-comment template. |
| [08-deploy-and-verify](./08-deploy-and-verify.md) | Wait-for-build, match deploy id in HTML, cache-header diagnostics, the Data Cache trap, revalidation flow. |
| [09-testing](./09-testing.md) | Jest (unit), Playwright (E2E), headless Chrome for strict 375px mobile screenshots. |

### Context

| Page | One-line summary |
|---|---|
| [12-people-and-lanes](./12-people-and-lanes.md) | Peter (owner — PDP/inventory/Strapi product decisions), Chris (CTO — checkout/Postmark/Vercel access), Avi (CoS — everything else). Don't decide in Peter's lane; don't touch Chris's lane. |
| [13-imagery-pipeline](./13-imagery-pipeline.md) | Fal.ai `nano-banana` (text-to-image) and `nano-banana/edit` (image-to-image, recipe pattern). Briefs in `~/Downloads/` for Codex handoff. |
| [14-services-and-access](./14-services-and-access.md) | Where each service lives, where credentials are stored, what's read-only vs write-capable. |

### Meta

| Page | One-line summary |
|---|---|
| [log](./log.md) | Chronological log of ingests, queries, lint passes — `grep "^## \[" log.md | tail -5` to see recent. |

---

## External rule files

The wiki **does not duplicate** these. When a topic page says "see [rule: X]", read the file at the path below.

### Global rules (`~/.claude/rules/`)

- [`nextjs-dynamic-routes.md`](~/.claude/rules/nextjs-dynamic-routes.md) — slug collision deploy killer
- [`nextjs-parallel-routes-bug.md`](~/.claude/rules/nextjs-parallel-routes-bug.md) — parallel-route manifest bug (#76148)
- [`strapi-admin-edit.md`](~/.claude/rules/strapi-admin-edit.md) — admin JWT, `data:` wrapper trap, integer-id instability
- [`vercel-deploy-verify.md`](~/.claude/rules/vercel-deploy-verify.md) — deploy verification + Data Cache trap
- [`vercel-env-cli-gotchas.md`](~/.claude/rules/vercel-env-cli-gotchas.md) — trailing-newline silent corruption
- [`ship-an-issue-validation-gate.md`](~/.claude/rules/ship-an-issue-validation-gate.md) — the issue-close checklist
- [`codex-review.md`](~/.claude/rules/codex-review.md) — when to use Codex as second eyes
- [`codex-pair-programming-fallbacks.md`](~/.claude/rules/codex-pair-programming-fallbacks.md) — when Codex CLI fails, fall back to code-simplifier

### Auto-memory (`~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/`)

- [`MEMORY.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/MEMORY.md) — index of project memory
- [`pricing-mode-resolver-pattern.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/pricing-mode-resolver-pattern.md) — load-bearing pricing pattern
- [`prod-url.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/prod-url.md), [`medusa-admin-url.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/medusa-admin-url.md) — service endpoints
- [`strapi-admin-credentials.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-admin-credentials.md), [`medusa-admin-credentials.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/medusa-admin-credentials.md), [`postmark-credentials.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/postmark-credentials.md) — credentials (NEVER commit)
- [`headless-chrome-mobile-screenshots.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/headless-chrome-mobile-screenshots.md) — Chrome MCP `resize_window` lies; use shell-launched headless Chrome for 375px
- [`strapi-cloud-deploy-quirks.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-cloud-deploy-quirks.md) — schema changes deploy fast, `patch-package` patches don't apply
- [`bundle-merchandising-status.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/bundle-merchandising-status.md) — Medusa-as-inventory-of-truth blocker
- [`feedback-validate-catalog-economics-with-peter.md`](~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/feedback-validate-catalog-economics-with-peter.md) — don't assume SKU pricing parity

---

## Maintenance

**This wiki is the LLM's responsibility, not the human's.** When you (the agent) finish a session that taught you something durable:

1. If the lesson is **project-specific** (a Strapi schema change, a new component pattern, a person-decision) → update the relevant wiki page and append a `## [YYYY-MM-DD] ingest` entry to [log.md](./log.md).
2. If the lesson is **cross-project** (a Next.js bug, a Vercel CLI gotcha) → add it to `~/.claude/rules/` and update the [#external-rule-files](#external-rule-files) section above to link it.
3. If the lesson is **session-only** (an in-flight task) → use TodoWrite or the continuity ledger; do NOT put it in the wiki.

Run a **lint pass** every ~10 ingests:
- Are there contradictions between pages? (e.g. one page says we publish via `actions/publish`, another says we skip it)
- Are there stale claims? (e.g. a page references a closed issue or a renamed file)
- Are there orphans? (pages with no inbound links)
- Are there concepts mentioned but lacking a page?

When in doubt about whether to update the wiki, prefer **conservatism** — a stale wiki is worse than a sparse one.
