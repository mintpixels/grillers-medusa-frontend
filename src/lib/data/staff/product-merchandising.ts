"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import {
  canReviewMerchandising,
  staffDisplayName,
} from "@lib/util/staff-access"

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
  displayUrl: string
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
const GRAPHQL_PAGE_SIZE = 100
const GRAPHQL_PAGE_BATCH_SIZE = 5
const TAG_SUMMARY_CACHE_MS = 60 * 1000

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

let tagSummaryCache: {
  timestamp: number
  tags: ProductMerchandisingTagSummary[]
} | null = null
let tagSummaryInflight: Promise<ProductMerchandisingTagSummary[]> | null = null

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
  if (!customer || !canReviewMerchandising(customer)) {
    throw new Error("Merchandising reviewer access required.")
  }
  return customer
}

function text(value: unknown) {
  return String(value || "").trim()
}

function numericHash(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash || 1
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
  const formats = image.formats || {}
  const thumbnail = formats.thumbnail?.url
  // Source a Strapi-generated derivative (large/medium ~750-1000px) for the
  // review grid: crisp at the ~600px display size yet far lighter than the full
  // original. All derivatives share the thumbnail's host (already allowed), and
  // fall back to the thumbnail/original so this is never worse than before.
  const display =
    text(formats.large?.url) ||
    text(formats.medium?.url) ||
    text(formats.small?.url) ||
    text(thumbnail) ||
    text(image.url)
  return {
    url: text(image.url),
    displayUrl: display,
    thumbnailUrl: text(thumbnail) || text(image.url),
  }
}

function merchandisingImage(
  image: RawImage | null | undefined,
  role: "featured" | "gallery"
): MerchandisingProductImage | null {
  if (!image?.url) return null

  const parsed = parseReviewCaption(image.caption)
  const urls = imageUrl(image)
  const documentId = text(image.documentId)
  const id = image.id || numericHash(documentId || urls.url)

  return {
    id,
    documentId,
    role,
    name: text(image.name) || `Image ${id}`,
    url: urls.url,
    displayUrl: urls.displayUrl,
    thumbnailUrl: urls.thumbnailUrl,
    alternativeText: image.alternativeText || null,
    caption: image.caption || null,
    review: parsed.review,
  }
}

function uniqueImages(product: AnyRecord): MerchandisingProductImage[] {
  const images: MerchandisingProductImage[] = []
  const seen = new Set<string>()
  const featured = merchandisingImage(product.FeaturedImage, "featured")

  if (featured) {
    images.push(featured)
    seen.add(featured.documentId || featured.url)
  }

  for (const item of product.GalleryImages || []) {
    const image = merchandisingImage(item, "gallery")
    const key = image?.documentId || image?.url
    if (!image || !key || seen.has(key)) continue
    images.push(image)
    seen.add(key)
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

async function strapiGraphql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${strapiEndpoint()}/graphql`, {
    method: "POST",
    headers: {
      ...strapiHeaders(),
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json().catch(() => null)

  if (!response.ok || json?.errors) {
    const message = json?.errors?.[0]?.message || response.status
    throw new Error(`Strapi GraphQL request failed: ${message}`)
  }

  return json.data as T
}

const MERCHANDISING_OVERVIEW_PRODUCTS_QUERY = /* GraphQL */ `
  query MerchandisingOverviewProducts($limit: Int, $start: Int) {
    products(pagination: { limit: $limit, start: $start }) {
      documentId
      FeaturedImage {
        documentId
        caption
        url
      }
      GalleryImages {
        documentId
        caption
        url
      }
      Metadata {
        Brand
        Source
        Origin
        Supplier
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
        KosherForPassover
        GlutenFree
        Organic
        GrassFed
        FreeRange
        BoneIn
        Boneless
        Cooked
        Uncooked
        HeatAndServe
        Smoked
        Marinated
        VacuumPacked
        BulkPack
        IQF
      }
      Categorization {
        ProductTags {
          documentId
          Name
          Description
          SEODescription
        }
      }
    }
  }
`

const MERCHANDISING_DETAIL_PRODUCTS_QUERY = /* GraphQL */ `
  query MerchandisingDetailProducts(
    $tagName: String!
    $limit: Int
    $start: Int
  ) {
    products(
      filters: {
        Categorization: { ProductTags: { Name: { contains: $tagName } } }
      }
      pagination: { limit: $limit, start: $start }
    ) {
      documentId
      Title
      FeaturedImage {
        documentId
        name
        url
        formats
        alternativeText
        caption
      }
      GalleryImages {
        documentId
        name
        url
        formats
        alternativeText
        caption
      }
      Metadata {
        Brand
        Source
        Origin
        Supplier
        AvgPackSize
        AvgPackWeight
        Serves
        PiecesPerPack
        KosherForPassover
        GlutenFree
        Organic
        GrassFed
        FreeRange
        BoneIn
        Boneless
        Cooked
        Uncooked
        HeatAndServe
        Smoked
        Marinated
        VacuumPacked
        BulkPack
        IQF
      }
      Categorization {
        ProductTags {
          documentId
          Name
          Description
          SEODescription
        }
      }
      MedusaProduct {
        Title
        Handle
        Description
        ShortDescription
        Variants {
          Sku
        }
      }
    }
  }
`

async function fetchGraphqlProducts(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<AnyRecord[]> {
  const products: AnyRecord[] = []
  let start = 0

  while (true) {
    const pageStarts = Array.from(
      { length: GRAPHQL_PAGE_BATCH_SIZE },
      (_, index) => start + index * GRAPHQL_PAGE_SIZE
    )
    const pages = await Promise.all(
      pageStarts.map(async (pageStart) => {
        const data = await strapiGraphql<{ products?: AnyRecord[] }>(query, {
          ...variables,
          limit: GRAPHQL_PAGE_SIZE,
          start: pageStart,
        })
        return data.products || []
      })
    )

    for (const page of pages) {
      products.push(...page)
    }

    if (pages.some((page) => page.length < GRAPHQL_PAGE_SIZE)) break
    start += GRAPHQL_PAGE_BATCH_SIZE * GRAPHQL_PAGE_SIZE
  }

  return products
}

async function fetchOverviewProducts(): Promise<AnyRecord[]> {
  return fetchGraphqlProducts(MERCHANDISING_OVERVIEW_PRODUCTS_QUERY)
}

async function fetchDetailProducts(tagName: string): Promise<AnyRecord[]> {
  return fetchGraphqlProducts(MERCHANDISING_DETAIL_PRODUCTS_QUERY, { tagName })
}

async function uploadFilesByDocumentId(
  documentIds: string[]
): Promise<Map<string, RawImage>> {
  const uniqueIds = Array.from(new Set(documentIds.filter(Boolean)))
  const files = new Map<string, RawImage>()

  for (let start = 0; start < uniqueIds.length; start += 50) {
    const chunk = uniqueIds.slice(start, start + 50)
    const params = new URLSearchParams()
    chunk.forEach((documentId, index) => {
      params.set(`filters[documentId][$in][${index}]`, documentId)
    })

    const uploads = await strapiGet<RawImage[]>(
      `/api/upload/files?${params.toString()}`
    )

    for (const upload of uploads || []) {
      const documentId = text(upload.documentId)
      if (documentId) files.set(documentId, upload)
    }
  }

  return files
}

async function uploadFileByDocumentId(
  documentId?: string
): Promise<RawImage | null> {
  if (!documentId) return null
  const uploads = await uploadFilesByDocumentId([documentId])
  return uploads.get(documentId) || null
}

async function hydrateProductImagesWithUploadFiles(
  products: ProductMerchandisingProduct[]
): Promise<ProductMerchandisingProduct[]> {
  const documentIds = products.flatMap((product) =>
    product.images.map((image) => image.documentId).filter(Boolean)
  )
  if (!documentIds.length) return products

  const uploads = await uploadFilesByDocumentId(documentIds)

  return products.map((product) => ({
    ...product,
    images: product.images.map((image) => {
      const upload = uploads.get(image.documentId)
      if (!upload) return image
      const parsed = parseReviewCaption(upload.caption)
      const urls = imageUrl(upload)

      return {
        ...image,
        id: upload.id || image.id,
        name: text(upload.name) || image.name,
        url: urls.url || image.url,
        displayUrl: urls.displayUrl || image.displayUrl,
        thumbnailUrl: urls.thumbnailUrl || image.thumbnailUrl,
        alternativeText: upload.alternativeText || image.alternativeText,
        caption: upload.caption || null,
        review: parsed.review,
      }
    }),
  }))
}

export async function getProductMerchandisingTags(): Promise<
  ProductMerchandisingTagSummary[]
> {
  await requireStaffCustomer()

  if (
    tagSummaryCache &&
    Date.now() - tagSummaryCache.timestamp < TAG_SUMMARY_CACHE_MS
  ) {
    return tagSummaryCache.tags
  }
  if (tagSummaryInflight) return tagSummaryInflight

  tagSummaryInflight = buildProductMerchandisingTags()

  try {
    const tags = await tagSummaryInflight
    tagSummaryCache = {
      timestamp: Date.now(),
      tags,
    }
    return tags
  } finally {
    tagSummaryInflight = null
  }
}

async function buildProductMerchandisingTags(): Promise<
  ProductMerchandisingTagSummary[]
> {
  const summaries = new Map<string, ProductMerchandisingTagSummary>()
  const products = (await fetchOverviewProducts()).map(summarizeProduct)

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
  const products = (
    await hydrateProductImagesWithUploadFiles(
      (await fetchDetailProducts(tagName)).map(summarizeProduct)
    )
  )
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
    const upload = await uploadFileByDocumentId(input.imageDocumentId)
    const imageId = upload?.id || input.imageId

    if (!imageId || imageId < 1) {
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
    const caption = reviewCaption(input.currentCaption, review)

    const response = await fetch(
      `${strapiEndpoint()}/api/upload?id=${imageId}`,
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

    tagSummaryCache = null

    const json = await response.json().catch(() => null)

    if (!response.ok || json?.errors) {
      const message = json?.error?.message || json?.errors?.[0]?.message
      throw new Error(
        `Strapi image review write failed: ${message || response.status}`
      )
    }

    revalidatePath(`/${input.countryCode}/account/staff/merchandising`)
    return { ok: true, review }
  } catch (error) {
    console.error("[product-merchandising] review failed", error)
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save the image review.",
    }
  }
}
