#!/usr/bin/env node

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i]
  if (!arg.startsWith("--")) continue
  const [key, inlineValue] = arg.slice(2).split("=")
  const value = inlineValue ?? process.argv[i + 1]
  args.set(key, value)
  if (inlineValue === undefined) i += 1
}

const experimentKey = args.get("experiment")
const winner = args.get("winner")

if (!experimentKey || !winner) {
  console.log(
    [
      "Usage:",
      "  node scripts/experiments/promote-winner.mjs --experiment homepage_shopping_flow_v1 --winner products_earlier",
      "",
      "This script is intentionally non-destructive. It prints the required promotion workflow so a winner is shipped through normal code review and tests.",
    ].join("\n")
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      experiment_key: experimentKey,
      winner,
      workflow: [
        "Freeze allocation in Statsig so no new users enter the losing variants.",
        "Run scripts/experiments/report.mjs and confirm the primary metric and guardrails.",
        "Confirm purchase telemetry is healthy and revenue gates pass.",
        "Set the winning variant as the code default or Strapi default content.",
        "Remove losing variant code paths and unused Strapi placement references.",
        "Keep the Strapi experiment record archived for historical reporting.",
        "Run unit tests, type/build checks, checkout smoke tests, PDP smoke tests, and desktop/mobile screenshots.",
      ],
      destructive_changes_applied: false,
    },
    null,
    2
  )
)
