import {
  buildMerchandisingClaim,
  isClaimActive,
  isClaimOwnedBy,
  parseReviewCaption,
  REVIEW_CAPTION_PREFIX,
  serializeReviewCaption,
} from "@lib/data/staff/product-merchandising-review-payload"

describe("product merchandising review payloads", () => {
  it("reads legacy latest-review payloads without audit history", () => {
    const caption = `${REVIEW_CAPTION_PREFIX}${JSON.stringify({
      originalCaption: "original alt note",
      review: {
        status: "approved",
        reviewerEmail: "peter@example.com",
        reviewerName: "Peter",
        reviewedAt: "2026-06-23T04:01:30.645Z",
      },
    })}`

    const parsed = parseReviewCaption(caption)

    expect(parsed.originalCaption).toBe("original alt note")
    expect(parsed.review.status).toBe("approved")
    expect(parsed.review.reviewerEmail).toBe("peter@example.com")
    expect(parsed.auditHistory).toEqual([])
  })

  it("preserves the original caption while appending claim audit history", () => {
    const claim = buildMerchandisingClaim({
      staffEmail: "employee@example.com",
      staffName: "Employee",
      tagId: "tag-1",
      tagName: "L3: Steak",
      now: new Date("2026-06-25T12:00:00.000Z"),
    })
    const caption = serializeReviewCaption("butcher counter image", {
      claim,
      auditEntry: {
        action: "claimed",
        at: claim.claimedAt,
        staffEmail: claim.staffEmail,
        staffName: claim.staffName,
        claim,
      },
    })

    const parsed = parseReviewCaption(caption)

    expect(parsed.originalCaption).toBe("butcher counter image")
    expect(parsed.claim).toEqual(claim)
    expect(parsed.auditHistory).toHaveLength(1)
    expect(parsed.auditHistory[0].action).toBe("claimed")
  })

  it("appends overwrite review audit entries", () => {
    const firstCaption = serializeReviewCaption(null, {
      review: {
        status: "approved",
        reviewerEmail: "peter@example.com",
        reviewerName: "Peter",
        reviewedAt: "2026-06-23T04:01:30.645Z",
      },
      auditEntry: {
        action: "reviewed",
        at: "2026-06-23T04:01:30.645Z",
        staffEmail: "peter@example.com",
      },
    })
    const secondCaption = serializeReviewCaption(firstCaption, {
      review: {
        status: "rejected",
        reason: "other",
        reviewerEmail: "employee@example.com",
        reviewerName: "Employee",
        reviewedAt: "2026-06-25T12:05:00.000Z",
      },
      auditEntry: {
        action: "overwritten_review",
        at: "2026-06-25T12:05:00.000Z",
        staffEmail: "employee@example.com",
        previousReview: parseReviewCaption(firstCaption).review,
      },
    })

    const parsed = parseReviewCaption(secondCaption)

    expect(parsed.review.status).toBe("rejected")
    expect(parsed.auditHistory.map((entry) => entry.action)).toEqual([
      "reviewed",
      "overwritten_review",
    ])
    expect(parsed.auditHistory[1].previousReview?.status).toBe("approved")
  })

  it("recognizes active owned claims", () => {
    const claim = buildMerchandisingClaim({
      staffEmail: "EMPLOYEE@example.com",
      now: new Date("2026-06-25T12:00:00.000Z"),
    })

    expect(isClaimActive(claim, new Date("2026-06-25T12:30:00.000Z"))).toBe(
      true
    )
    expect(isClaimOwnedBy(claim, "employee@example.com")).toBe(true)
    expect(isClaimActive(claim, new Date("2026-06-26T12:30:00.000Z"))).toBe(
      false
    )
  })
})
