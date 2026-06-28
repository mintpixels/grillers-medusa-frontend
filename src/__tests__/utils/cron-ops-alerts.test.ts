/**
 * @jest-environment node
 *
 * Unit coverage for the Section A cron alert planners. Pure functions: no
 * network, no env — they map a cron summary to an ops_alert plan (or null).
 * The emit contract (event_name='ops_alert', severity, fingerprint, ...) is
 * exercised by the shared `emitStorefrontOpsAlert`; here we assert the
 * severity/kind decisions that drive paging vs warn vs silence.
 */

import {
  planBackInStockAlert,
  planHeartbeat,
  planMisconfiguredAlert,
  planReviewAcquisitionAlert,
  type BackInStockSummaryLike,
  type ReviewAcquisitionSummaryLike,
} from "@lib/cron-ops-alerts"

describe("planMisconfiguredAlert", () => {
  it("returns null when nothing is missing", () => {
    expect(planMisconfiguredAlert("back-in-stock-trigger", [])).toBeNull()
  })

  it("pages on missing env (the silent-no-op trap)", () => {
    const plan = planMisconfiguredAlert("review-acquisition", [
      "MEDUSA_ADMIN_API_TOKEN",
    ])
    expect(plan).not.toBeNull()
    expect(plan!.alertKind).toBe("cron_skipped_misconfigured")
    expect(plan!.severity).toBe("page")
    expect(plan!.meta.missing_env).toEqual(["MEDUSA_ADMIN_API_TOKEN"])
  })
})

describe("planBackInStockAlert", () => {
  const base: BackInStockSummaryLike = {
    ok: true,
    productsConsidered: 3,
    productsBackInStock: 1,
    subscribersNotified: 5,
    subscribersFailed: 0,
    errors: [],
  }

  it("returns null on a clean run", () => {
    expect(planBackInStockAlert(base)).toBeNull()
  })

  it("warns when individual subscriber sends failed", () => {
    const plan = planBackInStockAlert({ ...base, subscribersFailed: 2 })
    expect(plan!.alertKind).toBe("cron_back_in_stock_failed")
    expect(plan!.severity).toBe("warn")
    expect(plan!.meta.subscribers_failed).toBe(2)
  })

  it("warns when non-fatal errors accumulated", () => {
    const plan = planBackInStockAlert({ ...base, errors: ["strapi 500"] })
    expect(plan!.severity).toBe("warn")
    expect(plan!.meta.error_count).toBe(1)
    expect(plan!.meta.errors_sample).toEqual(["strapi 500"])
  })

  it("pages on a top-level failure (ok:false)", () => {
    const plan = planBackInStockAlert({
      ...base,
      ok: false,
      errors: ["boom"],
    })
    expect(plan!.severity).toBe("page")
  })
})

describe("planReviewAcquisitionAlert", () => {
  const base: ReviewAcquisitionSummaryLike = {
    scanned: 10,
    sentGoogle: 4,
    sentYelp: 1,
    failed: 0,
    eligibleGoogle: 4,
    eligibleYelp: 1,
  }

  it("returns null when nothing failed", () => {
    expect(planReviewAcquisitionAlert(base)).toBeNull()
  })

  it("returns null for dry runs", () => {
    expect(
      planReviewAcquisitionAlert({ ...base, failed: 3, dryRun: true })
    ).toBeNull()
  })

  it("warns when some sends failed but others succeeded", () => {
    const plan = planReviewAcquisitionAlert({ ...base, failed: 2 })
    expect(plan!.alertKind).toBe("cron_review_acquisition_failed")
    expect(plan!.severity).toBe("warn")
    expect(plan!.meta.failed).toBe(2)
    expect(plan!.meta.metadata_failed).toBe(0)
  })

  it("pages when eligible customers existed but every send failed", () => {
    const plan = planReviewAcquisitionAlert({
      ...base,
      sentGoogle: 0,
      sentYelp: 0,
      failed: 5,
    })
    expect(plan!.severity).toBe("page")
  })

  it("warns when review asks sent but idempotency metadata failed", () => {
    const plan = planReviewAcquisitionAlert({
      ...base,
      metadataFailed: 2,
    })
    expect(plan!.alertKind).toBe("cron_review_acquisition_metadata_failed")
    expect(plan!.severity).toBe("warn")
    expect(plan!.meta.metadata_failed).toBe(2)
    expect(plan!.meta.failed).toBe(0)
  })

  it("includes metadata failures on send-failure alerts", () => {
    const plan = planReviewAcquisitionAlert({
      ...base,
      failed: 1,
      metadataFailed: 2,
    })
    expect(plan!.alertKind).toBe("cron_review_acquisition_failed")
    expect(plan!.meta.failed).toBe(1)
    expect(plan!.meta.metadata_failed).toBe(2)
  })
})

describe("planHeartbeat", () => {
  it("emits an info-severity heartbeat (warehouse-only)", () => {
    const plan = planHeartbeat("back-in-stock-trigger", { subscribers_notified: 5 })
    expect(plan!.alertKind).toBe("cron_heartbeat")
    expect(plan!.severity).toBe("info")
    expect(plan!.meta.cron).toBe("back-in-stock-trigger")
    expect(plan!.meta.subscribers_notified).toBe(5)
  })
})
