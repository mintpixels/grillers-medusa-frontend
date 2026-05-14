# 09 — Testing

Three layers: Jest unit, Playwright E2E, browser-based visual verification. Each plays a specific role.

## Jest (unit)

```bash
yarn test                       # all unit tests
yarn test:watch                 # watch mode
yarn test:coverage              # with coverage (50% threshold)
npx jest path/to/file.test.tsx          # single file
npx jest --testPathPattern=ComponentName # by pattern
```

**Config:**
- `jest.config.js` — jsdom environment, path aliases mapped in `moduleNameMapper`.
- `jest.setup.js` — mocks Next.js Navigation, Image, IntersectionObserver.
- Coverage threshold: 50% branches/functions/lines/statements. Not aspirational; treat as floor.

**What unit tests catch:**
- Logic errors in `src/lib/util/*` (price formatting, parsers, helpers).
- React component prop handling and conditional rendering.
- Type errors in test files (because `tsc --noEmit` runs as part of Jest's compilation).

**What unit tests DON'T catch:**
- Layout / visual regressions — Tailwind classes don't get exercised.
- Data flow across server-component → client-component boundaries.
- Browser-specific behavior (Safari date pickers, mobile touch).
- Real Strapi / Medusa data shape (mocks fall behind the API).

Treat unit-test passing as necessary-but-not-sufficient. **It does not replace mobile + desktop visual verification.**

## Playwright (E2E)

```bash
yarn test:e2e                   # all E2E (auto-starts dev server on :8000)
yarn test:e2e:ui                # interactive UI
yarn test:e2e:headed            # headed browser
```

**Config:**
- `playwright.config.ts` — tests in `e2e/`. Multi-browser: Chromium, Firefox, WebKit, mobile.

**What E2E catches:**
- Full-flow regressions (search → PLP → PDP → cart → checkout steps).
- Cross-browser quirks (Safari date picker dropdown shape, Firefox flex baselines).
- Mobile viewport rendering at the OS level (real mobile viewport, not Chrome MCP).

**What E2E DOESN'T catch:**
- Visual bugs that pass functional assertions but look wrong (color mismatch, overlapping text).
- Slow regressions visible only under throttled network.

## Browser-based visual verification (the real-world bar)

For any UI change, the validation gate (see [[07-shipping-an-issue]]) requires real screenshots at:

- **1440px desktop** (Chrome via MCP `resize_window(1440)`)
- **375px mobile** (with caveats — see below)

### Strict 375px mobile screenshots

**The trap:** Chrome MCP `resize_window(375)` does NOT reliably set `window.innerWidth` to 375. In observed runs it returned 500, 606, or even 2390. The resize affects the OS window, not the rendering viewport.

**The fix:** Use shell-launched headless Chrome for strict 375px audits. The full command + flags are in `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/headless-chrome-mobile-screenshots.md`.

Verify the viewport actually changed before screenshotting:

```js
JSON.stringify({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio })
// expect: {"w":375,...}
```

If `w !== 375`, the resize didn't take. Don't proceed.

### Verifying an element's position

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

Run this AFTER waiting 4–6s for async layout to settle.

## Test commands by scenario

| You changed… | Run |
|---|---|
| A `src/lib/util/*` helper | `npx jest --testPathPattern=<filename>` |
| A `src/modules/<feature>/*` component | Existing unit tests for that module, plus visual smoke |
| A checkout step | `yarn test:e2e` for the checkout suite (E2E), plus get Chris's eyes |
| Routing / middleware | E2E because route resolution can't be unit-tested cleanly |
| Strapi GraphQL query shape | No test framework will help here — verify by loading the page locally with a real Strapi token. The mock test would just rubber-stamp wrong code. |

## What the build catches (and what it doesn't)

`yarn build` succeeds even when:
- TypeScript errors exist (`ignoreBuildErrors: true`).
- ESLint errors exist (`ignoreDuringBuilds: true`).
- Routes are partially broken (parallel-route manifest bug — see [[06-critical-traps]] § NX-1).
- Routes are 100% broken from runtime perspective (slug collision — § NX-2).

**Always run `tsc --noEmit` separately if you've touched types:**

```bash
npx tsc --noEmit
```

## What "test it" means in practice

For an issue from the GitHub tracker, the verification protocol (from [[07-shipping-an-issue]]):

1. `yarn lint` clean
2. `yarn build` succeeds
3. Visual verification at 1440px AND 375px on the affected pages
4. Codex review of the diff
5. **Two-pass Codex** if shared abstraction
6. Push, wait for build success, match deploy ID
7. Smoke test on production URL
8. Issue close comment with screenshots

Unit + E2E tests support this; they don't replace it.

## Next reads

- [[06-critical-traps]] — what testing won't catch
- [[07-shipping-an-issue]] — the validation gate
- [[08-deploy-and-verify]] — post-push verification
