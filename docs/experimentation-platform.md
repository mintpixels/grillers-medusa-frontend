# Griller's Pride Experimentation Platform

This storefront uses Statsig for assignment and the existing first-party Jitsu/Railway analytics pipeline for measurement. GA4 remains useful for directional product analytics, but winner decisions should use first-party exposure and commerce events.

## Architecture

- Assignment happens server-side in `src/lib/experiments/server.ts`.
- Statsig integration is isolated in `src/lib/experiments/statsig-server.ts`.
- Experiment definitions live in `src/lib/experiments/registry.ts`.
- Sticky assignment cookies live in `_gp_exp_id` and `_gp_exp_assignments`.
- Client exposure tracking lives in `src/lib/experiments/exposure.tsx`.
- Jitsu event enrichment lives in `src/lib/jitsu.ts`.
- Add-to-cart line metadata carries active experiment context via `src/lib/experiments/client-context.ts`.
- Medusa server-side analytics subscribers forward experiment context on `cart_updated` and `order_completed`.
- Strapi content-driven experiment records live in `experiment`, `experiment-variant`, and `experiment-placement` content types.

## Environment

Required for Statsig assignment:

```bash
STATSIG_SERVER_SECRET=secret-...
```

Revenue experiment guardrails:

```bash
EXPERIMENTS_KILL_SWITCH=false
EXPERIMENTS_REVENUE_GATE_STATUS=pass
EXPERIMENTS_ALLOW_REVENUE_EXPERIMENTS=false
```

Production revenue experiments are blocked unless `EXPERIMENTS_REVENUE_GATE_STATUS=pass` or `EXPERIMENTS_ALLOW_REVENUE_EXPERIMENTS=true`. This matches the strategy-doc rule: do not scale serious funnel or revenue experiments while purchase telemetry or GA4/QBD parity is suspect.

Local QA override:

```bash
EXPERIMENT_STATUS_HOMEPAGE_SHOPPING_FLOW_V1=active
EXPERIMENT_FORCE_HOMEPAGE_SHOPPING_FLOW_V1=products_earlier
```

`EXPERIMENT_STATUS_*` lets operations activate or pause a registered experiment without a code change. `EXPERIMENT_FORCE_*` is for QA and preview links; it still respects the global kill switch and revenue guardrails.

## Event Shape

`experiment_exposed` is sent to Jitsu with:

- `experiment_key`
- `variant_key`
- `assignment_id`
- `anonymous_id`
- `user_id`, when known
- `session_id`
- `route_market`
- `customer_type`
- `page_path`
- `timestamp`

Downstream Jitsu events include `experiment_context` after exposure. Add-to-cart line metadata also carries `experiment_context`, which lets the Medusa `order.placed` subscriber preserve context on server-side `order_completed`.

## Current V1 Surfaces

- `homepage_shopping_flow_v1`
- `pdp_at_a_glance_v1`
- `navigation_ways_to_shop_v1`
- `plp_merchandising_v1`
- `search_merchandising_v1`
- `recipes_entrypoints_v1`
- `learn_entrypoints_v1`
- `collections_entrypoints_v1`
- `cart_upsell_strategy_v1`
- `pdp_recommendation_strategy_v1`
- `newsletter_capture_v1`
- `seo_geo_landing_copy_v1`
- `reviews_proof_v1`

All controls are the current production experience. The homepage, PDP at-a-glance, cart upsell, and PDP recommendation experiments include real code branches. The remaining surfaces are registered and ready for content/code branches as they become launch-ready. The registry starts paused so this deploy does not change shopper-facing UI until an experiment is explicitly activated.

## Creating An Experiment

1. Add or update the experiment in `src/lib/experiments/registry.ts`.
2. Create the matching Statsig experiment using the same key.
3. If the variant is content-driven, create Strapi `Experiment`, `Experiment Variant`, and `Experiment Placement` records and keep them unpublished until ready.
4. Add the code branch only at the target surface. Keep the control branch identical to current production.
5. Add tests for fallback, sticky assignment, blocked revenue behavior, and the specific UI branch.
6. Verify the target page with experiments disabled and with each forced variant.

Use `docs/experimentation-proposal-template.md` for agent-generated proposals.

## Reporting

Run a dry run first:

```bash
yarn experiments:report --experiment homepage_shopping_flow_v1 --dry-run
```

When ClickHouse access is available:

```bash
CLICKHOUSE_URL=https://clickhouse.example.com \
CLICKHOUSE_EVENTS_TABLE=events \
yarn experiments:report --experiment homepage_shopping_flow_v1 --since 2026-05-01 --until 2026-05-15
```

The report attributes commerce by `experiment_context.assignment_id` first, so server-side `order_completed` events from Medusa can join to exposure through cart line metadata. It returns exposures, sessions, add-to-cart, checkout started, orders, revenue, conversion rate, AOV, Bayesian probability to beat control, uplift versus control, and a conservative status label.

Winner labels are intentionally conservative:

- `needs_data`: either control or variant has fewer than 100 sessions.
- `directional`: enough data to inspect, but not enough probability to ship.
- `likely_winner`: posterior probability to beat control is at least 95%.
- `likely_loser`: posterior probability to beat control is at most 5%.

## Promoting A Winner

```bash
yarn experiments:promote --experiment homepage_shopping_flow_v1 --winner products_earlier
```

The promotion script is intentionally non-destructive. Promotion should happen through normal code review:

1. Freeze allocation in Statsig.
2. Confirm the report and guardrails.
3. Set the winner as the default in code or Strapi.
4. Remove losing variant branches and unused placement references.
5. Archive the Strapi experiment metadata.
6. Run unit, type/build, checkout, PDP, desktop, and mobile verification.

## V2 AI Readiness

The platform is ready for agent-generated proposals, but prompt-to-live publishing is intentionally not enabled. The next layer should generate the proposal, required Strapi content changes, screenshot checklist, and any fal.ai/nanobanana imagery work, then require human approval before activation.

The Amboras-style extension points are:

- Generate proposal markdown from `docs/experimentation-proposal-template.md`.
- Generate Strapi `Experiment Variant` and `Experiment Placement` draft content.
- Generate new imagery through the approved fal.ai/nanobanana workflow and store assets in Strapi before referencing them.
- Open a code branch only for structural UX variants.
- Activate through Statsig after guardrails pass.
- Promote winners by removing losing branches through normal review.
