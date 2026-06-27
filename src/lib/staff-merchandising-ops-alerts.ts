import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import type { ProductMerchandisingTagSummary } from "@lib/data/staff/product-merchandising"

const DEFAULT_SLOW_ALERT_MS = 5_000

type SlowStaffMerchandisingDataInput = {
  startedAt: number
  tags: ProductMerchandisingTagSummary[]
  now?: number
  thresholdMs?: number
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
    path: "src/app/api/staff/merchandising/tags/route.ts",
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
