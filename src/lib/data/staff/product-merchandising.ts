"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { isStaffCustomer, staffDisplayName } from "@lib/util/staff-access"

type AnyRecord = Record<string, any>

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

export type MerchandisingProductImage = {
  id: number
  documentId: string
  role: "featured" | "gallery"
  name: string
  url: string
  thumbnailUrl?: string
  alternativeText?: string | null
  caption?: string | null
  review: MerchandisingImageReview
}

export type ProductMerchandisingProduct = {
  documentId: string
  title: string
  description: string
  handle?: string | null
  sku: string
  metadata: string[]
  l2Tags: string[]
  l3Tags: string[]
  images: MerchandisingProductImage[]
}

export type ProductMerchandisingTagSummary = {
  documentId: string
  name: string
  displayName: string
  description?: string
  seoDescription?: string
  productCount: number
  imageCount: number
  reviewedImageCount: number
  approvedImageCount: number
  rejectedImageCount: number
  noImageProductCount: number
  metadata: string[]
  l2Parents: string[]
}

export type ProductMerchandisingDetail = ProductMerchandisingTagSummary & {
  products: ProductMerchandisingProduct[]
}

export type ReviewMerchandisingImageInput = {
  imageId: number
  imageDocumentId?: string
  countryCode: string
  status: Exclude<MerchandisingReviewStatus, "unreviewed">
  reason?: MerchandisingRejectReason
  note?: string
  currentCaption?: string | null
}

type RawProductTag = {
  documentId?: string
  Name?: string
  Description?: string | null
  SEODescription?: string | null
}

type RawImage = {
  id?: number
  documentId?: string
  name?: string
  url?: string
  formats?: AnyRecord | null
  alternativeText?: string | null
  caption?: string | null
}

type NormalizedProductTag = {
  documentId: string
  name: string
  description: string
  seoDescription: string
}

const REVIEW_CAPTION_PREFIX = "GP_IMAGE_REVIEW_V1:"
const PAGE_SIZE = 100
const REVIEW_VALIDATION_MESSAGES = new Set([
  "Choose an image to review.",
  "Choose a rejection reason.",
  "Staff access required.",
])

const METADATA_LABELS: Record<string, string> = {
  Brand: "Brand",
  Source: "Source",
  Origin: "Origin",
  Supplier: "Supplier",
  AvgPackSize: "Pack size",
  AvgPackWeight: "Pack weight",
  Serves: "Serves",
  PiecesPerPack: "Pieces",
  KosherForPassover: "Passover",
  GlutenFree: "Gluten-free",
  Organic: "Organic",
  GrassFed: "Grass-fed",
  FreeRange: "Free-range",
  BoneIn: "Bone-in",
  Boneless: "Boneless",
  Cooked: "Cooked",
  Uncooked: "Uncooked",
  HeatAndServe: "Heat and serve",
  Smoked: "Smoked",
  Marinated: "Marinated",
  VacuumPacked: "Vacuum packed",
  BulkPack: "Bulk pack",
  IQF: "IQF",
}

function strapiEndpoint() {
  const endpoint = process.env.STRAPI_ENDPOINT?.replace(/\/+$/, "")
  if (!endpoint) throw new Error("Missing STRAPI_ENDPOINT.")
  return endpoint
}

function strapiHeaders() {
  const token = process.env.STRAPI_API_TOKEN
  if (!token) throw new Error("Missing STRAPI_API_TOKEN.")

  return {
    Authorization: `Bearer ${token}`,
  }
}

function strapiRewriteHeaders() {
  const token =
    process.env.STRAPI_REWRITE_API_TOKEN || process.env.STRAPI_API_TOKEN
  if (!token) {
    throw new Error("Missing STRAPI_REWRITE_API_TOKEN.")
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

async function requireStaffCustomer() {
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()
  if (!customer || !isStaffCustomer(customer)) {
    throw new Error("Staff access required.")
  }
  return customer
}

function text(value: unknown) {
  return String(value || "").trim()
}

function stripLevelPrefix(name: string) {
  return name.replace(/^L[123]:\s*/i, "").trim()
}

function encodeTagKey(name: string) {
  return Buffer.from(name, "utf8").toString("base64url")
}

function decodeTagKey(key: string) {
  try {
    return Buffer.from(key, "base64url").toString("utf8")
  } catch (error) {
    return decodeURIComponent(key)
  }
}

function isL2Tag(name: string) {
  return /^L2:\s*/i.test(name)
}

function isL3Tag(name: string) {
  return /^L3:\s*/i.test(name)
}

function parseReviewCaption(caption?: string | null): {
  review: MerchandisingImageReview
  originalCaption?: string | null
} {
  if (!caption?.startsWith(REVIEW_CAPTION_PREFIX)) {
    return {
      review: { status: "unreviewed" },
      originalCaption: caption || null,
    }
  }

  try {
    const parsed = JSON.parse(caption.slice(REVIEW_CAPTION_PREFIX.length))
    const review = parsed?.review || {}
    const status =
      review.status === "approved" || review.status === "rejected"
        ? review.status
        : "unreviewed"

    return {
      review: {
        status,
        reason: review.reason,
        note: review.note,
        reviewerEmail: review.reviewerEmail,
        reviewerName: review.reviewerName,
        reviewedAt: review.reviewedAt,
      },
      originalCaption: parsed?.originalCaption || null,
    }
  } catch (error) {
    return {
      review: { status: "unreviewed" },
      originalCaption: caption,
    }
  }
}

function reviewCaption(
  currentCaption: string | null | undefined,
  review: MerchandisingImageReview
) {
  const parsed = parseReviewCaption(currentCaption)
  return `${REVIEW_CAPTION_PREFIX}${JSON.stringify({
    originalCaption: parsed.originalCaption || null,
    review,
  })}`
}

function imageUrl(image: RawImage) {
  const thumbnail = image.formats?.thumbnail?.url
  return {
    url: text(image.url),
    thumbnailUrl: text(thumbnail) || text(image.url),
  }
}

function merchandisingImage(
  image: RawImage | null | undefined,
  role: "featured" | "gallery"
): MerchandisingProductImage | null {
  if (!image?.id || !image.url) return null

  const parsed = parseReviewCaption(image.caption)
  const urls = imageUrl(image)

  return {
    id: image.id,
    documentId: text(image.documentId),
    role,
    name: text(image.name) || `Image ${image.id}`,
    url: urls.url,
    thumbnailUrl: urls.thumbnailUrl,
    alternativeText: image.alternativeText || null,
    caption: image.caption || null,
    review: parsed.review,
  }
}

function uniqueImages(product: AnyRecord): MerchandisingProductImage[] {
  const images: MerchandisingProductImage[] = []
  const seen = new Set<number>()
  const featured = merchandisingImage(product.FeaturedImage, "featured")

  if (featured) {
    images.push(featured)
    seen.add(featured.id)
  }

  for (const item of product.GalleryImages || []) {
    const image = merchandisingImage(item, "gallery")
    if (!image || seen.has(image.id)) continue
    images.push(image)
    seen.add(image.id)
  }

  return images
}

function variantSkus(product: AnyRecord) {
  return Array.from(
    new Set(
      (product.MedusaProduct?.Variants || [])
        .map((variant: AnyRecord) => text(variant.Sku))
        .filter(Boolean)
    )
  )
}

function productDescription(product: AnyRecord) {
  return (
    text(product.MedusaProduct?.Description) ||
    text(product.MedusaProduct?.ShortDescription) ||
    "No product description is available in Strapi."
  )
}

function metadataChips(metadata: AnyRecord | null | undefined) {
  if (!metadata || typeof metadata !== "object") return []

  return Object.entries(METADATA_LABELS)
    .map(([key, label]) => {
      const value = metadata[key]
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === false
      ) {
        return ""
      }
      if (value === true) return label
      return `${label}: ${value}`
    })
    .filter(Boolean)
    .slice(0, 8)
}

function productTags(product: AnyRecord): NormalizedProductTag[] {
  return (product.Categorization?.ProductTags || [])
    .map((tag: RawProductTag) => ({
      documentId: text(tag.documentId),
      name: text(tag.Name),
      description: text(tag.Description),
      seoDescription: text(tag.SEODescription),
    }))
    .filter((tag: NormalizedProductTag) => Boolean(tag.name))
}

function summarizeProduct(product: AnyRecord): ProductMerchandisingProduct {
  const tags = productTags(product)
  const skus = variantSkus(product)

  return {
    documentId: text(product.documentId),
    title:
      text(product.Title) ||
      text(product.MedusaProduct?.Title) ||
      "Untitled product",
    description: productDescription(product),
    handle: text(product.MedusaProduct?.Handle) || null,
    sku: skus.join(", ") || "No SKU",
    metadata: metadataChips(product.Metadata),
    l2Tags: tags.filter((tag) => isL2Tag(tag.name)).map((tag) => tag.name),
    l3Tags: tags.filter((tag) => isL3Tag(tag.name)).map((tag) => tag.name),
    images: uniqueImages(product),
  }
}

function addSummaryProduct(
  summary: ProductMerchandisingTagSummary,
  product: ProductMerchandisingProduct
) {
  summary.productCount += 1
  summary.imageCount += product.images.length
  summary.reviewedImageCount += product.images.filter(
    (image) => image.review.status !== "unreviewed"
  ).length
  summary.approvedImageCount += product.images.filter(
    (image) => image.review.status === "approved"
  ).length
  summary.rejectedImageCount += product.images.filter(
    (image) => image.review.status === "rejected"
  ).length
  if (product.images.length === 0) summary.noImageProductCount += 1

  summary.metadata = Array.from(
    new Set([...summary.metadata, ...product.metadata])
  ).slice(0, 10)
  summary.l2Parents = Array.from(
    new Set([...summary.l2Parents, ...product.l2Tags.map(stripLevelPrefix)])
  ).sort((a, b) => a.localeCompare(b))
}

async function strapiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${strapiEndpoint()}${path}`, {
    headers: strapiHeaders(),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Strapi request failed: ${response.status}`)
  }

  return response.json()
}

async function currentUploadFile(imageId: number): Promise<RawImage> {
  const response = await fetch(
    `${strapiEndpoint()}/api/upload/files/${imageId}`,
    {
      headers: strapiRewriteHeaders(),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Strapi image review read failed: ${response.status}`)
  }

  return response.json()
}

function captionsMatch(
  current: string | null | undefined,
  loaded: string | null | undefined
) {
  return (current || null) === (loaded || null)
}

function reviewFailureReason(error: unknown) {
  if (!(error instanceof Error)) return "unknown_error"
  const message = error.message.toLowerCase()
  if (message.includes("read failed")) return "strapi_read_failed"
  if (message.includes("write failed")) return "strapi_write_failed"
  if (message.includes("fetch")) return "network_error"
  return "server_exception"
}

function emitMerchandisingReviewTelemetry(input: {
  alertKind: string
  severity: "page" | "warn" | "info"
  title: string
  imageId: number
  imageDocumentId?: string
  attemptedStatus: Exclude<MerchandisingReviewStatus, "unreviewed">
  previousStatus?: MerchandisingReviewStatus
  reason?: string
}) {
  return emitStorefrontOpsAlert({
    alertKind: input.alertKind,
    severity: input.severity,
    title: input.title,
    path: "src/lib/data/staff/product-merchandising.ts",
    source: "storefront-staff",
    fingerprint: `${input.alertKind}:${input.reason || input.attemptedStatus}`,
    meta: {
      image_id: input.imageId,
      image_document_id: input.imageDocumentId || null,
      attempted_status: input.attemptedStatus,
      previous_status: input.previousStatus || null,
      reason: input.reason || null,
    },
  })
}

async function fetchAllProducts(): Promise<AnyRecord[]> {
  const products: AnyRecord[] = []
  let page = 1

  while (true) {
    const params = new URLSearchParams()
    params.set("pagination[page]", String(page))
    params.set("pagination[pageSize]", String(PAGE_SIZE))
    params.set("populate[FeaturedImage]", "true")
    params.set("populate[GalleryImages]", "true")
    params.set("populate[Metadata]", "true")
    params.set("populate[Categorization][populate][ProductTags]", "true")
    params.set("populate[MedusaProduct][populate][Variants]", "true")

    const json = await strapiGet<{
      data?: AnyRecord[]
      meta?: { pagination?: { page?: number; pageCount?: number } }
    }>(`/api/products?${params.toString()}`)
    products.push(...(json.data || []))

    const pageCount = json.meta?.pagination?.pageCount || page
    if (page >= pageCount || !json.data?.length) break
    page += 1
  }

  return products
}

export async function getProductMerchandisingTags(): Promise<
  ProductMerchandisingTagSummary[]
> {
  await requireStaffCustomer()

  const summaries = new Map<string, ProductMerchandisingTagSummary>()
  const products = (await fetchAllProducts()).map(summarizeProduct)

  for (const product of products) {
    for (const tagName of product.l3Tags) {
      const displayName = stripLevelPrefix(tagName)
      const tag = productTags({
        Categorization: {
          ProductTags: [
            ...product.l2Tags.map((name) => ({ Name: name })),
            ...product.l3Tags.map((name) => ({ Name: name })),
          ],
        },
      }).find((candidate) => candidate.name === tagName)
      const key = tagName

      if (!summaries.has(key)) {
        summaries.set(key, {
          documentId: encodeTagKey(key),
          name: tagName,
          displayName,
          description: tag?.description,
          seoDescription: tag?.seoDescription,
          productCount: 0,
          imageCount: 0,
          reviewedImageCount: 0,
          approvedImageCount: 0,
          rejectedImageCount: 0,
          noImageProductCount: 0,
          metadata: [],
          l2Parents: [],
        })
      }

      addSummaryProduct(summaries.get(key)!, product)
    }
  }

  return Array.from(summaries.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )
}

export async function getProductMerchandisingDetail(
  tagId: string
): Promise<ProductMerchandisingDetail | null> {
  await requireStaffCustomer()

  const tagName = decodeTagKey(tagId)
  const products = (await fetchAllProducts())
    .map(summarizeProduct)
    .filter((product) => product.l3Tags.includes(tagName))
    .sort((a, b) => a.title.localeCompare(b.title))

  if (!products.length) return null

  const summary: ProductMerchandisingTagSummary = {
    documentId: tagId,
    name: tagName,
    displayName: stripLevelPrefix(tagName),
    productCount: 0,
    imageCount: 0,
    reviewedImageCount: 0,
    approvedImageCount: 0,
    rejectedImageCount: 0,
    noImageProductCount: 0,
    metadata: [],
    l2Parents: [],
  }

  for (const product of products) {
    addSummaryProduct(summary, product)
  }

  return {
    ...summary,
    products,
  }
}

export async function reviewMerchandisingImage(
  input: ReviewMerchandisingImageInput
): Promise<{ ok: boolean; review?: MerchandisingImageReview; error?: string }> {
  try {
    const staff = await requireStaffCustomer()
    if (!input.imageId || input.imageId < 1) {
      throw new Error("Choose an image to review.")
    }
    if (input.status === "rejected" && !input.reason) {
      throw new Error("Choose a rejection reason.")
    }

    const review: MerchandisingImageReview = {
      status: input.status,
      reason: input.status === "rejected" ? input.reason : undefined,
      note: text(input.note) || undefined,
      reviewerEmail: staff.email || undefined,
      reviewerName: staffDisplayName(staff),
      reviewedAt: new Date().toISOString(),
    }
    const latestImage = await currentUploadFile(input.imageId)
    const previousReview = parseReviewCaption(latestImage.caption).review

    if (
      !captionsMatch(latestImage.caption || null, input.currentCaption || null)
    ) {
      await emitMerchandisingReviewTelemetry({
        alertKind: "staff_merchandising_review_conflict",
        severity: "warn",
        title: "Staff merchandising review was stale",
        imageId: input.imageId,
        imageDocumentId: input.imageDocumentId || latestImage.documentId,
        attemptedStatus: input.status,
        previousStatus: previousReview.status,
        reason: "caption_changed",
      })

      return {
        ok: false,
        error:
          "This image was updated by another reviewer. Refresh the page before saving.",
      }
    }

    const caption = reviewCaption(input.currentCaption, review)

    const response = await fetch(
      `${strapiEndpoint()}/api/upload?id=${input.imageId}`,
      {
        method: "POST",
        headers: {
          ...strapiRewriteHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileInfo: {
            caption,
          },
        }),
      }
    )

    const json = await response.json().catch(() => null)

    if (!response.ok || json?.errors) {
      const message = json?.error?.message || json?.errors?.[0]?.message
      throw new Error(
        `Strapi image review write failed: ${message || response.status}`
      )
    }

    revalidatePath(`/${input.countryCode}/account/staff/merchandising`)
    void emitMerchandisingReviewTelemetry({
      alertKind: "staff_merchandising_review_saved",
      severity: "info",
      title: "Staff merchandising image review saved",
      imageId: input.imageId,
      imageDocumentId: input.imageDocumentId || latestImage.documentId,
      attemptedStatus: input.status,
      previousStatus: previousReview.status,
      reason: input.status,
    })
    return { ok: true, review }
  } catch (error) {
    console.error("[product-merchandising] review failed", error)
    if (
      !(
        error instanceof Error && REVIEW_VALIDATION_MESSAGES.has(error.message)
      ) &&
      input.imageId
    ) {
      await emitMerchandisingReviewTelemetry({
        alertKind: "staff_merchandising_review_failed",
        severity: "page",
        title: "Staff merchandising image review failed",
        imageId: input.imageId,
        imageDocumentId: input.imageDocumentId,
        attemptedStatus: input.status,
        reason: reviewFailureReason(error),
      })
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save the image review.",
    }
  }
}
