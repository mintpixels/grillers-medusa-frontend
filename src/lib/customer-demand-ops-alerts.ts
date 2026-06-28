import { emitStorefrontOpsAlert } from "@lib/ops-alert"

const WHOLESALE_INQUIRY_PATH = "src/app/api/wholesale-inquiry/route.ts"
const BACK_IN_STOCK_PATH = "src/lib/data/back-in-stock.ts"

type WholesaleInquiryFailureStage =
  | "configuration"
  | "postmark_response"
  | "transport"

type BackInStockCaptureFailureStage =
  | "configuration"
  | "strapi_persist"
  | "confirmation_email"

type WholesaleInquiryFailureInput = {
  stage: WholesaleInquiryFailureStage
  missingEnv?: string[]
  status?: number
  statusText?: string
  error?: unknown
  operationType?: string
  sourceUrlPresent?: boolean
}

type BackInStockCaptureFailureInput = {
  stage: BackInStockCaptureFailureStage
  status?: number
  statusText?: string
  error?: unknown
  missingEnv?: string[]
  medusaProductId?: string
  medusaVariantId?: string
  productHandle?: string
  sku?: string
  source?: "pdp" | "side_cart" | "search"
  waitlistReason?: "out_of_stock" | "allocated_out" | "future_unavailable"
  strapiId?: string | number | null
}

function redactedMessage(value: unknown): string | null {
  if (value === null || value === undefined) return null

  const raw =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : (() => {
            try {
              return JSON.stringify(value)
            } catch {
              return String(value)
            }
          })()

  const redacted = raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\s+/g, " ")
    .trim()

  return redacted ? redacted.slice(0, 500) : null
}

async function safeEmitStorefrontOpsAlert(
  input: Parameters<typeof emitStorefrontOpsAlert>[0]
) {
  try {
    await emitStorefrontOpsAlert(input)
  } catch {
    // Fail open: alerting must never change customer-facing form behavior.
  }
}

export async function emitWholesaleInquiryFailureAlert({
  stage,
  missingEnv = [],
  status,
  statusText,
  error,
  operationType,
  sourceUrlPresent,
}: WholesaleInquiryFailureInput) {
  await safeEmitStorefrontOpsAlert({
    alertKind: "wholesale_inquiry_send_failed",
    severity: "warn",
    title:
      stage === "configuration"
        ? `Wholesale inquiry endpoint misconfigured: ${missingEnv.join(", ")}`
        : `Wholesale inquiry ${stage} failed${status ? ` (${status})` : ""}`,
    path: WHOLESALE_INQUIRY_PATH,
    source: "storefront-server",
    fingerprint: `wholesale_inquiry:${stage}:${status || "unknown"}`,
    meta: {
      demand_flow: "wholesale_inquiry",
      stage,
      missing_env: missingEnv,
      status: status || null,
      status_text: statusText || null,
      operation_type: operationType || null,
      source_url_present:
        typeof sourceUrlPresent === "boolean" ? sourceUrlPresent : null,
      error_message: redactedMessage(error),
    },
  })
}

export async function emitBackInStockCaptureFailureAlert({
  stage,
  status,
  statusText,
  error,
  missingEnv = [],
  medusaProductId,
  medusaVariantId,
  productHandle,
  sku,
  source,
  waitlistReason,
  strapiId,
}: BackInStockCaptureFailureInput) {
  await safeEmitStorefrontOpsAlert({
    alertKind: "back_in_stock_capture_failed",
    severity: "warn",
    title:
      stage === "configuration"
        ? `Back-in-stock capture misconfigured: ${missingEnv.join(", ")}`
        : `Back-in-stock ${stage} failed${status ? ` (${status})` : ""}`,
    path: BACK_IN_STOCK_PATH,
    source: "storefront-server",
    fingerprint: `back_in_stock:${stage}:${status || "unknown"}`,
    meta: {
      demand_flow: "back_in_stock",
      stage,
      missing_env: missingEnv,
      status: status || null,
      status_text: statusText || null,
      medusa_product_id: medusaProductId || null,
      medusa_variant_id: medusaVariantId || null,
      product_handle: productHandle || null,
      sku: sku || null,
      source: source || null,
      waitlist_reason: waitlistReason || null,
      strapi_id: strapiId || null,
      error_message: redactedMessage(error),
    },
  })
}
