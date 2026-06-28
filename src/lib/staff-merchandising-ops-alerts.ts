import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import type { ProductMerchandisingTagSummary } from "@lib/data/staff/product-merchandising"

const DEFAULT_SLOW_ALERT_MS = 5_000

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
  noImageProductCount: number
}

function slowAlertThresholdMs() {
  const value = Number(process.env.STAFF_MERCHANDISING_DATA_SLOW_ALERT_MS)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SLOW_ALERT_MS
}

export function summarizeMerchandisingTagTelemetry(
  tags: ProductMerchandisingTagSummary[]
): MerchandisingTagTotals {
  return tags.reduce(
    (totals, tag) => ({
      productCount: totals.productCount + tag.productCount,
      imageCount: totals.imageCount + tag.imageCount,
      reviewedImageCount: totals.reviewedImageCount + tag.reviewedImageCount,
      approvedImageCount: totals.approvedImageCount + tag.approvedImageCount,
      rejectedImageCount: totals.rejectedImageCount + tag.rejectedImageCount,
      claimedImageCount: totals.claimedImageCount + tag.claimedImageCount,
      noImageProductCount: totals.noImageProductCount + tag.noImageProductCount,
    }),
    {
      productCount: 0,
      imageCount: 0,
      reviewedImageCount: 0,
      approvedImageCount: 0,
      rejectedImageCount: 0,
      claimedImageCount: 0,
      noImageProductCount: 0,
    }
  )
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
      legacy_fallback_endpoint: "/[countryCode]/api/staff/catalog-review/groups",
      error_message: message.slice(0, 300),
    },
  })
}
