import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type FulfillmentOptionsStage =
  | "cart_shipping_methods"
  | "all_fulfillment_options"

type FulfillmentOptionsAlertInput = {
  stage: FulfillmentOptionsStage
  cartId?: string | null
  error?: unknown
}

function redactedErrorMessage(error: unknown): string | null {
  if (error === undefined || error === null) return null

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error)
            } catch {
              return String(error)
            }
          })()

  const redacted = raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:cart|cus|addr|ship|so|pay|pi|pm)_[A-Za-z0-9_]+/g, "[id]")
    .replace(/\s+/g, " ")
    .trim()

  return redacted ? redacted.slice(0, 500) : null
}

function stageLabel(stage: FulfillmentOptionsStage) {
  switch (stage) {
    case "cart_shipping_methods":
      return "cart shipping methods"
    case "all_fulfillment_options":
      return "fulfillment options"
  }
}

export async function emitCheckoutFulfillmentOptionsFailureAlert({
  stage,
  cartId,
  error,
}: FulfillmentOptionsAlertInput) {
  await emitStorefrontOpsAlert({
    alertKind: "checkout_fulfillment_options_failed",
    severity: "warn",
    title: `Checkout ${stageLabel(stage)} unavailable`,
    path: "src/lib/data/fulfillment.ts",
    source: "storefront-server",
    fingerprint: `checkout:fulfillment_options:${stage}`,
    meta: {
      checkout_surface: "checkout",
      stage,
      cart_id: cartId || null,
      error_message: redactedErrorMessage(error),
    },
  })
}
