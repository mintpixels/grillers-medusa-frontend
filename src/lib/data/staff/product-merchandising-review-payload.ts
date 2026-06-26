export type MerchandisingReviewStatus = "unreviewed" | "approved" | "rejected"

export type MerchandisingRejectReason =
  | "looks_ai_or_synthetic"
  | "human_in_image"
  | "other"

export type MerchandisingImageReview = {
  status: MerchandisingReviewStatus
  reason?: MerchandisingRejectReason
  note?: string
  reviewerEmail?: string
  reviewerName?: string
  reviewedAt?: string
}

export type MerchandisingImageClaim = {
  staffEmail?: string
  staffName?: string
  claimedAt: string
  expiresAt: string
  tagId?: string
  tagName?: string
}

export type MerchandisingReviewAuditAction =
  | "claimed"
  | "released_claim"
  | "reviewed"
  | "overwritten_review"

export type MerchandisingReviewAuditEntry = {
  action: MerchandisingReviewAuditAction
  at: string
  staffEmail?: string
  staffName?: string
  tagId?: string
  tagName?: string
  previousReview?: MerchandisingImageReview
  review?: MerchandisingImageReview
  previousClaim?: MerchandisingImageClaim
  claim?: MerchandisingImageClaim
}

export type ParsedMerchandisingReviewPayload = {
  originalCaption?: string | null
  review: MerchandisingImageReview
  claim?: MerchandisingImageClaim
  auditHistory: MerchandisingReviewAuditEntry[]
}

export const REVIEW_CAPTION_PREFIX = "GP_IMAGE_REVIEW_V1:"
export const MERCHANDISING_CLAIM_TTL_HOURS = 8

function text(value: unknown) {
  return String(value || "").trim()
}

function validReviewStatus(value: unknown): MerchandisingReviewStatus {
  return value === "approved" || value === "rejected" ? value : "unreviewed"
}

function normalizedReview(value: unknown): MerchandisingImageReview {
  if (!value || typeof value !== "object") {
    return { status: "unreviewed" }
  }

  const review = value as Record<string, unknown>
  return {
    status: validReviewStatus(review.status),
    reason:
      review.reason === "looks_ai_or_synthetic" ||
      review.reason === "human_in_image" ||
      review.reason === "other"
        ? review.reason
        : undefined,
    note: text(review.note) || undefined,
    reviewerEmail: text(review.reviewerEmail) || undefined,
    reviewerName: text(review.reviewerName) || undefined,
    reviewedAt: text(review.reviewedAt) || undefined,
  }
}

function normalizedClaim(value: unknown): MerchandisingImageClaim | undefined {
  if (!value || typeof value !== "object") return undefined

  const claim = value as Record<string, unknown>
  const claimedAt = text(claim.claimedAt)
  const expiresAt = text(claim.expiresAt)
  if (!claimedAt || !expiresAt) return undefined

  return {
    staffEmail: text(claim.staffEmail) || undefined,
    staffName: text(claim.staffName) || undefined,
    claimedAt,
    expiresAt,
    tagId: text(claim.tagId) || undefined,
    tagName: text(claim.tagName) || undefined,
  }
}

function normalizedAuditEntry(
  value: unknown
): MerchandisingReviewAuditEntry | null {
  if (!value || typeof value !== "object") return null

  const entry = value as Record<string, unknown>
  const action = entry.action
  if (
    action !== "claimed" &&
    action !== "released_claim" &&
    action !== "reviewed" &&
    action !== "overwritten_review"
  ) {
    return null
  }

  const at = text(entry.at)
  if (!at) return null

  return {
    action,
    at,
    staffEmail: text(entry.staffEmail) || undefined,
    staffName: text(entry.staffName) || undefined,
    tagId: text(entry.tagId) || undefined,
    tagName: text(entry.tagName) || undefined,
    previousReview: entry.previousReview
      ? normalizedReview(entry.previousReview)
      : undefined,
    review: entry.review ? normalizedReview(entry.review) : undefined,
    previousClaim: normalizedClaim(entry.previousClaim),
    claim: normalizedClaim(entry.claim),
  }
}

function auditHistory(value: unknown): MerchandisingReviewAuditEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizedAuditEntry)
    .filter(Boolean) as MerchandisingReviewAuditEntry[]
}

export function parseReviewCaption(
  caption?: string | null
): ParsedMerchandisingReviewPayload {
  if (!caption?.startsWith(REVIEW_CAPTION_PREFIX)) {
    return {
      review: { status: "unreviewed" },
      originalCaption: caption || null,
      auditHistory: [],
    }
  }

  try {
    const parsed = JSON.parse(caption.slice(REVIEW_CAPTION_PREFIX.length))
    return {
      originalCaption: parsed?.originalCaption || null,
      review: normalizedReview(parsed?.review),
      claim: normalizedClaim(parsed?.claim),
      auditHistory: auditHistory(parsed?.auditHistory),
    }
  } catch (error) {
    return {
      review: { status: "unreviewed" },
      originalCaption: caption,
      auditHistory: [],
    }
  }
}

export function isClaimActive(
  claim: MerchandisingImageClaim | undefined,
  now: Date = new Date()
) {
  if (!claim?.expiresAt) return false
  const expiresAt = new Date(claim.expiresAt)
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > now
}

export function isClaimOwnedBy(
  claim: MerchandisingImageClaim | undefined,
  staffEmail?: string | null
) {
  if (!claim || !staffEmail) return false
  return (
    text(claim.staffEmail).toLowerCase() === text(staffEmail).toLowerCase()
  )
}

export function buildMerchandisingClaim(input: {
  staffEmail?: string | null
  staffName?: string | null
  tagId?: string | null
  tagName?: string | null
  now?: Date
}): MerchandisingImageClaim {
  const now = input.now || new Date()
  const expiresAt = new Date(now)
  expiresAt.setHours(expiresAt.getHours() + MERCHANDISING_CLAIM_TTL_HOURS)

  return {
    staffEmail: text(input.staffEmail) || undefined,
    staffName: text(input.staffName) || undefined,
    claimedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tagId: text(input.tagId) || undefined,
    tagName: text(input.tagName) || undefined,
  }
}

export function serializeReviewCaption(
  currentCaption: string | null | undefined,
  next: {
    review?: MerchandisingImageReview
    claim?: MerchandisingImageClaim | null
    auditEntry?: MerchandisingReviewAuditEntry
  }
) {
  const parsed = parseReviewCaption(currentCaption)
  return `${REVIEW_CAPTION_PREFIX}${JSON.stringify({
    originalCaption: parsed.originalCaption || null,
    review: next.review || parsed.review,
    ...(next.claim ? { claim: next.claim } : {}),
    auditHistory: next.auditEntry
      ? [...parsed.auditHistory, next.auditEntry]
      : parsed.auditHistory,
  })}`
}

export function reviewSummary(review: MerchandisingImageReview) {
  const status =
    review.status === "approved"
      ? "approved"
      : review.status === "rejected"
      ? "rejected"
      : "unreviewed"
  const reviewer = review.reviewerName || review.reviewerEmail || "another staff member"
  const when = review.reviewedAt ? ` at ${review.reviewedAt}` : ""
  return `${reviewer} already ${status} this image${when}.`
}
