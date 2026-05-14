# 07 — Shipping an Issue

The validation gate every closed issue must pass. Non-negotiable.

## The minimum bar for "done"

A closed issue means: code merged + deployed + verified working on the surfaces a real customer uses + peer-reviewed + close comment explains what changed and why.

The full checklist (do all):

1. **Local check** — `yarn lint` clean, `yarn build` succeeds (catches TS errors that `yarn dev` doesn't, since `ignoreBuildErrors: true`).
2. **Chrome verification at 1440px AND 375px.** Both viewports. Real screenshots from production (or local dev for un-deployed changes). Mobile-only verification has shipped desktop regressions; desktop-only has shipped mobile regressions. Always both. (See [[06-critical-traps]] § M-1 for Chrome MCP gotchas.)
3. **Adversarial Codex review** of the diff before push. `/codex:review` for regular review, `/codex:adversarial-review` for shared abstractions, auth, financial calc, kashruth, transactional email.
4. **Two-pass Codex** if the change touches a shared abstraction (price resolver, kashruth badge component, layout chrome, navigation): first on the diff, second with "find every consumer" prompt.
5. **Direct commit to `main`** referencing the issue number. **No PRs.**
6. **Wait for build success** — `gh api repos/aviswerdlow/grillers-medusa-frontend/commits/$SHA/status` shows `success`. Don't test before the build finishes.
7. **Match the `dpl_…` ID** in the rendered production HTML to your commit's deploy ID. If they don't match, the alias hasn't promoted yet — wait 30–60s.
8. **Issue close comment** following the template below.

## The close-comment template

```
✅ Closed by <commit-SHA>.

**Root cause:** <one line — what was actually wrong>
**Fix:** <one line — what the commit does>
**Codex review:** <clean | flagged-and-fixed | unavailable>
**Verification:**
- Desktop (1440px): <screenshot / observation>
- Mobile (375px): <screenshot / observation>

<Any follow-ups filed as new issues, e.g. "#NNN — caching infra cleanup">
```

Examples in the wild (closed issues, ordered): `#72`, `#73`, `#76`, `#98`, `#104`, `#114`, `#128`.

## When to pause instead of pushing through

- **Estimated 30–60 min task hits 2 hours actual** → post a status comment on the issue with what you've found, **don't black-hole the session**. Move to the next issue.
- **Fix requires a Strapi schema change or a Vercel env var** → file as a sub-issue assigned to whoever has the access (Chris for Vercel, Peter for product decisions). Don't try to fix-forward without access.
- **Codex flags a security or data-integrity issue you don't have a clean answer for** → ship the partial fix as WIP behind a flag, file a follow-up, don't merge the half-thought-through full fix.
- **The Chrome extension flakes mid-batch** → recovery in order: (1) wait 2-4s + retry once via `browser_batch wait`; (2) fresh `tabs_context_mcp`; (3) fall back to `curl + JS getBoundingClientRect` via `javascript_tool`; (4) note "screenshot unavailable" in the close comment and rely on the JS getBoundingClientRect output + your own diff re-read.

## The shared-abstraction protocol

If the fix touches a shared helper (resolver, formatter, util):

1. **First Codex pass:** `/codex:review` on the diff.
2. **Second Codex pass:** `/codex:adversarial-review` with the explicit prompt:
   > *"Audit every file that imports `<helper-name>` and confirm it routes through the resolver correctly. Look for surfaces that bypass the helper and reproduce the regression class manually. Output: list of every bypass site with file:line, severity, and proposed fix."*

Only close the issue after the second pass returns clean. **A closed-with-clean-first-pass-only issue is still revisitable** if the second pass surfaces bypasses — add a top-comment to the closed issue with the new commit SHA + Codex findings. Don't reopen unless the original symptom recurs.

**Cost of skipping this:** 2026-05-13 `#104/#31` pricing fix — first review clean → closed → second review found 4 P1/P2 bypass sites (side-cart, full-cart NetWeightPricing, two search dropdowns, multi-variant SSR). Follow-up commit `bf5a74b` on top of closed issues. See [[10-recent-incidents]].

## Mobile + desktop verification toolkit

The Chrome inject JS for verifying an element is in view at the current viewport:

```js
const el = document.querySelector('<selector>')
const r = el?.getBoundingClientRect()
JSON.stringify({
  top: r?.top,
  bottom: r?.bottom,
  viewport: window.innerHeight,
  fullyInView: r ? r.bottom <= window.innerHeight && r.top >= 0 : false,
})
```

Use `resize_window` between viewports, but verify `window.innerWidth` actually changed before trusting the screenshot. Give the render 4–6 seconds after navigate before measuring (async data loads can shift layout).

For strict 375px (real mobile) verification when Chrome MCP lies, use shell-launched headless Chrome — see [[09-testing]] § "Strict 375px mobile screenshots" and `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/headless-chrome-mobile-screenshots.md`.

## Touching shared abstractions — the high-stakes list

A bug fix counts as touching a shared abstraction if it modifies ANY of:

- `src/lib/util/price-display.ts` or `get-product-price.ts` → [[05-pricing-and-catch-weight]] protocol applies
- `src/modules/products/components/kashruth-badges/` → kashruth-policy regression class
- `src/modules/collections/components/strapi-product-grid.tsx` → PLP card; touches grid AND list, plus PDP "you might also like" via re-import
- `src/modules/common/components/localized-client-link.tsx` → every link on the site
- `src/middleware.ts` → every request
- `src/lib/config.ts` → every Medusa SDK call

Each requires the two-pass Codex protocol AND mobile + desktop screenshots on multiple consumer pages (PLP, PDP, cart, search results).

## What NOT to do

- Don't `gh issue close` from CI output alone — the build green-checking doesn't tell you the rendered UI is correct.
- Don't close an issue with only desktop verification when there's any mobile surface affected (homepage, PDP, PLP, cart, account, info pages — basically everything customer-facing).
- Don't skip Codex on financial / auth / kashruth code, even when "obviously fine."
- Don't push a one-liner "fix" without re-reading the broader function you're touching — most bugs in this repo have an analogous bug 20 lines away.

## Full reference

The detailed rule (with example sessions and edge cases) is `~/.claude/rules/ship-an-issue-validation-gate.md`. **This wiki page summarizes the protocol; the rule is the source of truth.**

## Next reads

- [[06-critical-traps]] — what the validation gate is catching
- [[08-deploy-and-verify]] — what to do AFTER pushing
- [[10-recent-incidents]] — outages this gate would have prevented
