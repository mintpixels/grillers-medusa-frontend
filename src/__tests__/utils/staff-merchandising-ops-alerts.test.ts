import {
  buildStaffMerchandisingHealthAlertPlans,
  emitStaffMerchandisingPreloadFailureAlert,
  emitStaffMerchandisingActionFailureAlert,
  emitStaffMerchandisingHealthTelemetry,
  emitStaffMerchandisingReviewTelemetry,
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
    oldestActiveClaimedAt: overrides.oldestActiveClaimedAt || null,
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
      oldestActiveClaimedAt: null,
      noImageProductCount: 1,
    })
  })

  it("carries the oldest active claim timestamp into aggregate telemetry", () => {
    expect(
      summarizeMerchandisingTagTelemetry([
        tag({
          imageCount: 5,
          claimedImageCount: 1,
          oldestActiveClaimedAt: "2026-06-28T15:00:00.000Z",
        }),
        tag({
          imageCount: 3,
          claimedImageCount: 1,
          oldestActiveClaimedAt: "2026-06-28T12:30:00.000Z",
        }),
      ])
    ).toEqual(
      expect.objectContaining({
        claimedImageCount: 2,
        oldestActiveClaimedAt: "2026-06-28T12:30:00.000Z",
      })
    )
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

  it("builds an info health snapshot for dashboard annotation progress", () => {
    const plans = buildStaffMerchandisingHealthAlertPlans({
      now: Date.parse("2026-06-28T16:00:00.000Z"),
      tags: [
        tag({
          documentId: "tag_a",
          displayName: "Brisket",
          productCount: 4,
          imageCount: 10,
          reviewedImageCount: 3,
          approvedImageCount: 2,
          rejectedImageCount: 1,
          claimedImageCount: 1,
          oldestActiveClaimedAt: "2026-06-28T15:00:00.000Z",
        }),
      ],
      thresholds: {
        highClaimedMinimum: 10,
        noImageMinimum: 10,
        unreviewedGroupAfterReviewed: 50,
      },
    })

    expect(plans).toHaveLength(1)
    expect(plans[0]).toEqual(
      expect.objectContaining({
        alertKind: "staff_merchandising_health_snapshot",
        severity: "info",
        title: "Staff merchandising 3/10 images reviewed",
        fingerprint: "staff_merchandising:health:snapshot",
        meta: expect.objectContaining({
          staff_module: "merchandising",
          image_count: 10,
          reviewed_image_count: 3,
          reviewed_percent: 30,
          claimed_image_count: 1,
          claimed_percent: 10,
          oldest_active_claim_age_minutes: 60,
        }),
      })
    )
  })

  it("warns when active merchandising claims are stale", () => {
    const plans = buildStaffMerchandisingHealthAlertPlans({
      now: Date.parse("2026-06-28T16:00:00.000Z"),
      includeSnapshot: false,
      tags: [
        tag({
          documentId: "tag_a",
          displayName: "Brisket",
          productCount: 4,
          imageCount: 10,
          reviewedImageCount: 3,
          claimedImageCount: 1,
          oldestActiveClaimedAt: "2026-06-28T10:00:00.000Z",
        }),
      ],
      thresholds: {
        staleClaimMinutes: 240,
        highClaimedMinimum: 10,
        noImageMinimum: 10,
        unreviewedGroupAfterReviewed: 50,
      },
    })

    expect(plans).toHaveLength(1)
    expect(plans[0]).toEqual(
      expect.objectContaining({
        alertKind: "staff_merchandising_claims_stale",
        severity: "warn",
        fingerprint: "staff_merchandising:health:stale_claims",
        meta: expect.objectContaining({
          threshold_minutes: 240,
          stale_claim_group_count: 1,
          stale_claim_groups: [
            expect.objectContaining({
              tag_id: "tag_a",
              tag_name: "Brisket",
              oldest_active_claim_age_minutes: 360,
            }),
          ],
        }),
      })
    )
  })

  it("warns when too many images are actively claimed", () => {
    const plans = buildStaffMerchandisingHealthAlertPlans({
      includeSnapshot: false,
      tags: [
        tag({
          productCount: 10,
          imageCount: 20,
          reviewedImageCount: 5,
          claimedImageCount: 6,
        }),
      ],
      thresholds: {
        highClaimedRatio: 0.2,
        highClaimedMinimum: 5,
        noImageMinimum: 10,
        unreviewedGroupAfterReviewed: 50,
      },
    })

    expect(plans.map((plan) => plan.alertKind)).toContain(
      "staff_merchandising_claims_high"
    )
  })

  it("warns when mature annotation work leaves large groups unreviewed", () => {
    const plans = buildStaffMerchandisingHealthAlertPlans({
      includeSnapshot: false,
      tags: [
        tag({
          documentId: "tag_done",
          displayName: "Done",
          productCount: 20,
          imageCount: 80,
          reviewedImageCount: 60,
        }),
        tag({
          documentId: "tag_gap",
          displayName: "Gap",
          productCount: 5,
          imageCount: 12,
          reviewedImageCount: 0,
        }),
      ],
      thresholds: {
        unreviewedGroupAfterReviewed: 50,
        unreviewedGroupMinImages: 10,
        noImageMinimum: 10,
        highClaimedMinimum: 10,
      },
    })

    expect(plans).toEqual([
      expect.objectContaining({
        alertKind: "staff_merchandising_groups_unreviewed",
        severity: "warn",
        meta: expect.objectContaining({
          threshold_reviewed_images: 50,
          threshold_group_min_images: 10,
          unreviewed_large_group_count: 1,
          unreviewed_large_groups: [
            expect.objectContaining({
              tag_id: "tag_gap",
              tag_name: "Gap",
              image_count: 12,
            }),
          ],
        }),
      }),
    ])
  })

  it("warns when many merchandising products have no images", () => {
    const plans = buildStaffMerchandisingHealthAlertPlans({
      includeSnapshot: false,
      tags: [
        tag({
          productCount: 20,
          imageCount: 30,
          reviewedImageCount: 5,
          noImageProductCount: 5,
        }),
      ],
      thresholds: {
        noImageRatio: 0.2,
        noImageMinimum: 5,
        highClaimedMinimum: 10,
        unreviewedGroupAfterReviewed: 50,
      },
    })

    expect(plans.map((plan) => plan.alertKind)).toContain(
      "staff_merchandising_product_images_missing"
    )
  })

  it("emits merchandising health telemetry plans", async () => {
    await emitStaffMerchandisingHealthTelemetry({
      includeSnapshot: true,
      tags: [
        tag({
          productCount: 4,
          imageCount: 10,
          reviewedImageCount: 3,
        }),
      ],
      thresholds: {
        highClaimedMinimum: 10,
        noImageMinimum: 10,
        unreviewedGroupAfterReviewed: 50,
      },
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_health_snapshot",
        severity: "info",
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

  it("emits an info event when a merchandising review is saved", async () => {
    await emitStaffMerchandisingReviewTelemetry({
      event: "saved",
      imageId: 123,
      imageDocumentId: "image-123",
      countryCode: "us",
      status: "approved",
      previousStatus: "unreviewed",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_review_saved",
        severity: "info",
        title: "Staff merchandising image review saved",
        path: "src/lib/data/staff/product-merchandising.ts",
        fingerprint: "staff_merchandising:review:saved:approved",
        meta: expect.objectContaining({
          staff_module: "merchandising",
          action: "review",
          image_id: 123,
          image_document_id: "image-123",
          country_code: "us",
          requested_status: "approved",
          previous_status: "unreviewed",
          conflict_reason: null,
        }),
      })
    )
  })

  it("emits a warn event when a merchandising review conflicts", async () => {
    await emitStaffMerchandisingReviewTelemetry({
      event: "conflict",
      imageId: 123,
      imageDocumentId: "image-123",
      countryCode: "us",
      status: "rejected",
      previousStatus: "approved",
      conflictReason: "existing_review",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_review_conflict",
        severity: "warn",
        title: "Staff merchandising review conflict",
        fingerprint: "staff_merchandising:review:conflict:existing_review",
        meta: expect.objectContaining({
          staff_module: "merchandising",
          action: "review",
          image_id: 123,
          image_document_id: "image-123",
          country_code: "us",
          requested_status: "rejected",
          previous_status: "approved",
          conflict_reason: "existing_review",
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
