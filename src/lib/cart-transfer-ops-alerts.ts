import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type CartTransferRecoveryStage =
  | "cart_read_failed"
  | "missing_region_for_recovery"
  | "item_preservation_failed"

type CartTransferRecoveryAlertInput = {
  stage: CartTransferRecoveryStage
  cartId?: string | null
  lineItemCount?: number | null
  hasRegionId?: boolean | null
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
    .replace(/\b(?:cart|cus|addr|line|li|variant|var|prod|reg)_[A-Za-z0-9_]+/g, "[id]")
    .replace(/\s+/g, " ")
    .trim()

  return redacted ? redacted.slice(0, 500) : null
}

function stageTitle(stage: CartTransferRecoveryStage) {
  switch (stage) {
    case "cart_read_failed":
      return "Cart transfer recovery could not read the guest cart"
    case "missing_region_for_recovery":
      return "Cart transfer recovery could not recreate a customer cart"
    case "item_preservation_failed":
      return "Cart transfer recovery could not preserve cart items"
  }
}

export async function emitCartTransferRecoveryFailureAlert({
  stage,
  cartId,
  lineItemCount = null,
  hasRegionId = null,
  error,
}: CartTransferRecoveryAlertInput) {
  await emitStorefrontOpsAlert({
    alertKind: "cart_transfer_recovery_failed",
    severity: "warn",
    title: stageTitle(stage),
    path: "src/lib/data/customer.ts",
    source: "storefront-server",
    fingerprint: `cart_transfer_recovery:${stage}`,
    meta: {
      cart_recovery_stage: stage,
      cart_id: cartId || null,
      line_item_count: lineItemCount,
      has_region_id: hasRegionId,
      error_message: redactedErrorMessage(error),
    },
  })
}
