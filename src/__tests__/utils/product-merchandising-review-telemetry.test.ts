jest.mock("server-only", () => ({}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess: jest.fn(async () => ({
    email: "staff@example.com",
  })),
}))

jest.mock("@lib/util/staff-access", () => ({
  isStaffCustomer: jest.fn(() => true),
  staffDisplayName: jest.fn(() => "Staff Reviewer"),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

import { revalidatePath } from "next/cache"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { reviewMerchandisingImage } from "@lib/data/staff/product-merchandising"

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
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, documentId: "img_doc", caption: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
    global.fetch = fetchMock as any

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "approved",
      currentCaption: null,
    })

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://strapi.example.test/api/upload/files/123",
      expect.objectContaining({ cache: "no-store" })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://strapi.example.test/api/upload?id=123",
      expect.objectContaining({ method: "POST" })
    )
    expect(revalidatePath).toHaveBeenCalledWith(
      "/us/account/staff/merchandising"
    )
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_review_saved",
        severity: "info",
        meta: expect.objectContaining({
          image_id: 123,
          image_document_id: "img_doc",
          attempted_status: "approved",
          previous_status: "unreviewed",
        }),
      })
    )
  })

  it("alerts and refuses to overwrite stale review captions", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 123,
        documentId: "img_doc",
        caption:
          'GP_IMAGE_REVIEW_V1:{"originalCaption":null,"review":{"status":"approved"}}',
      }),
    })
    global.fetch = fetchMock as any

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "rejected",
      reason: "other",
      currentCaption: null,
    })

    expect(result).toEqual({
      ok: false,
      error:
        "This image was updated by another reviewer. Refresh the page before saving.",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_review_conflict",
        severity: "warn",
        meta: expect.objectContaining({
          image_id: 123,
          attempted_status: "rejected",
          previous_status: "approved",
          reason: "caption_changed",
        }),
      })
    )
  })

  it("pages ops when Strapi rejects the review write", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, documentId: "img_doc", caption: null }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "write failed" } }),
      })
    global.fetch = fetchMock as any

    const result = await reviewMerchandisingImage({
      imageId: 123,
      imageDocumentId: "img_doc",
      countryCode: "us",
      status: "approved",
      currentCaption: null,
    })

    expect(result.ok).toBe(false)
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_merchandising_review_failed",
        severity: "page",
        meta: expect.objectContaining({
          image_id: 123,
          attempted_status: "approved",
          reason: "strapi_write_failed",
        }),
      })
    )
  })

  it("does not alert on staff validation errors", async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as any

    const result = await reviewMerchandisingImage({
      imageId: 0,
      countryCode: "us",
      status: "approved",
    })

    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(emitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})
