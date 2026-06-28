jest.mock("server-only", () => ({}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  unstable_cache: (fn: any) => fn,
}))

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess: jest.fn(async () => ({
    email: "staff@example.com",
  })),
}))

jest.mock("@lib/util/staff-access", () => ({
  canReviewMerchandising: jest.fn(() => true),
  staffDisplayName: jest.fn(() => "Staff Reviewer"),
}))

jest.mock("@lib/staff-merchandising-ops-alerts", () => ({
  emitStaffMerchandisingActionFailureAlert: jest.fn(async () => undefined),
  emitStaffMerchandisingReviewTelemetry: jest.fn(async () => undefined),
}))

import { revalidatePath } from "next/cache"
import {
  emitStaffMerchandisingActionFailureAlert,
  emitStaffMerchandisingReviewTelemetry,
} from "@lib/staff-merchandising-ops-alerts"
import { reviewMerchandisingImage } from "@lib/data/staff/product-merchandising"

const emitReviewTelemetryMock =
  emitStaffMerchandisingReviewTelemetry as jest.MockedFunction<
    typeof emitStaffMerchandisingReviewTelemetry
  >
const emitActionFailureMock =
  emitStaffMerchandisingActionFailureAlert as jest.MockedFunction<
    typeof emitStaffMerchandisingActionFailureAlert
  >

function reviewCaption(payload: Record<string, unknown>) {
  return `GP_IMAGE_REVIEW_V1:${JSON.stringify(payload)}`
}

describe("product merchandising review telemetry", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STRAPI_ENDPOINT: "https://strapi.example.test",
      STRAPI_API_TOKEN: "read-token",
      STRAPI_REWRITE_API_TOKEN: "write-token",
    }
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it("emits info telemetry after a successful review save", async () => {
    const latestCaption = reviewCaption({
      review: { status: "unreviewed" },
      auditHistory: [],
    })
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/upload/files?")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 123,
              documentId: "img_doc",
              url: "/uploads/img_doc.jpg",
              caption: latestCaption,
            },
          ],
        } as unknown as Response
      }

      if (url.endsWith("/api/upload?id=123")) {
        expect(init?.method).toBe("POST")
        return {
          ok: true,
          json: async () => ({}),
        } as unknown as Response
      }

      throw new Error(`Unexpected fetch ${url}`)
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "approved",
      currentCaption: latestCaption,
    })

    expect(result.ok).toBe(true)
    expect(revalidatePath).toHaveBeenCalledWith(
      "/us/account/staff/merchandising"
    )
    expect(emitReviewTelemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "saved",
        imageId: 123,
        imageDocumentId: "img_doc",
        countryCode: "us",
        status: "approved",
        previousStatus: "unreviewed",
      })
    )
  })

  it("emits conflict telemetry when an existing review blocks overwrite", async () => {
    const latestCaption = reviewCaption({
      review: {
        status: "approved",
        reviewerName: "Peter",
        reviewedAt: "2026-06-28T12:00:00.000Z",
      },
      auditHistory: [],
    })
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes("/api/upload/files?")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 123,
              documentId: "img_doc",
              url: "/uploads/img_doc.jpg",
              caption: latestCaption,
            },
          ],
        } as unknown as Response
      }

      throw new Error(`Unexpected fetch ${url}`)
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "rejected",
      reason: "other",
      currentCaption: null,
    })

    expect(result.ok).toBe(false)
    expect(result.conflict).toBe(true)
    expect(result.canOverwrite).toBe(true)
    expect(emitReviewTelemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "conflict",
        imageId: 123,
        imageDocumentId: "img_doc",
        countryCode: "us",
        status: "rejected",
        previousStatus: "approved",
        conflictReason: "existing_review",
      })
    )
  })

  it("emits conflict telemetry when the image caption changed while loaded", async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes("/api/upload/files?")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 123,
              documentId: "img_doc",
              url: "/uploads/img_doc.jpg",
              caption: "Legacy caption changed by another reviewer",
            },
          ],
        } as unknown as Response
      }

      throw new Error(`Unexpected fetch ${url}`)
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "approved",
      currentCaption: "Legacy caption from initial page load",
    })

    expect(result.ok).toBe(false)
    expect(result.conflict).toBe(true)
    expect(emitReviewTelemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "conflict",
        imageId: 123,
        imageDocumentId: "img_doc",
        countryCode: "us",
        status: "approved",
        previousStatus: "unreviewed",
        conflictReason: "caption_changed",
      })
    )
  })

  it("keeps hard Strapi write failures on the page-level action alert", async () => {
    const latestCaption = reviewCaption({
      review: { status: "unreviewed" },
      auditHistory: [],
    })
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes("/api/upload/files?")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 123,
              documentId: "img_doc",
              url: "/uploads/img_doc.jpg",
              caption: latestCaption,
            },
          ],
        } as unknown as Response
      }

      if (url.endsWith("/api/upload?id=123")) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: { message: "write failed" } }),
        } as unknown as Response
      }

      throw new Error(`Unexpected fetch ${url}`)
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "approved",
      currentCaption: latestCaption,
    })

    expect(result.ok).toBe(false)
    expect(emitActionFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "review",
        imageId: 123,
        imageDocumentId: "img_doc",
        countryCode: "us",
        status: "approved",
        error: expect.any(Error),
      })
    )
  })
})
