# 11 — Brand & Voice

The non-negotiable copy + UX rules for customer-facing surfaces. Apply to every PR.

## Voice — Grillers Pride is a family-run Atlanta kosher butcher

The brand voice:
- **Confident, not corporate.** A 35-year butcher who knows the meat, not a marketing team.
- **Kosher-fluent without being preachy.** Customers come to us BECAUSE we're AKC. We don't have to sell them on what kosher means.
- **Respectful of the customer's standard.** Some hold by CHK only, some by Chassidish shchita, some accept anything AKC. The copy never assumes which side they're on. The closing line on the kashruth page captures this perfectly: *"You hold by a specific standard. We respect that."*
- **No anglicized Hebrew.** "Kosher" not "kashrut"; "shchita" preferred over "kosher slaughter"; "Hechsher" capitalized; "Pareve" capitalized; "Cholov Yisroel" two words.
- **Specific is better than generic.** "First-cut brisket from David Elliot, under OU and CHK" beats "premium kosher brisket."

## Forbidden in copy

- **Em-dashes (`—`).** A user-level rule. Replace with periods, commas, or rephrase. Em-dashes are an AI tell that customers notice. Verified clean on production for 404 page, PDPs (per recent issue closures). When in doubt: `grep -n "—" file.tsx`.
- **Smart-quotes (`""''`) where ASCII would work.** Markdown/HTML escapes them inconsistently across renderers; ASCII (`""`) is more reliable.
- **Lorem ipsum, placeholder text, "Coming soon".** Footer info pages were full of these in early May 2026 (closed: #136–#142). Anything visible to a customer needs real copy or a hidden state, not a placeholder.
- **First-person plural overuse.** "We" is fine in moderation; "we will," "we believe," "we are" stacked makes the brand sound corporate. Vary with "Grillers Pride," "the team," product-first phrasing.
- **Marketing superlatives.** "Best," "world-class," "premium," "ultimate" — replace with verifiable specifics (origin, hechsher, weight, source farm).

## Aesthetics

### Brand palette

From `tailwind.config.js`:
- **IsraelBlue** `#0038B8` — primary brand blue (rare; tasteful accents)
- **RichGold** `#B8860B`, **Gold** `#D4AF37` — CTA buttons (Add to Cart), badges
- **Charcoal** `#1A1A1A` — primary text on light bg
- **Scroll** `#F5F0E8` — cream background (homepage, info pages)
- **Teal** `#2E8B8B` — secondary accent
- **Crimson** `#A52A2A`, **VibrantRed** `#DC143C` — destructive (remove from cart, errors)
- **Sage** `#9CAF88`, **Mint** — kashruth chip backgrounds

**Never invent a color.** All accents come from the tailwind palette. Hex literals in component code are a smell — replace with `text-Charcoal`, `bg-Gold`, etc.

### Typography

- **Gyst** (font-gyst) — display / headers (h1, h2, h3, h4). Strong serif.
- **Maison Neue** (font-maison-neue) — body copy.
- **Maison Neue Mono** (font-maison-neue-mono) — labels, prices, hechsher chips, "10 OZ" weight pills.
- **Rexton** (font-rexton) — button labels (`ADD TO CART`, `VIEW DETAILS`), all-caps tracking.

Font files in `src/styles/fonts/`. Don't import system fonts as fallbacks for body text in customer-visible copy.

### Mobile breakpoints

```ts
// tailwind.config.js — extended:
'2xsmall': 320px
'xsmall':  480px
'small':   640px
'medium':  768px
'large':   1024px
'xlarge':  1280px
'2xlarge': 1920px
```

**Design constraint:** Every customer-facing page must work at 375px (iPhone SE/12/13/14/15 mini, ~50% of mobile traffic per GA4). Verify before closing any issue — see [[07-shipping-an-issue]].

## Mobile UX patterns (established, copy from them)

| Pattern | Where it lives | Use when |
|---|---|---|
| Carousel with peek (`slidesPerView: 1.15`) | `src/modules/home/components/shop-bestsellers/swiper.tsx` | Any horizontal list of cards on mobile. Peek shows swipability. |
| Product card (grid + list view) | `src/modules/collections/components/strapi-product-grid.tsx` | All PLP-style product lists; reuse `<ProductCard>` from this file |
| Sticky mobile bottom bar | (component exists, not always imported — see #133) | PDP cart action, account/checkout important CTAs |
| Mobile filter drawer | `src/modules/collections/components/collection-filters.tsx` | PLP filters at <768px |
| 44px minimum tap target | applied via `min-h-[44px]` on every button | Every interactive element |

When you build a new mobile pattern, see if one of the above already solves it. Almost always: copy, don't invent.

## Image quality

For any AI-generated imagery (Fal.ai pipeline — see [[13-imagery-pipeline]]):

**Documentary food photography**, not stylized AI. Photographed, not rendered. Real meat color (deep burgundy with edge oxidation, NOT bright pink, NOT neon). Visible cutting marks, surface moisture, natural shadows.

**AI tells to avoid** (these have shipped on prior generations and looked unprofessional):
- Symmetric / mirrored garnish or props
- Wrong cutlery anatomy (knife with two blades, fork with 5 tines)
- Uniform char marks on grilled meat (real char is irregular)
- Sauce that doesn't obey gravity / surface tension
- Hebrew text or "kosher" lettering in the background (always garbled — the v1 WhyUs hero had AKC seal with "הכרב" gibberish)
- "Frozen" perfect symmetry of slices / chunks (real meat has variance)

**If the image needs specific text** (hechsher symbol, "AKC," "Pareve" badge): generate WITHOUT the text in the prompt, add as graphic-design overlay afterward.

## Accessibility floor

- `aria-label` on every icon-only button.
- `<TooltipProvider>` wraps any tooltip-bearing icon row.
- Color contrast meets WCAG AA (4.5:1 for body, 3:1 for large text). Verify with the Tailwind config palette — most pairings (`text-Charcoal on bg-Scroll`, `text-Gold on bg-Charcoal`) pass.
- `<LocalizedClientLink>` wraps all internal nav (not raw `<a>`) so country code prefixes work.
- Touch targets ≥44px.

## Where existing copy lives

- **Marketing copy on the home page, PDP enrichment, footer info pages** → Strapi (writable via admin). Don't hard-code copy in components if it might change.
- **UI strings, button labels, badges, error messages** → component code. Translations not yet implemented; hard-code English for now.
- **Email body copy** → Postmark templates (Chris's lane, not in this repo).
- **Cart/checkout error messages** → mostly Medusa-side strings; some passed through `src/lib/util/medusa-error.ts` for friendly remapping.

## Brand decisions to honor

These came from Peter and should not be overruled without his explicit OK:
- **AKC kosher certification** is the universal floor. Some products additionally have CHK, Chassidish shchita, etc. Never imply non-AKC certification on the storefront.
- **"Kosher Pride" or "Grillers Pride" — never abbreviate to "Grillers"** alone on customer-facing surfaces. Internal references in code are fine.
- **No dairy + meat content adjacency.** A recipe card showing brisket can't sit next to a recipe card calling for butter. (Currently enforced manually in the Strapi recipe-tagging; future automation should respect this.)
- **The orange/gold accent** is for celebratory CTAs (Add to Cart, View Bundle). Red is destructive only.

## Next reads

- [[05-pricing-and-catch-weight]] — pricing copy patterns
- [[13-imagery-pipeline]] — AI image generation with brand fidelity
- [[12-people-and-lanes]] — who decides what gets shipped
