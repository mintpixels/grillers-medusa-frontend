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

const experimentKey = args.get("experiment") || process.env.EXPERIMENT_KEY
const since = args.get("since") || process.env.EXPERIMENT_SINCE || "now() - INTERVAL 14 DAY"
const until = args.get("until") || process.env.EXPERIMENT_UNTIL || "now()"
const dryRun = args.has("dry-run")

const clickhouseUrl = process.env.CLICKHOUSE_URL
const clickhouseUser = process.env.CLICKHOUSE_USER
const clickhousePassword = process.env.CLICKHOUSE_PASSWORD
const table = process.env.CLICKHOUSE_EVENTS_TABLE || "events"
const eventTypeExpr = process.env.CLICKHOUSE_EVENT_TYPE_EXPR || "event_type"
const contextExpr = process.env.CLICKHOUSE_CONTEXT_EXPR || "eventn_ctx"
const timestampExpr =
  process.env.CLICKHOUSE_TIMESTAMP_EXPR ||
  `toDateTime(JSONExtractInt(${contextExpr}, 'event_timestamp_ms') / 1000)`
const revenueExpr =
  process.env.CLICKHOUSE_REVENUE_EXPR ||
  `toFloat64OrZero(JSONExtractRaw(${contextExpr}, 'value'))`

function jsonContract(status, extra = {}) {
  console.log(
    JSON.stringify(
      {
        status,
        required_env: [
          "CLICKHOUSE_URL",
          "CLICKHOUSE_EVENTS_TABLE",
          "CLICKHOUSE_CONTEXT_EXPR",
          "CLICKHOUSE_EVENT_TYPE_EXPR",
          "CLICKHOUSE_TIMESTAMP_EXPR",
          "CLICKHOUSE_REVENUE_EXPR",
        ],
        ...extra,
      },
      null,
      2
    )
  )
}

if (!experimentKey) {
  jsonContract("missing_experiment_key", {
    usage: "node scripts/experiments/report.mjs --experiment homepage_shopping_flow_v1 --since '2026-05-01' --until '2026-05-15'",
  })
  process.exit(1)
}

const sinceSql = since.includes("(") || since.includes("INTERVAL") ? since : `'${since}'`
const untilSql = until.includes("(") || until.includes("INTERVAL") ? until : `'${until}'`
const escapedExperimentKey = experimentKey.replace(/'/g, "''")

const sql = `
WITH exposures AS (
  SELECT
    JSONExtractString(${contextExpr}, 'variant_key') AS variant_key,
    JSONExtractString(${contextExpr}, 'assignment_id') AS assignment_id,
    JSONExtractString(${contextExpr}, 'anonymous_id') AS anonymous_id,
    JSONExtractString(${contextExpr}, 'user_id') AS user_id,
    JSONExtractString(${contextExpr}, 'session_id') AS session_id
  FROM ${table}
  WHERE ${eventTypeExpr} = 'experiment_exposed'
    AND JSONExtractString(${contextExpr}, 'experiment_key') = '${escapedExperimentKey}'
    AND ${timestampExpr} >= ${sinceSql}
    AND ${timestampExpr} < ${untilSql}
),
commerce_context AS (
  SELECT
    ${eventTypeExpr} AS event_type,
    JSONExtractString(${contextExpr}, 'event_id') AS event_id,
    JSONExtractString(${contextExpr}, 'transaction_id') AS transaction_id,
    JSONExtractString(${contextExpr}, 'session_id') AS session_id,
    JSONExtractString(experiment.2, 'variant_key') AS variant_key,
    JSONExtractString(experiment.2, 'assignment_id') AS assignment_id,
    ${revenueExpr} AS revenue
  FROM ${table}
  ARRAY JOIN JSONExtractKeysAndValuesRaw(
    JSONExtractRaw(${contextExpr}, 'experiment_context')
  ) AS experiment
  WHERE ${eventTypeExpr} IN (
    'product_added_to_cart',
    'checkout_started',
    'order_completed'
  )
    AND experiment.1 = '${escapedExperimentKey}'
    AND ${timestampExpr} >= ${sinceSql}
    AND ${timestampExpr} < ${untilSql}
),
commerce_by_assignment AS (
  SELECT
    variant_key,
    assignment_id,
    countDistinct(session_id) AS commerce_sessions,
    countDistinctIf(event_id, event_type = 'product_added_to_cart') AS add_to_cart,
    countDistinctIf(event_id, event_type = 'checkout_started') AS checkout_started,
    countDistinctIf(
      if(transaction_id = '', event_id, transaction_id),
      event_type = 'order_completed'
    ) AS order_completed,
    sumIf(revenue, event_type = 'order_completed') AS revenue
  FROM commerce_context
  WHERE assignment_id != ''
  GROUP BY variant_key, assignment_id
)
SELECT
  exposures.variant_key AS variant_key,
  countDistinct(exposures.assignment_id) AS exposures,
  countDistinct(exposures.session_id) AS sessions,
  sum(commerce_by_assignment.add_to_cart) AS add_to_cart,
  sum(commerce_by_assignment.checkout_started) AS checkout_started,
  sum(commerce_by_assignment.order_completed) AS order_completed,
  sum(commerce_by_assignment.revenue) AS revenue,
  if(sessions = 0, 0, order_completed / sessions) AS conversion_rate,
  if(order_completed = 0, 0, revenue / order_completed) AS aov,
  if(sessions < 100, 'needs_data', 'directional') AS status_label
FROM exposures
LEFT JOIN commerce_by_assignment
  ON commerce_by_assignment.assignment_id = exposures.assignment_id
  AND commerce_by_assignment.variant_key = exposures.variant_key
GROUP BY exposures.variant_key
ORDER BY exposures.variant_key
FORMAT JSONEachRow
`.trim()

if (dryRun) {
  jsonContract("dry_run", { sql })
  process.exit(0)
}

if (!clickhouseUrl) {
  jsonContract("missing_clickhouse_url", { sql })
  process.exit(0)
}

const headers = { "Content-Type": "text/plain" }
if (clickhouseUser || clickhousePassword) {
  const token = Buffer.from(
    `${clickhouseUser || "default"}:${clickhousePassword || ""}`
  ).toString("base64")
  headers.Authorization = `Basic ${token}`
}

const res = await fetch(clickhouseUrl, {
  method: "POST",
  headers,
  body: sql,
})

if (!res.ok) {
  console.error(await res.text())
  process.exit(1)
}

const text = await res.text()
const rows = text
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line))

function normalSample() {
  const u = Math.max(Math.random(), Number.EPSILON)
  const v = Math.max(Math.random(), Number.EPSILON)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function gammaSample(shape) {
  if (shape < 1) {
    return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape)
  }

  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)

  while (true) {
    const x = normalSample()
    const v = Math.pow(1 + c * x, 3)
    if (v <= 0) continue

    const u = Math.random()
    if (
      u < 1 - 0.0331 * Math.pow(x, 4) ||
      Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))
    ) {
      return d * v
    }
  }
}

function betaSample(alpha, beta) {
  const x = gammaSample(alpha)
  const y = gammaSample(beta)
  return x / (x + y)
}

function enrichRows(rawRows) {
  const rows = rawRows.map((row) => ({
    ...row,
    exposures: Number(row.exposures || 0),
    sessions: Number(row.sessions || 0),
    add_to_cart: Number(row.add_to_cart || 0),
    checkout_started: Number(row.checkout_started || 0),
    order_completed: Number(row.order_completed || 0),
    revenue: Number(row.revenue || 0),
    conversion_rate: Number(row.conversion_rate || 0),
    aov: Number(row.aov || 0),
  }))
  const control = rows.find((row) => row.variant_key === "control") || rows[0]
  if (!control) return rows

  const controlSuccess = control.order_completed + 1
  const controlFailure = Math.max(control.sessions - control.order_completed, 0) + 1
  const sampleCount = Number(process.env.EXPERIMENT_REPORT_SAMPLES || 5000)

  return rows.map((row) => {
    const success = row.order_completed + 1
    const failure = Math.max(row.sessions - row.order_completed, 0) + 1
    let wins = 0

    for (let i = 0; i < sampleCount; i += 1) {
      const variantRate = betaSample(success, failure)
      const controlRate =
        row.variant_key === control.variant_key
          ? betaSample(success, failure)
          : betaSample(controlSuccess, controlFailure)
      if (variantRate > controlRate) wins += 1
    }

    const probability = sampleCount > 0 ? wins / sampleCount : null
    const controlRate = control.sessions
      ? control.order_completed / control.sessions
      : 0
    const uplift =
      controlRate > 0 ? (row.conversion_rate - controlRate) / controlRate : null
    const statusLabel =
      row.sessions < 100 || control.sessions < 100
        ? "needs_data"
        : probability !== null && probability >= 0.95
        ? "likely_winner"
        : probability !== null && probability <= 0.05
        ? "likely_loser"
        : "directional"

    return {
      ...row,
      probability_to_beat_control: probability,
      uplift_vs_control: uplift,
      status_label: statusLabel,
    }
  })
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      experiment_key: experimentKey,
      method: "beta_binomial_monte_carlo",
      rows: enrichRows(rows),
    },
    null,
    2
  )
)
