"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  ImageOff,
  Loader2,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  UserRoundX,
  XCircle,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  reviewMerchandisingImage,
  type MerchandisingImageReview,
  type MerchandisingProductImage,
  type MerchandisingRejectReason,
  type ProductMerchandisingDetail,
  type ProductMerchandisingProduct,
} from "@lib/data/staff/product-merchandising"

type Props = {
  countryCode: string
  detail: ProductMerchandisingDetail
}

type RejectDraft = {
  image: MerchandisingProductImage
  reason: MerchandisingRejectReason
  note: string
} | null

const rejectOptions: Array<{
  value: MerchandisingRejectReason
  label: string
  icon: typeof Sparkles
}> = [
  {
    value: "looks_ai_or_synthetic",
    label: "Looks like AI or synthetic",
    icon: Sparkles,
  },
  {
    value: "human_in_image",
    label: "Human in the image",
    icon: UserRoundX,
  },
  {
    value: "other",
    label: "Other",
    icon: MessageSquareWarning,
  },
]

function shortDate(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString()
}

function reviewLabel(review: MerchandisingImageReview) {
  if (review.status === "approved") return "Approved"
  if (review.status === "rejected") return "Rejected"
  return "Needs review"
}

function reviewClass(review: MerchandisingImageReview) {
  if (review.status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (review.status === "rejected") {
    return "border-red-200 bg-red-50 text-red-800"
  }
  return "border-amber-200 bg-amber-50 text-amber-800"
}

function reasonLabel(reason?: MerchandisingRejectReason) {
  return rejectOptions.find((option) => option.value === reason)?.label || ""
}

function productProgress(product: ProductMerchandisingProduct) {
  const total = product.images.length
  const reviewed = product.images.filter(
    (image) => image.review.status !== "unreviewed"
  ).length
  const approved = product.images.filter(
    (image) => image.review.status === "approved"
  ).length
  const rejected = product.images.filter(
    (image) => image.review.status === "rejected"
  ).length

  return {
    total,
    reviewed,
    approved,
    rejected,
    percent: total ? Math.round((reviewed / total) * 100) : 0,
  }
}

function ProductReviewRail({
  product,
}: {
  product: ProductMerchandisingProduct
}) {
  const progress = productProgress(product)

  return (
    <div className="border-t border-gray-100 bg-Scroll/35 px-4 py-3">
      <div className="flex flex-col gap-2 small:flex-row small:items-center small:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-7 min-w-[160px] flex-1">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-Charcoal/15" />
            <div
              className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-Gold"
              style={{ width: `${progress.percent}%` }}
            />
            <div
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-Gold bg-white shadow-sm"
              style={{ left: `calc(${progress.percent}% - 8px)` }}
            />
          </div>
          <span className="whitespace-nowrap text-xs font-maison-neue-mono uppercase text-Charcoal/55">
            {progress.reviewed}/{progress.total} reviewed
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-maison-neue-mono uppercase ${
            progress.rejected
              ? "border-red-200 bg-red-50 text-red-800"
              : progress.percent === 100 && progress.total
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {progress.rejected
            ? `${progress.rejected} rejected`
            : progress.percent === 100 && progress.total
            ? "Complete"
            : "In review"}
        </span>
      </div>
    </div>
  )
}

function NoImagePlaceholder() {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-Scroll/60">
      <div className="text-center">
        <ImageOff className="mx-auto h-9 w-9 text-Charcoal/30" aria-hidden />
        <p className="mt-2 text-sm font-maison-neue text-Charcoal/45">
          No image
        </p>
      </div>
    </div>
  )
}

function FilterToggle({
  active,
  label,
  count,
  onToggle,
}: {
  active: boolean
  label: string
  count: number
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`inline-flex min-h-[38px] items-center gap-2 rounded-md border px-3 text-xs font-maison-neue-mono uppercase transition ${
        active
          ? "border-Charcoal bg-Charcoal text-white"
          : "border-gray-200 bg-white text-Charcoal/60 hover:border-Gold hover:text-Charcoal"
      }`}
    >
      <EyeOff className="h-4 w-4" aria-hidden />
      {label}
      <span
        className={`rounded-full px-2 py-0.5 ${
          active ? "bg-white/15 text-white" : "bg-Scroll text-Charcoal/55"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function CollapsedProductRow({
  product,
}: {
  product: ProductMerchandisingProduct
}) {
  const progress = productProgress(product)
  const isComplete = progress.total > 0 && progress.approved === progress.total
  const hasRejected = progress.rejected > 0

  return (
    <article className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-gyst font-bold text-Charcoal">
            {product.title}
          </h2>
          <p className="mt-1 text-xs font-maison-neue-mono uppercase text-Charcoal/45">
            SKU {product.sku} / {progress.reviewed}/{progress.total} reviewed
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-maison-neue-mono uppercase ${
              isComplete
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : hasRejected
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-gray-200 bg-Scroll text-Charcoal/55"
            }`}
          >
            {isComplete ? "Complete" : "Hidden by filters"}
          </span>
          {isComplete && (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
          )}
          {!isComplete && hasRejected && (
            <XCircle className="h-6 w-6 text-red-600" aria-hidden />
          )}
        </div>
      </div>
    </article>
  )
}

function ImageCard({
  image,
  isPending,
  onApprove,
  onReject,
}: {
  image: MerchandisingProductImage
  isPending: boolean
  onApprove: (image: MerchandisingProductImage) => void
  onReject: (image: MerchandisingProductImage) => void
}) {
  const Icon =
    image.review.status === "approved"
      ? CheckCircle2
      : image.review.status === "rejected"
      ? XCircle
      : ShieldCheck

  return (
    <div className="group overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="relative aspect-square bg-Scroll">
        {/*
          Load Strapi's large/medium derivative directly (unoptimized) instead
          of through Vercel's image optimizer. The optimizer reliably failed to
          render these heavier sources for an image-heavy review page (~36 at
          once) — the cards came up blank. The derivative is already ~750-1000px
          (crisp at this ~600px display) and ~150KB, so it loads straight from
          Strapi's CDN with no optimizer bottleneck.
        */}
        <Image
          src={image.displayUrl}
          alt={image.alternativeText || image.name}
          fill
          unoptimized
          sizes="(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-Charcoal/80 via-Charcoal/10 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <div className="grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onApprove(image)}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-white px-3 text-xs font-rexton font-bold uppercase text-Charcoal transition hover:bg-emerald-50 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
              Approve
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onReject(image)}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-white px-3 text-xs font-rexton font-bold uppercase text-Charcoal transition hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 text-red-600" aria-hidden />
              Reject
            </button>
          </div>
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-maison-neue-mono uppercase text-Charcoal/65 shadow-sm">
          {image.role}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-maison-neue-mono uppercase ${reviewClass(
            image.review
          )}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {reviewLabel(image.review)}
        </div>
        {image.review.reviewerEmail && (
          <p className="break-words text-xs font-maison-neue text-Charcoal/55">
            Latest by {image.review.reviewerEmail}
          </p>
        )}
        {image.review.status === "rejected" && (
          <p className="text-xs font-maison-neue text-red-700">
            {reasonLabel(image.review.reason)}
            {image.review.note ? `: ${image.review.note}` : ""}
          </p>
        )}
        {image.review.reviewedAt && (
          <p className="text-[11px] font-maison-neue-mono uppercase text-Charcoal/35">
            {shortDate(image.review.reviewedAt)}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ProductMerchandisingDetailView({
  countryCode,
  detail,
}: Props) {
  const [products, setProducts] = useState(detail.products)
  const [rejectDraft, setRejectDraft] = useState<RejectDraft>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingImageId, setPendingImageId] = useState<number | null>(null)
  const [hideApproved, setHideApproved] = useState(false)
  const [hideRejected, setHideRejected] = useState(false)
  const [isPending, startTransition] = useTransition()

  const stats = useMemo(
    () =>
      products.reduce(
        (acc, product) => {
          acc.products += 1
          acc.images += product.images.length
          acc.reviewed += product.images.filter(
            (image) => image.review.status !== "unreviewed"
          ).length
          acc.approved += product.images.filter(
            (image) => image.review.status === "approved"
          ).length
          acc.rejected += product.images.filter(
            (image) => image.review.status === "rejected"
          ).length
          return acc
        },
        { products: 0, images: 0, reviewed: 0, approved: 0, rejected: 0 }
      ),
    [products]
  )

  function updateLocalImage(imageId: number, review: MerchandisingImageReview) {
    setProducts((current) =>
      current.map((product) => ({
        ...product,
        images: product.images.map((image) =>
          image.id === imageId
            ? {
                ...image,
                review,
              }
            : image
        ),
      }))
    )
  }

  function submitReview(
    image: MerchandisingProductImage,
    status: "approved" | "rejected",
    reason?: MerchandisingRejectReason,
    note?: string
  ) {
    setError(null)
    setFeedback(null)
    setPendingImageId(image.id)
    startTransition(async () => {
      const result = await reviewMerchandisingImage({
        imageId: image.id,
        imageDocumentId: image.documentId,
        countryCode,
        status,
        reason,
        note,
        currentCaption: image.caption,
      })

      setPendingImageId(null)
      if (!result.ok || !result.review) {
        setError(result.error || "Could not save review.")
        return
      }

      updateLocalImage(image.id, result.review)
      setRejectDraft(null)
      setFeedback(
        `${image.name} marked ${
          status === "approved" ? "approved" : "rejected"
        }.`
      )
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 large:flex-row large:items-start large:justify-between">
        <div>
          <LocalizedClientLink
            href="/account/staff/orders?workspace=merchandising"
            className="inline-flex items-center gap-1.5 text-sm font-maison-neue font-semibold text-Charcoal/55 transition hover:text-Gold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Product merchandising
          </LocalizedClientLink>
          <p className="mt-5 text-xs font-maison-neue-mono uppercase text-Gold">
            L3 image review
          </p>
          <h1 className="mt-2 text-h3 font-gyst font-bold text-Charcoal">
            {detail.displayName}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-maison-neue text-Charcoal/60">
            Review every Strapi product image in this L3 group. Approvals and
            rejection notes are stored on the Strapi media record with the
            latest staff reviewer.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 small:min-w-[360px]">
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-[11px] font-maison-neue-mono uppercase text-Charcoal/45">
              Products
            </p>
            <p className="mt-1 text-2xl font-gyst font-bold text-Charcoal">
              {stats.products}
            </p>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800">
            <p className="text-[11px] font-maison-neue-mono uppercase opacity-70">
              Images
            </p>
            <p className="mt-1 text-2xl font-gyst font-bold">{stats.images}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <p className="text-[11px] font-maison-neue-mono uppercase opacity-70">
              Reviewed
            </p>
            <p className="mt-1 text-2xl font-gyst font-bold">
              {stats.reviewed}
            </p>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
            <p className="text-[11px] font-maison-neue-mono uppercase opacity-70">
              Rejected
            </p>
            <p className="mt-1 text-2xl font-gyst font-bold">
              {stats.rejected}
            </p>
          </div>
        </div>
      </div>

      {(feedback || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-maison-neue ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 large:flex-row large:items-center large:justify-between">
        <div>
          <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
            Image filters
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterToggle
            active={hideApproved}
            label="Hide approved"
            count={stats.approved}
            onToggle={() => setHideApproved((current) => !current)}
          />
          <FilterToggle
            active={hideRejected}
            label="Hide rejected"
            count={stats.rejected}
            onToggle={() => setHideRejected((current) => !current)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product) => {
          const visibleImages = product.images.filter((image) => {
            if (hideApproved && image.review.status === "approved") {
              return false
            }
            if (hideRejected && image.review.status === "rejected") {
              return false
            }
            return true
          })
          const shouldCollapse =
            product.images.length > 0 && !visibleImages.length

          if (shouldCollapse) {
            return (
              <CollapsedProductRow key={product.documentId} product={product} />
            )
          }

          return (
            <article
              key={product.documentId}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <div className="p-4 large:p-5">
                <div className="grid gap-5 large:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] large:items-start">
                  <div className="min-w-0 space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl font-gyst font-bold text-Charcoal">
                          {product.title}
                        </h2>
                        {product.handle && (
                          <LocalizedClientLink
                            href={`/products/${product.handle}`}
                            className="inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-md border border-Charcoal px-3 text-xs font-rexton font-bold uppercase text-Charcoal transition hover:bg-Charcoal hover:text-white"
                          >
                            PDP
                          </LocalizedClientLink>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-maison-neue leading-6 text-Charcoal/65">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-Charcoal/15 bg-Charcoal/5 px-2.5 py-1 text-xs font-maison-neue-mono uppercase text-Charcoal/65">
                        SKU {product.sku}
                      </span>
                      {product.metadata.slice(0, 5).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-maison-neue text-Charcoal/60"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 small:grid-cols-2">
                    {product.images.length ? (
                      visibleImages.map((image) => (
                        <ImageCard
                          key={image.id}
                          image={image}
                          isPending={isPending && pendingImageId === image.id}
                          onApprove={(item) => submitReview(item, "approved")}
                          onReject={(item) =>
                            setRejectDraft({
                              image: item,
                              reason: "looks_ai_or_synthetic",
                              note: "",
                            })
                          }
                        />
                      ))
                    ) : (
                      <NoImagePlaceholder />
                    )}
                  </div>
                </div>
              </div>
              <ProductReviewRail product={product} />
            </article>
          )
        })}
      </div>

      {rejectDraft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-Charcoal/55 p-4 small:items-center">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Reject image
                </p>
                <h2 className="mt-2 text-2xl font-gyst font-bold text-Charcoal">
                  What needs fixing?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRejectDraft(null)}
                className="rounded-md p-2 text-Charcoal/45 transition hover:bg-gray-100 hover:text-Charcoal"
                aria-label="Close rejection form"
              >
                <XCircle className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {rejectOptions.map((option) => {
                const Icon = option.icon
                const active = rejectDraft.reason === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setRejectDraft((current) =>
                        current ? { ...current, reason: option.value } : current
                      )
                    }
                    className={`flex min-h-[46px] items-center gap-3 rounded-md border px-3 text-left text-sm font-maison-neue transition ${
                      active
                        ? "border-Gold bg-Gold/10 text-Charcoal"
                        : "border-gray-200 bg-white text-Charcoal/65 hover:border-Gold/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {option.label}
                  </button>
                )
              })}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
                Optional note
              </span>
              <textarea
                value={rejectDraft.note}
                onChange={(event) =>
                  setRejectDraft((current) =>
                    current ? { ...current, note: event.target.value } : current
                  )
                }
                rows={4}
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-maison-neue text-Charcoal outline-none transition focus:border-Gold focus:ring-2 focus:ring-Gold/15"
                placeholder="Add detail for the image replacement pass."
              />
            </label>

            <div className="mt-5 flex flex-col-reverse gap-2 small:flex-row small:justify-end">
              <button
                type="button"
                onClick={() => setRejectDraft(null)}
                className="min-h-[42px] rounded-md border border-gray-200 px-4 text-xs font-rexton font-bold uppercase text-Charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  submitReview(
                    rejectDraft.image,
                    "rejected",
                    rejectDraft.reason,
                    rejectDraft.note
                  )
                }
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md bg-Charcoal px-4 text-xs font-rexton font-bold uppercase text-white disabled:opacity-50"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Submit rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
