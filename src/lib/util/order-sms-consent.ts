export const ORDER_SMS_CONSENT_VERSION = "transactional-sms-v2-2026-07-11"

export const ORDER_SMS_DISCLOSURE =
  "Text me recurring automated Griller's Pride UPS shipping and tracking updates for this order. Message frequency varies, up to 6 messages per order, including an enrollment confirmation. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase."

export const ORDER_SMS_CONSENT_SOURCE = "checkout_order_updates"
export const ORDER_SMS_PROVIDER = "twilio"
export const ORDER_SMS_PROGRAM = "grillers_pride_order_updates"
export const ORDER_SMS_PURPOSE = "delivery_notifications"
export const ORDER_SMS_CONSENT_METHOD = "customer_checkbox"

export type OrderSmsConsentMetadata = {
  granted: boolean
  version: typeof ORDER_SMS_CONSENT_VERSION
  source: typeof ORDER_SMS_CONSENT_SOURCE
  provider: typeof ORDER_SMS_PROVIDER
  program: typeof ORDER_SMS_PROGRAM
  purpose: typeof ORDER_SMS_PURPOSE
  method: typeof ORDER_SMS_CONSENT_METHOD
  phone?: string
  timestamp?: string
  disclosure?: typeof ORDER_SMS_DISCLOSURE
}

export function buildOrderSmsConsentMetadata({
  granted,
  phone,
  timestamp = new Date().toISOString(),
}: {
  granted: boolean
  phone?: string | null
  timestamp?: string
}): OrderSmsConsentMetadata {
  const common = {
    granted,
    version: ORDER_SMS_CONSENT_VERSION,
    source: ORDER_SMS_CONSENT_SOURCE,
    provider: ORDER_SMS_PROVIDER,
    program: ORDER_SMS_PROGRAM,
    purpose: ORDER_SMS_PURPOSE,
    method: ORDER_SMS_CONSENT_METHOD,
  } as const

  if (!granted) {
    return common
  }

  const currentPhone = String(phone || "").trim()
  if (!currentPhone) {
    throw new Error("A fulfillment phone number is required for order texts.")
  }

  return {
    ...common,
    phone: currentPhone,
    timestamp,
    disclosure: ORDER_SMS_DISCLOSURE,
  }
}

export function isCurrentOrderSmsConsent(
  value: unknown,
  currentPhone: string
): value is OrderSmsConsentMetadata & {
  granted: true
  phone: string
  timestamp: string
  disclosure: typeof ORDER_SMS_DISCLOSURE
} {
  if (!value || typeof value !== "object") return false

  const consent = value as Record<string, unknown>
  return (
    consent.granted === true &&
    consent.phone === currentPhone &&
    typeof consent.timestamp === "string" &&
    consent.timestamp.length > 0 &&
    consent.version === ORDER_SMS_CONSENT_VERSION &&
    consent.disclosure === ORDER_SMS_DISCLOSURE &&
    consent.source === ORDER_SMS_CONSENT_SOURCE &&
    consent.provider === ORDER_SMS_PROVIDER &&
    consent.program === ORDER_SMS_PROGRAM &&
    consent.purpose === ORDER_SMS_PURPOSE &&
    consent.method === ORDER_SMS_CONSENT_METHOD
  )
}
