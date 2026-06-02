export const SMS_MARKETING_CONSENT_VERSION = "sms-v1-2026-06-02"
export const SMS_MARKETING_PROGRAM = "grillers_pride_text_updates"
export const SMS_MARKETING_PROVIDER = "twilio"

export const SMS_MARKETING_OPT_IN_LABEL =
  "Text me order reminders and occasional Griller's Pride updates"

export const SMS_MARKETING_STAFF_OPT_IN_LABEL =
  "Customer agreed to receive text messages"

export const SMS_MARKETING_DISCLOSURE =
  "By checking this box, you agree to receive recurring automated marketing text messages from Griller's Pride at the mobile number provided. Consent is not required to buy. Msg & data rates may apply. Reply STOP to unsubscribe or HELP for help."

function truthy(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === "1"
}

export function formWantsSmsMarketing(formData: FormData): boolean {
  return truthy(formData.get("sms_marketing_opt_in"))
}

export function buildSmsMarketingConsentMetadata(input: {
  phone: string
  source: string
  consentedAt?: string
}) {
  const consentedAt = input.consentedAt || new Date().toISOString()

  return {
    sms_marketing_opt_in: true,
    sms_consent: true,
    sms_consent_status: "subscribed",
    sms_consent_at: consentedAt,
    sms_consent_source: input.source,
    sms_consent_version: SMS_MARKETING_CONSENT_VERSION,
    sms_consent_text: SMS_MARKETING_DISCLOSURE,
    sms_consent_phone: input.phone,
    sms_consent_provider: SMS_MARKETING_PROVIDER,
    sms_program: SMS_MARKETING_PROGRAM,
  }
}
