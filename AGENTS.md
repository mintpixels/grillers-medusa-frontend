# AGENTS.md — Grillers Pride Storefront

This file is the entry point for any AI coding agent (Codex, Claude Code, Cursor, Aider, etc.) joining work on this repo.

## Read this first

1. **`wiki/index.md`** — Catalog of the agent wiki. Every page is a short synthesis with cross-references to global rules and project memory. Read the catalog, then drill into the pages relevant to your task.
2. **`wiki/03-getting-started.md`** — Quickstart: dev server, the 5-file orientation tour, what to never touch without permission.
3. **`CLAUDE.md`** (Claude Code) — Repo-level configuration: dev commands, env vars, architecture overview, paths. Read after the wiki.

The wiki is the **schema layer**. The code is the **source of truth**. Read the wiki to know *where to look*, then read the code to know *what's actually there*.

## Cardinal rules

These are absolute. Violating any has historically caused production outages:

1. **Never `git add -A` or `git add .`** — `.env`, credentials, large binaries get committed silently. Stage files by name.
2. **Never amend a commit with a failed pre-commit hook.** The commit didn't happen; `--amend` will modify the previous commit. Fix the hook failure and create a new commit.
3. **Never push to main without verification.** See `wiki/07-shipping-an-issue.md` for the validation gate (Chrome 1440px + 375px, Codex review on shared abstractions).
4. **Never write Strapi mutations with a `{"data": {...}}` wrapper** when calling `/content-manager/*`. The admin API silently drops the body — fields land as `null`. See `wiki/06-critical-traps.md` § Strapi.
5. **Never key code references to Strapi entries by integer `id`.** Use `documentId` or `Handle`. Bulk republish invalidates integer ids. See `wiki/06-critical-traps.md` § Strapi.
6. **Never trust `next build` success for parallel routes inside dynamic segments.** They build green and serve 500 at runtime. See `wiki/06-critical-traps.md` § Next.js parallel routes.

## Lanes

Three humans, three lanes — touching the wrong lane without explicit handoff causes friction:

- **Peter** (owner): PDP copy, per-lb pricing decisions, bundle composition, Strapi product data, inventory truth.
- **Chris** (CTO): Checkout flow, Stripe live mode, Postmark transactional email, Vercel project access.
- **Avi** (CoS): Everything else — PLP, home page, collections, recipes, kashruth pages, mobile parity, performance.

When in doubt → file an issue tagged for the right lane; don't decide. See `wiki/12-people-and-lanes.md`.

## Working norms

- **Codex review is standard practice** for non-trivial changes — see `~/.claude/rules/codex-review.md`. Mandatory for: auth, checkout, financial calc, anything touching shared abstractions.
- **Mobile verification is part of "done"** — every PDP/PLP/cart change must be verified at 1440px AND 375px before closing the issue. See `wiki/07-shipping-an-issue.md`.
- **Don't commit to main without an issue number** in the commit message body (e.g. `Closes #142`).
- **Em-dashes are forbidden in copy.** Replace with periods, commas, or rephrase. See `wiki/11-brand-and-voice.md`.

## When something is off

1. **Stuck on a Next.js routing weirdness?** → `wiki/06-critical-traps.md` § Next.js, then the underlying rule.
2. **Stuck on a Strapi update?** → `wiki/06-critical-traps.md` § Strapi.
3. **Build green, prod 500?** → `wiki/08-deploy-and-verify.md` for the diagnostic protocol.
4. **Codex CLI silent / hung?** → `~/.claude/rules/codex-pair-programming-fallbacks.md` — fall back to `code-simplifier` for single-file review.

## Maintenance

The wiki is maintained by agents, not by hand. When a session teaches you something durable, follow the maintenance protocol in `wiki/index.md` § Maintenance. Append a `## [YYYY-MM-DD] ingest` entry to `wiki/log.md`.

A stale wiki entry is worse than a missing one — when you spot a contradiction or stale claim, fix it in the same session.
