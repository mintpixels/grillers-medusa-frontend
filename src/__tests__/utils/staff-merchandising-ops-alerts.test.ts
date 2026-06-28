import {
  emitStaffMerchandisingPreloadFailureAlert,
  emitStaffMerchandisingActionFailureAlert,
  emitSlowStaffMerchandisingDataAlert,
  summarizeMerchandisingTagTelemetry,
} from "@lib/staff-merchandising-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import type { ProductMerchandisingTagSummary } from "@lib/data/staff/product-merchandising"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

function tag(
  overrides: Partial<ProductMerchandisingTagSummary>
): ProductMerchandisingTagSummary {
  return {
    documentId: overrides.documentId || "tag",
    name: overrides.name || "L3: Test",
    displayName: overrides.displayName || "Test",
    description: overrides.description,
    seoDescription: overrides.seoDescription,
    productCount: overrides.productCount || 0,
    imageCount: overrides.imageCount || 0,
    reviewedImageCount: overrides.reviewedImageCount || 0,
    approvedImageCount: overrides.approvedImageCount || 0,
    rejectedImageCount: overrides.rejectedImageCount || 0,
    claimedImageCount: overrides.claimedImageCount || 0,
    noImageProductCount: overrides.noImageProductCount || 0,
    metadata: overrides.metadata || [],
    l2Parents: overrides.l2Parents || [],
  }
}

describe("staff merchandising ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("summarizes tag volume and review progress for telemetry", () => {
    expect(
      summarizeMerchandisingTagTelemetry([
        tag({
          productCount: 2,
          imageCount: 5,
          reviewedImageCount: 3,
          approvedImageCount: 2,
          rejectedImageCount: 1,
          claimedImageCount: 1,
          noImageProductCount: 0,
        }),
        tag({
          productCount: 1,
          imageCount: 0,
          noImageProductCount: 1,
        }),
      ])
    ).toEqual({
      productCount: 3,
      imageCount: 5,
      reviewedImageCount: 3,
      approvedImageCount: 2,
      rejectedImageCount: 1,
      claimedImageCount: 1,
      noImageProductCount: 1,
    })
  })

  it("does not alert below the slow-load threshold", async () => {
    const result = await emitSlowStaffMerchandisingDataAlert({
      startedAt: 1_000,
      now: 3_000,
      thresholdMs: 5_000,
      tags: [tag({ productCount: 1 })],
    })

    expect(result).toEqual({ emitted: false, durationMs: 2_000 })
    expect(emitStorefrontOpsAlertMock).not.toHaveBeenCalled()
  })

  it("emits a warn alert when merchandising data loads slowly", async () => {
    const result = await emitSlowStaffMerchandisingDataAlert({
      startedAt: 1_000,
      now: 7_200,
      thresholdMs: 5_000,
      tags: [
        tag({
          documentId: "tag_a",
          productCount: 4,
          imageCount: 9,
          reviewedImageCount: 6,
          approvedImageCount: 5,
          rejectedImageCount: 1,
          claimedImageCount: 2,
          noImageProductCount: 1,
        }),
      ],
    })

    expect(result).toEqual({ emitted: true, durationMs: 6_200 })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_data_slow",
        severity: "warn",
        title: "Staff merchandising data loaded in 6200ms",
        path: "src/app/api/staff/catalog-review/groups/route.ts",
        source: "medusa-server",
        meta: expect.objectContaining({
          staff_module: "merchandising",
          duration_ms: 6_200,
          threshold_ms: 5_000,
          l3_group_count: 1,
          product_count: 4,
          image_count: 9,
          reviewed_image_count: 6,
          approved_image_count: 5,
          rejected_image_count: 1,
          claimed_image_count: 2,
          no_image_product_count: 1,
        }),
      })
    )
  })

  it("emits a page alert when a merchandising review action fails", async () => {
    await emitStaffMerchandisingActionFailureAlert({
      action: "review",
      imageId: 123,
      imageDocumentId: "image-123",
      countryCode: "us",
      status: "approved",
      error: new Error("Strapi image review write failed: 403"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_action_failed",
        severity: "page",
        title: "Staff merchandising review failed",
        path: "src/lib/data/staff/product-merchandising.ts",
        fingerprint: "staff_merchandising:review:failed",
        meta: expect.objectContaining({
          staff_module: "merchandising",
          action: "review",
          image_id: 123,
          image_document_id: "image-123",
          country_code: "us",
          requested_status: "approved",
          error_message: "Strapi image review write failed: 403",
        }),
      })
    )
  })

  it("emits a warn alert when the staff console merchandising preload fails", async () => {
    await emitStaffMerchandisingPreloadFailureAlert({
      countryCode: "us",
      error: new Error("Strapi timed out"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_module_load_failed",
        severity: "warn",
        title: "Staff merchandising preload failed: Strapi timed out",
        path: "src/app/[countryCode]/(main)/account/staff/orders/page.tsx",
        source: "medusa-server",
        fingerprint: "staff_merchandising:preload:failed",
        meta: expect.objectContaining({
          staff_module: "merchandising",
          action: "preload",
          country_code: "us",
          fallback_endpoint: "/[countryCode]/account/photo-groups/data",
          legacy_fallback_endpoint:
            "/[countryCode]/api/staff/catalog-review/groups",
          error_message: "Strapi timed out",
        }),
      })
    )
  })
})
