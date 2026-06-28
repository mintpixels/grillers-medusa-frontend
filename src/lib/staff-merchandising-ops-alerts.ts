import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import type { ProductMerchandisingTagSummary } from "@lib/data/staff/product-merchandising"

const DEFAULT_SLOW_ALERT_MS = 5_000
const DEFAULT_STALE_CLAIM_MINUTES = 240
const DEFAULT_HIGH_CLAIMED_RATIO = 0.2
const DEFAULT_HIGH_CLAIMED_MINIMUM = 5
const DEFAULT_UNREVIEWED_GROUP_MIN_IMAGES = 10
const DEFAULT_UNREVIEWED_GROUP_AFTER_REVIEWED = 50
const DEFAULT_NO_IMAGE_RATIO = 0.2
const DEFAULT_NO_IMAGE_MINIMUM = 10

type SlowStaffMerchandisingDataInput = {
  startedAt: number
  tags: ProductMerchandisingTagSummary[]
  now?: number
  path?: string
  thresholdMs?: number
}

type StaffMerchandisingActionFailureInput = {
  action: "review" | "claim" | "release_claim"
  imageId?: number | null
  imageDocumentId?: string | null
  tagId?: string | null
  tagName?: string | null
  countryCode?: string | null
  status?: string | null
  error: unknown
}

type StaffMerchandisingReviewTelemetryInput = {
  event: "saved" | "conflict"
  imageId?: number | null
  imageDocumentId?: string | null
  countryCode?: string | null
  status?: string | null
  previousStatus?: string | null
  conflictReason?: string | null
  overwriteExistingReview?: boolean | null
}

type StaffMerchandisingPreloadFailureInput = {
  countryCode?: string | null
  error: unknown
}

type MerchandisingTagTotals = {
  productCount: number
  imageCount: number
  reviewedImageCount: number
  approvedImageCount: number
  rejectedImageCount: number
  claimedImageCount: number
  oldestActiveClaimedAt: string | null
  noImageProductCount: number
}

type StaffMerchandisingHealthThresholds = {
  staleClaimMinutes?: number
  highClaimedRatio?: number
  highClaimedMinimum?: number
  unreviewedGroupMinImages?: number
  unreviewedGroupAfterReviewed?: number
  noImageRatio?: number
  noImageMinimum?: number
}

type StaffMerchandisingHealthInput = {
  tags: ProductMerchandisingTagSummary[]
  now?: number
  path?: string
  thresholds?: StaffMerchandisingHealthThresholds
  includeSnapshot?: boolean
}

type StaffMerchandisingHealthAlertPlan = {
  alertKind: string
  severity: "page" | "warn" | "info"
  title: string
  path: string
  source: "medusa-server"
  fingerprint: string
  meta: Record<string, unknown>
}

function slowAlertThresholdMs() {
  const value = Number(process.env.STAFF_MERCHANDISING_DATA_SLOW_ALERT_MS)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SLOW_ALERT_MS
}

function numericEnv(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function ratioEnv(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback
}

function healthThresholds(
  overrides: StaffMerchandisingHealthThresholds = {}
): Required<StaffMerchandisingHealthThresholds> {
  return {
    staleClaimMinutes:
      overrides.staleClaimMinutes ??
      numericEnv(
        "STAFF_MERCHANDISING_STALE_CLAIM_ALERT_MINUTES",
        DEFAULT_STALE_CLAIM_MINUTES
      ),
    highClaimedRatio:
      overrides.highClaimedRatio ??
      ratioEnv(
        "STAFF_MERCHANDISING_HIGH_CLAIMED_RATIO",
        DEFAULT_HIGH_CLAIMED_RATIO
      ),
    highClaimedMinimum:
      overrides.highClaimedMinimum ??
      numericEnv(
        "STAFF_MERCHANDISING_HIGH_CLAIMED_MINIMUM",
        DEFAULT_HIGH_CLAIMED_MINIMUM
      ),
    unreviewedGroupMinImages:
      overrides.unreviewedGroupMinImages ??
      numericEnv(
        "STAFF_MERCHANDISING_UNREVIEWED_GROUP_MIN_IMAGES",
        DEFAULT_UNREVIEWED_GROUP_MIN_IMAGES
      ),
    unreviewedGroupAfterReviewed:
      overrides.unreviewedGroupAfterReviewed ??
      numericEnv(
        "STAFF_MERCHANDISING_UNREVIEWED_GROUP_AFTER_REVIEWED",
        DEFAULT_UNREVIEWED_GROUP_AFTER_REVIEWED
      ),
    noImageRatio:
      overrides.noImageRatio ??
      ratioEnv("STAFF_MERCHANDISING_NO_IMAGE_RATIO", DEFAULT_NO_IMAGE_RATIO),
    noImageMinimum:
      overrides.noImageMinimum ??
      numericEnv(
        "STAFF_MERCHANDISING_NO_IMAGE_MINIMUM",
        DEFAULT_NO_IMAGE_MINIMUM
      ),
  }
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function oldestDate(current: string | null, next?: string | null) {
  if (!next) return current
  const nextTime = Date.parse(next)
  if (!Number.isFinite(nextTime)) return current
  if (!current) return next
  const currentTime = Date.parse(current)
  return !Number.isFinite(currentTime) || nextTime < currentTime
    ? next
    : current
}

function claimAgeMinutes(claimedAt: string | null, now: number) {
  if (!claimedAt) return null
  const claimedAtMs = Date.parse(claimedAt)
  if (!Number.isFinite(claimedAtMs)) return null
  return Math.max(0, Math.floor((now - claimedAtMs) / 60_000))
}

export function summarizeMerchandisingTagTelemetry(
  tags: ProductMerchandisingTagSummary[]
): MerchandisingTagTotals {
  return tags.reduce<MerchandisingTagTotals>(
    (totals, tag) => ({
      productCount: totals.productCount + tag.productCount,
      imageCount: totals.imageCount + tag.imageCount,
      reviewedImageCount: totals.reviewedImageCount + tag.reviewedImageCount,
      approvedImageCount: totals.approvedImageCount + tag.approvedImageCount,
      rejectedImageCount: totals.rejectedImageCount + tag.rejectedImageCount,
      claimedImageCount: totals.claimedImageCount + tag.claimedImageCount,
      oldestActiveClaimedAt: oldestDate(
        totals.oldestActiveClaimedAt,
        tag.oldestActiveClaimedAt
      ),
      noImageProductCount: totals.noImageProductCount + tag.noImageProductCount,
    }),
    {
      productCount: 0,
      imageCount: 0,
      reviewedImageCount: 0,
      approvedImageCount: 0,
      rejectedImageCount: 0,
      claimedImageCount: 0,
      oldestActiveClaimedAt: null,
      noImageProductCount: 0,
    }
  )
}

function largestUnreviewedGroups(
  tags: ProductMerchandisingTagSummary[],
  minImages: number
) {
  return tags
    .filter(
      (tag) =>
        tag.imageCount >= minImages &&
        tag.reviewedImageCount === 0 &&
        tag.imageCount > 0
    )
    .sort((a, b) => b.imageCount - a.imageCount)
    .slice(0, 5)
    .map((tag) => ({
      tag_id: tag.documentId,
      tag_name: tag.displayName || tag.name,
      image_count: tag.imageCount,
      product_count: tag.productCount,
    }))
}

function staleClaimGroups(
  tags: ProductMerchandisingTagSummary[],
  now: number,
  staleClaimMinutes: number
) {
  return tags
    .map((tag) => ({
      tag_id: tag.documentId,
      tag_name: tag.displayName || tag.name,
      claimed_image_count: tag.claimedImageCount,
      oldest_active_claimed_at: tag.oldestActiveClaimedAt || null,
      oldest_active_claim_age_minutes: claimAgeMinutes(
        tag.oldestActiveClaimedAt || null,
        now
      ),
    }))
    .filter(
      (tag) =>
        tag.claimed_image_count > 0 &&
        (tag.oldest_active_claim_age_minutes || 0) >= staleClaimMinutes
    )
    .sort(
      (a, b) =>
        (b.oldest_active_claim_age_minutes || 0) -
        (a.oldest_active_claim_age_minutes || 0)
    )
    .slice(0, 5)
}

export function buildStaffMerchandisingHealthAlertPlans({
  tags,
  now = Date.now(),
  path = "src/app/api/staff/merchandising/tags/route.ts",
  thresholds,
  includeSnapshot = true,
}: StaffMerchandisingHealthInput): StaffMerchandisingHealthAlertPlan[] {
  const threshold = healthThresholds(thresholds)
  const totals = summarizeMerchandisingTagTelemetry(tags)
  const plans: StaffMerchandisingHealthAlertPlan[] = []
  const reviewedPercent = percent(totals.reviewedImageCount, totals.imageCount)
  const claimedPercent = percent(totals.claimedImageCount, totals.imageCount)
  const noImagePercent = percent(
    totals.noImageProductCount,
    totals.productCount
  )
  const oldestActiveClaimAgeMinutes = claimAgeMinutes(
    totals.oldestActiveClaimedAt,
    now
  )
  const unreviewedGroupCandidates = largestUnreviewedGroups(
    tags,
    threshold.unreviewedGroupMinImages
  )
  const staleGroups = staleClaimGroups(tags, now, threshold.staleClaimMinutes)

  const baseMeta = {
    staff_module: "merchandising",
    l3_group_count: tags.length,
    product_count: totals.productCount,
    image_count: totals.imageCount,
    reviewed_image_count: totals.reviewedImageCount,
    approved_image_count: totals.approvedImageCount,
    rejected_image_count: totals.rejectedImageCount,
    unreviewed_image_count:
      totals.imageCount - totals.reviewedImageCount >= 0
        ? totals.imageCount - totals.reviewedImageCount
        : 0,
    reviewed_percent: reviewedPercent,
    claimed_image_count: totals.claimedImageCount,
    claimed_percent: claimedPercent,
    no_image_product_count: totals.noImageProductCount,
    no_image_product_percent: noImagePercent,
    oldest_active_claimed_at: totals.oldestActiveClaimedAt,
    oldest_active_claim_age_minutes: oldestActiveClaimAgeMinutes,
  }

  if (includeSnapshot) {
    plans.push({
      alertKind: "staff_merchandising_health_snapshot",
      severity: "info",
      title: `Staff merchandising ${totals.reviewedImageCount}/${totals.imageCount} images reviewed`,
      path,
      source: "medusa-server",
      fingerprint: "staff_merchandising:health:snapshot",
      meta: {
        ...baseMeta,
        unreviewed_large_groups: unreviewedGroupCandidates,
      },
    })
  }

  if (staleGroups.length) {
    plans.push({
      alertKind: "staff_merchandising_claims_stale",
      severity: "warn",
      title: `Staff merchandising has active claims older than ${threshold.staleClaimMinutes} minutes`,
      path,
      source: "medusa-server",
      fingerprint: "staff_merchandising:health:stale_claims",
      meta: {
        ...baseMeta,
        threshold_minutes: threshold.staleClaimMinutes,
        stale_claim_group_count: staleGroups.length,
        stale_claim_groups: staleGroups,
      },
    })
  }

  if (
    totals.claimedImageCount >= threshold.highClaimedMinimum &&
    totals.imageCount > 0 &&
    totals.claimedImageCount / totals.imageCount >= threshold.highClaimedRatio
  ) {
    plans.push({
      alertKind: "staff_merchandising_claims_high",
      severity: "warn",
      title: `Staff merchandising has ${totals.claimedImageCount} active image claims`,
      path,
      source: "medusa-server",
      fingerprint: "staff_merchandising:health:claims_high",
      meta: {
        ...baseMeta,
        threshold_claimed_ratio: threshold.highClaimedRatio,
        threshold_claimed_minimum: threshold.highClaimedMinimum,
      },
    })
  }

  if (
    totals.reviewedImageCount >= threshold.unreviewedGroupAfterReviewed &&
    unreviewedGroupCandidates.length
  ) {
    plans.push({
      alertKind: "staff_merchandising_groups_unreviewed",
      severity: "warn",
      title: "Staff merchandising has large groups with no reviewed images",
      path,
      source: "medusa-server",
      fingerprint: "staff_merchandising:health:groups_unreviewed",
      meta: {
        ...baseMeta,
        threshold_reviewed_images: threshold.unreviewedGroupAfterReviewed,
        threshold_group_min_images: threshold.unreviewedGroupMinImages,
        unreviewed_large_group_count: unreviewedGroupCandidates.length,
        unreviewed_large_groups: unreviewedGroupCandidates,
      },
    })
  }

  if (
    totals.noImageProductCount >= threshold.noImageMinimum &&
    totals.productCount > 0 &&
    totals.noImageProductCount / totals.productCount >= threshold.noImageRatio
  ) {
    plans.push({
      alertKind: "staff_merchandising_product_images_missing",
      severity: "warn",
      title: `Staff merchandising has ${totals.noImageProductCount} products with no images`,
      path,
      source: "medusa-server",
      fingerprint: "staff_merchandising:health:missing_images",
      meta: {
        ...baseMeta,
        threshold_no_image_ratio: threshold.noImageRatio,
        threshold_no_image_minimum: threshold.noImageMinimum,
      },
    })
  }

  return plans
}

export async function emitStaffMerchandisingHealthTelemetry(
  input: StaffMerchandisingHealthInput
) {
  const plans = buildStaffMerchandisingHealthAlertPlans(input)
  await Promise.all(
    plans.map((plan) =>
      emitStorefrontOpsAlert({
        alertKind: plan.alertKind,
        severity: plan.severity,
        title: plan.title,
        path: plan.path,
        source: plan.source,
        fingerprint: plan.fingerprint,
        meta: plan.meta,
      })
    )
  )

  return {
    emitted: plans.length,
    alertKinds: plans.map((plan) => plan.alertKind),
  }
}

export async function emitSlowStaffMerchandisingDataAlert({
  startedAt,
  tags,
  now = Date.now(),
  path = "src/app/api/staff/catalog-review/groups/route.ts",
  thresholdMs = slowAlertThresholdMs(),
}: SlowStaffMerchandisingDataInput) {
  const durationMs = now - startedAt
  if (durationMs < thresholdMs) {
    return { emitted: false, durationMs }
  }

  const totals = summarizeMerchandisingTagTelemetry(tags)

  await emitStorefrontOpsAlert({
    alertKind: "staff_merchandising_data_slow",
    severity: "warn",
    title: `Staff merchandising data loaded in ${durationMs}ms`,
    path,
    source: "medusa-server",
    meta: {
      staff_module: "merchandising",
      duration_ms: durationMs,
      threshold_ms: thresholdMs,
      l3_group_count: tags.length,
      product_count: totals.productCount,
      image_count: totals.imageCount,
      reviewed_image_count: totals.reviewedImageCount,
      approved_image_count: totals.approvedImageCount,
      rejected_image_count: totals.rejectedImageCount,
      claimed_image_count: totals.claimedImageCount,
      no_image_product_count: totals.noImageProductCount,
    },
  })

  return { emitted: true, durationMs }
}

function merchandisingErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export async function emitStaffMerchandisingActionFailureAlert({
  action,
  imageId,
  imageDocumentId,
  tagId,
  tagName,
  countryCode,
  status,
  error,
}: StaffMerchandisingActionFailureInput) {
  const message = merchandisingErrorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: "staff_merchandising_action_failed",
    severity: "page",
    title: `Staff merchandising ${action} failed`,
    path: "src/lib/data/staff/product-merchandising.ts",
    source: "medusa-server",
    fingerprint: `staff_merchandising:${action}:failed`,
    meta: {
      staff_module: "merchandising",
      action,
      image_id: imageId || null,
      image_document_id: imageDocumentId || null,
      tag_id: tagId || null,
      tag_name: tagName || null,
      country_code: countryCode || null,
      requested_status: status || null,
      error_message: message.slice(0, 300),
    },
  })
}

export async function emitStaffMerchandisingReviewTelemetry({
  event,
  imageId,
  imageDocumentId,
  countryCode,
  status,
  previousStatus,
  conflictReason,
  overwriteExistingReview,
}: StaffMerchandisingReviewTelemetryInput) {
  const isConflict = event === "conflict"
  const alertKind = isConflict
    ? "staff_merchandising_review_conflict"
    : "staff_merchandising_review_saved"

  await emitStorefrontOpsAlert({
    alertKind,
    severity: isConflict ? "warn" : "info",
    title: isConflict
      ? "Staff merchandising review conflict"
      : "Staff merchandising image review saved",
    path: "src/lib/data/staff/product-merchandising.ts",
    source: "medusa-server",
    fingerprint: `staff_merchandising:review:${event}:${
      conflictReason || status || "unknown"
    }`,
    meta: {
      staff_module: "merchandising",
      action: "review",
      image_id: imageId || null,
      image_document_id: imageDocumentId || null,
      country_code: countryCode || null,
      requested_status: status || null,
      previous_status: previousStatus || null,
      conflict_reason: conflictReason || null,
      overwrite_existing_review: Boolean(overwriteExistingReview),
    },
  })
}

export async function emitStaffMerchandisingPreloadFailureAlert({
  countryCode,
  error,
}: StaffMerchandisingPreloadFailureInput) {
  const message = merchandisingErrorMessage(error)

  await emitStorefrontOpsAlert({
    alertKind: "staff_module_load_failed",
    severity: "warn",
    title: `Staff merchandising preload failed: ${message}`.slice(0, 500),
    path: "src/app/[countryCode]/(main)/account/staff/orders/page.tsx",
    source: "medusa-server",
    fingerprint: "staff_merchandising:preload:failed",
    meta: {
      staff_module: "merchandising",
      action: "preload",
      country_code: countryCode || null,
      fallback_endpoint: "/[countryCode]/account/photo-groups/data",
      legacy_fallback_endpoint:
        "/[countryCode]/api/staff/catalog-review/groups",
      error_message: message.slice(0, 300),
    },
  })
}
