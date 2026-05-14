# 12 — People and Lanes

Three humans, three lanes. Touching the wrong lane without explicit handoff causes friction and slows the team.

## The three lanes

### Peter — Owner

**Owns:** Product decisions, kashruth standards, per-lb pricing, bundle composition, inventory truth, Strapi product data, photography approval.

**Touching Peter's lane means:**
- Editing PDP copy or kashruth descriptions
- Changing how a price renders (per-lb labels, units, weight estimates) — see [[05-pricing-and-catch-weight]]
- Adding/removing/restructuring a product bundle
- Approving regenerated imagery for products
- Adjusting which products go in SpecialtyRow / Bestsellers / a featured collection

**Protocol:**
- **File an issue tagged for Peter, don't decide.** Even when "the right answer is obvious," let Peter confirm before shipping. The Bundle Merchandising initiative is on engineering hold for exactly this reason — see `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/bundle-merchandising-status.md`.
- For pricing-economic questions: validate with Peter or the price list before coding. See `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/feedback-validate-catalog-economics-with-peter.md`.
- **Approved bypass for time-sensitive copy fixes** (typos, em-dashes, broken links): just fix and tell Peter what changed. Don't wait for approval on cosmetic corrections.

### Chris — CTO

**Owns:** Checkout flow, Stripe (live mode), Postmark transactional email, Vercel project access, environment variables for production.

**Touching Chris's lane means:**
- Editing `src/modules/checkout/*` — multi-step checkout templates, address forms, payment selection, order summary
- Editing `src/lib/data/payment.ts`, `src/lib/data/fulfillment.ts`
- Anything Stripe-related (`src/modules/checkout/components/payment/constants.tsx` and similar)
- Postmark template changes (live in Medusa admin, not in this repo, but if you find a config here, ask first)
- Adding/rotating Vercel env vars in production (`vercel env add` against `production`)

**Protocol:**
- **File an issue tagged `checkout`, don't push code.** Chris's lane is the highest-stakes — broken checkout is revenue gone.
- If Chris asks for storefront-side input (a layout fix on the order-summary panel, a copy tweak on the empty-cart state), that's Avi's lane to deliver, but escalate any code that crosses into payment provider config.
- For env-var rotations: Avi is allowed to ROTATE secrets in non-payment systems (Strapi tokens, Postmark dev-mode keys, Algolia search keys). Anything Stripe is Chris.

### Avi — CTO / CoS

**Owns:** Everything else.

**That means:**
- All public storefront surfaces NOT in checkout: homepage, PLP, PDP layout (Peter approves copy + pricing; Avi owns layout), recipes, kashruth pages, footer info pages, mobile parity, brand work, search experience
- Performance optimization, accessibility, SEO
- The strategy repo `grillerspride` (leadership portal)
- All AI / imagery pipelines (`product-merch`)
- Wiki + memory + global rules maintenance (this wiki)
- GitHub issue triage and filing

**Protocol:**
- Avi can decide and ship anything in his lane without external sign-off.
- Anything that LOOKS like it might cross into Peter's or Chris's lane → ask first, even when the technical answer is clear.

## Decision matrix

When in doubt, this matrix resolves "who decides?":

| Scenario | Who decides |
|---|---|
| A typo on the homepage | Avi ships, tells Peter |
| Adding a new homepage section | Avi proposes; Peter approves before ship |
| Changing per-lb display copy ("Estimated $X for Y lb" → "≈$X / Y lb pack") | Avi proposes; Peter approves |
| Fixing a card layout overflow on mobile | Avi ships, tells nobody |
| Restructuring `formatProductPriceDisplay` internals | Avi ships; Peter informed; mandatory two-pass Codex |
| Adding a new Stripe payment method | Chris owns from spec to ship |
| Wiring a Postmark template tag for a new flow | Chris |
| Fixing a broken image on a recipe card | Avi |
| Generating new product imagery | Avi (via `product-merch`); Peter approves before publish |
| Bundle composition / SKU pricing logic | Peter |
| New PLP filter group | Avi proposes; Peter approves if it changes how kashruth/sourcing is exposed |
| Adding a new collection or category | Peter decides; Avi implements |
| Closed issue revisit (e.g. new bypass surfaced for a fixed bug) | Whoever owned the original — usually loops back to Avi |

## Communication norms

- **GitHub issues** are the source of truth for "what is being worked on." File issues for everything that takes >30 min OR crosses a lane boundary.
- **iMessage** for time-sensitive coordination (an outage, a Peter call prep, a Stripe transient error).
- **Email** for asynchronous status to Peter / Dan / Jacob.
- **The strategy portal (`grillerspride.com` internal route)** for written analysis Peter reviews on his own time.
- **Slack** is NOT in active use for this project (Peter doesn't use it).

## Tags for issue routing

The `aviswerdlow/grillers-pride-strategy` repo labels (from past issues):

| Label | Routes to | What it means |
|---|---|---|
| `bug` | Avi by default | A regression to fix |
| `mobile` | Avi | Mobile-specific bug |
| `launch-blocker` | Avi | Must ship before site launch / Peter-visible |
| `copy` | Avi (if cosmetic), Peter (if substantive) | Text changes |
| `footer` | Avi | Footer / info-page work |
| `checkout` | Chris | Checkout / Stripe / fulfillment |
| `design-handoff` | Chris from Avi | Asset / link / content waiting for Chris to wire up |
| `enhancement` | Avi default | New feature |
| `post-launch` | (defer) | Not for current sprint |

If filing a new issue and the lane is unclear, default `bug` + relevant area label, leave assignee blank. The right human or agent will pick it up.

## "When in doubt" rule

**File the issue, don't push the commit.** The cost of a 1-day wait for Peter or Chris to weigh in is much lower than the cost of shipping a fix that conflicts with their judgment. Especially for:
- Pricing display changes
- Anything in checkout
- Any product copy that mentions kosher / hechsher / shchita

For everything else, default to confident action. The brand benefits more from a steady stream of small fixes than from agonizing over each one.

## Next reads

- [[03-getting-started]] § "Never do this without explicit permission"
- [[07-shipping-an-issue]] — the validation gate
- [[11-brand-and-voice]] — Peter's voice + brand decisions
- [[14-services-and-access]] — what Avi can rotate vs what Chris owns
