# Wiki Log

Chronological, append-only record of wiki ingests, queries, and lint passes. Most recent at the bottom.

**Format convention:** every entry starts with `## [YYYY-MM-DD] <op> | <subject>` so the log is grep-friendly:

```bash
grep "^## \[" wiki/log.md | tail -10              # last 10 entries
grep "^## \[" wiki/log.md | grep ingest           # only ingests
grep -A 20 "## \[2026-05" wiki/log.md             # all May entries with bodies
```

`<op>` is one of: `ingest` (new source / new lesson incorporated), `query` (a worthwhile Q&A worth filing), `lint` (health-check pass), `incident` (production breakage worth recording).

---

## [2026-05-14] ingest | Wiki birth — initial knowledge compounding pass

**Source:** Multi-session accumulated context (Apr–May 2026), prior CLAUDE.md, global rules (`~/.claude/rules/`), project memory (`~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/`).

**What was created:**
- `wiki/index.md` — catalog of pages with one-line summaries and external rule pointers
- `wiki/log.md` — this file
- 14 topic pages covering architecture, repos, getting-started, data patterns, pricing, critical traps, shipping-an-issue, deploy/verify, testing, recent incidents, brand/voice, people/lanes, imagery pipeline, services/access
- `AGENTS.md` at repo root — Codex-readable mirror of the wiki pointer

**What was preserved:**
- Existing `CLAUDE.md` content (architecture overview, env vars, etc.) was kept and extended with a "Read the wiki first" pointer block at the top. No content removed.

**Rationale:** Per the Karpathy LLM-Wiki framework, knowledge for "building on the new Grillers Pride site" was scattered across the chat history, global rules, and project memory. An agent entering fresh had no single map. The wiki now provides that map. Each page **delegates** to rules/memory rather than duplicating, so updates land in one place.

**Known gaps (for next ingests to address):**
- No page yet on the **Algolia indexing pipeline** (how products get from Strapi → Algolia, what triggers reindex, how to debug a missing product) — file when first agent has to debug it.
- No page yet on **GTM / analytics event taxonomy** (every page tracks a lot; agents need to know which events to fire on new flows) — defer until first feature work touches checkout instrumentation.
- No `recent-pdp-imagery-history.md` capturing the May 2026 imagery regeneration (HowItWorks cards, WhyUs hero v1→v2 with AI-tell critique) — the briefs in `~/Downloads/pdp-imagery-brief.md` and `~/Downloads/recipe-imagery-brief.md` capture the *pattern*, not the *artifacts*. Decide whether to fold into [13-imagery-pipeline.md](./13-imagery-pipeline.md) if a future agent needs to regenerate.

**Verification:** Every page `[[link]]` was sanity-checked against the file list in this commit. No orphans. 14 topic pages + index + log. Inbound `[[]]` ref counts: critical-traps 11, pricing-and-catch-weight 7, shipping-an-issue 7, deploy-and-verify 7; lowest 1–2 (architecture, repos, testing, brand) — all single-direction navigation chains, intentional.

**File map (post-build):**

```
grillers-medusa-frontend/
├── AGENTS.md                      ← Codex entry point + cardinal rules (NEW)
├── CLAUDE.md                      ← Claude entry point, extended with wiki pointer
└── wiki/
    ├── index.md                   ← catalog, external rule pointers
    ├── log.md                     ← this file
    ├── 01-architecture.md         ← system map
    ├── 02-repos.md                ← 5-repo layout
    ├── 03-getting-started.md      ← agent quickstart
    ├── 04-data-patterns.md        ← server actions, GraphQL, SDK
    ├── 05-pricing-and-catch-weight.md  ← the resolver pattern
    ├── 06-critical-traps.md       ← every known production-breaker
    ├── 07-shipping-an-issue.md    ← validation gate
    ├── 08-deploy-and-verify.md    ← post-push protocol
    ├── 09-testing.md              ← Jest, Playwright, 375px verify
    ├── 10-recent-incidents.md     ← outage timeline
    ├── 11-brand-and-voice.md      ← copy + design rules
    ├── 12-people-and-lanes.md     ← Peter / Chris / Avi lanes
    ├── 13-imagery-pipeline.md     ← Fal.ai pattern
    └── 14-services-and-access.md  ← URLs + credentials pointers
```

**Total wiki size:** ~15.2K words / ~91KB.
