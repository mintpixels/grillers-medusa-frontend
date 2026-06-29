import {
  emitStorefrontOpsAlert,
  type OpsAlertSeverity,
} from "@lib/ops-alert"

/**
 * Cron observability seam (Section A).
 *
 * The Vercel storefront crons (`back-in-stock-trigger`, `review-acquisition`)
 * compute a summary with error/failure counts then return HTTP 200 regardless,
 * so a silently-broken cron (bad env, upstream 500s) can no-op for days — the
 * cron analog of the QBWC password-rotation trap. This module turns a cron
 * summary into ops_alert events (delivered by ops-pager) without changing the
 * cron's HTTP contract (Vercel cron expects 200).
 *
 * Severity guide (shared contract):
 *   - money / customer-blocking  -> page
 *   - degradation / integrity    -> warn
 *   - FYI (heartbeat)            -> info  (warehouse-only, never delivered)
 *
 * The decision logic is split into pure planners (`planBackInStockAlert`,
 * `planReviewAcquisitionAlert`) so it can be unit-tested without network I/O;
 * `emit*` wrappers do the fire-and-forget emission.
 */

export type CronAlertPlan = {
  alertKind: string
  severity: OpsAlertSeverity
  title: string
  meta: Record<string, unknown>
} | null

// ── Misconfiguration (page) ─────────────────────────────────────────
// A missing required env var means the cron quietly does nothing on every
// fire. That's a paging condition: it looks "green" (HTTP 200) but is dead.

export function planMisconfiguredAlert(
  cron: string,
  missingEnv: string[]
): CronAlertPlan {
  if (missingEnv.length === 0) return null
  return {
    alertKind: "cron_skipped_misconfigured",
    severity: "page",
    title: `cron ${cron} skipped: missing env ${missingEnv.join(", ")}`,
    meta: { cron, missing_env: missingEnv },
  }
}

// ── back-in-stock-trigger ───────────────────────────────────────────

export type BackInStockSummaryLike = {
  ok: boolean
  productsConsidered: number
  productsBackInStock: number
  subscribersNotified: number
  subscribersFailed: number
  errors: string[]
}

/**
 * Page when the run hard-failed at the top level (`ok:false`) — nothing was
 * processed. Warn when individual subscribers failed (a customer who asked to
 * be notified about a restock didn't get the email) or non-fatal errors
 * accumulated. Otherwise no alert (a heartbeat is emitted separately).
 */
export function planBackInStockAlert(
  summary: BackInStockSummaryLike
): CronAlertPlan {
  const hasErrors = summary.errors.length > 0
  const hasFailures = summary.subscribersFailed > 0
  const totalFailure = !summary.ok

  if (!hasErrors && !hasFailures && !totalFailure) return null

  const severity: OpsAlertSeverity = totalFailure ? "page" : "warn"
  const title = totalFailure
    ? "cron back-in-stock-trigger failed (top-level error)"
    : `cron back-in-stock-trigger degraded: ${summary.subscribersFailed} subscriber send(s) failed`

  return {
    alertKind: "cron_back_in_stock_failed",
    severity,
    title,
    meta: {
      cron: "back-in-stock-trigger",
      ok: summary.ok,
      products_considered: summary.productsConsidered,
      products_back_in_stock: summary.productsBackInStock,
      subscribers_notified: summary.subscribersNotified,
      subscribers_failed: summary.subscribersFailed,
      error_count: summary.errors.length,
      // Cap to keep the event small; full errors are in cron logs.
      errors_sample: summary.errors.slice(0, 5),
    },
  }
}

// ── review-acquisition ──────────────────────────────────────────────

export type ReviewAcquisitionSummaryLike = {
  scanned: number
  sentGoogle: number
  sentYelp: number
  failed: number
  metadataFailed?: number
  suppressionLookupFailed?: number
  suppressionFailureStatus?: number
  suppressionFailureError?: string
  sourceFailed?: boolean
  sourceFailureStage?: string
  sourceStatus?: number
  sourceError?: string
  eligibleGoogle: number
  eligibleYelp: number
  dryRun?: boolean
}

/**
 * Warn when review-ask emails failed to send. Page when the run had eligible
 * customers but every send failed (`failed>0` and nothing got sent) — a total
 * failure of the day's review acquisition. Skips dry runs.
 */
export function planReviewAcquisitionAlert(
  summary: ReviewAcquisitionSummaryLike
): CronAlertPlan {
  if (summary.dryRun) return null
  if (summary.sourceFailed) {
    return {
      alertKind: "cron_review_acquisition_source_failed",
      severity: "page",
      title: "cron review-acquisition failed: delivered-order source unavailable",
      meta: {
        cron: "review-acquisition",
        scanned: summary.scanned,
        failure_stage: summary.sourceFailureStage || "unknown",
        source_status: summary.sourceStatus ?? null,
        source_error: summary.sourceError || null,
      },
    }
  }

  const metadataFailed = summary.metadataFailed || 0
  if (summary.failed <= 0 && metadataFailed <= 0) return null

  if (summary.failed <= 0 && metadataFailed > 0) {
    return {
      alertKind: "cron_review_acquisition_metadata_failed",
      severity: "warn",
      title: `cron review-acquisition degraded: ${metadataFailed} sent review ask(s) missing metadata`,
      meta: {
        cron: "review-acquisition",
        scanned: summary.scanned,
        sent_google: summary.sentGoogle,
        sent_yelp: summary.sentYelp,
        eligible_google: summary.eligibleGoogle,
        eligible_yelp: summary.eligibleYelp,
        failed: summary.failed,
        metadata_failed: metadataFailed,
      },
    }
  }

  const sentAny = summary.sentGoogle > 0 || summary.sentYelp > 0
  const eligibleAny = summary.eligibleGoogle > 0 || summary.eligibleYelp > 0
  const totalFailure = !sentAny && eligibleAny

  const severity: OpsAlertSeverity = totalFailure ? "page" : "warn"
  const title = totalFailure
    ? `cron review-acquisition failed: ${summary.failed} send(s) failed, 0 sent`
    : `cron review-acquisition degraded: ${summary.failed} review-ask send(s) failed`

  return {
    alertKind: "cron_review_acquisition_failed",
    severity,
    title,
    meta: {
      cron: "review-acquisition",
      scanned: summary.scanned,
      sent_google: summary.sentGoogle,
      sent_yelp: summary.sentYelp,
      eligible_google: summary.eligibleGoogle,
      eligible_yelp: summary.eligibleYelp,
      failed: summary.failed,
      metadata_failed: metadataFailed,
    },
  }
}

export function planReviewAcquisitionSuppressionAlert(
  summary: ReviewAcquisitionSummaryLike
): CronAlertPlan {
  const suppressionFailures = summary.suppressionLookupFailed || 0
  if (summary.dryRun || suppressionFailures <= 0) return null

  return {
    alertKind: "cron_review_acquisition_suppression_lookup_failed",
    severity: "page",
    title: `cron review-acquisition suppression lookup failed open for ${suppressionFailures} order(s)`,
    meta: {
      cron: "review-acquisition",
      scanned: summary.scanned,
      suppression_lookup_failed: suppressionFailures,
      suppression_failure_status: summary.suppressionFailureStatus ?? null,
      suppression_failure_error: summary.suppressionFailureError || null,
      sent_google: summary.sentGoogle,
      sent_yelp: summary.sentYelp,
    },
  }
}

// ── Success heartbeat (info, warehouse-only) ────────────────────────
// Lets a future watchdog alert on cron SILENCE (no heartbeat in N hours).
// info is never delivered to Slack, so this is cheap.

export function planHeartbeat(
  cron: string,
  meta: Record<string, unknown> = {}
): CronAlertPlan {
  return {
    alertKind: "cron_heartbeat",
    severity: "info",
    title: `cron ${cron} ran`,
    meta: { cron, ...meta },
  }
}

// ── Emission wrappers ───────────────────────────────────────────────

/**
 * Fire-and-forget emit of a cron alert plan. Never throws — ops alerting must
 * not break the cron HTTP response. The `path` points at the cron route so the
 * pager surfaces a useful location.
 */
export async function emitCronAlert(
  plan: CronAlertPlan,
  path: string
): Promise<void> {
  if (!plan) return
  try {
    await emitStorefrontOpsAlert({
      alertKind: plan.alertKind,
      severity: plan.severity,
      title: plan.title,
      path,
      source: "storefront-cron",
      meta: plan.meta,
    })
  } catch {
    // Fail open.
  }
}
