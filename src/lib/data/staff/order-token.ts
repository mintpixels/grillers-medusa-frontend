import "server-only"

import crypto from "crypto"

export type StaffCartHandoffPayload = {
  cartId: string
  countryCode: string
  staffCustomerId: string
  targetCustomerId?: string
  targetCustomerEmail: string
  expiresAt: number
}

function getSecret(): string {
  const secret =
    process.env.STAFF_ORDER_LINK_SECRET ||
    process.env.CRON_SECRET ||
    process.env.REVALIDATE_SECRET

  if (!secret) {
    throw new Error(
      "STAFF_ORDER_LINK_SECRET missing. Set it before generating staff checkout links."
    )
  }

  return secret
}

function encode(input: unknown): string {
  return Buffer.from(JSON.stringify(input)).toString("base64url")
}

function sign(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url")
}

export function signStaffCartHandoff(
  payload: StaffCartHandoffPayload
): string {
  const encodedPayload = encode(payload)
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function verifyStaffCartHandoff(
  token: string | null | undefined
): StaffCartHandoffPayload {
  if (!token) {
    throw new Error("Missing staff handoff token")
  }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    throw new Error("Invalid staff handoff token")
  }

  const expected = sign(encodedPayload)
  const expectedBuffer = new Uint8Array(Buffer.from(expected))
  const actualBuffer = new Uint8Array(Buffer.from(signature))
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Invalid staff handoff signature")
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8")
  ) as StaffCartHandoffPayload

  if (!payload.cartId || !payload.countryCode || !payload.targetCustomerEmail) {
    throw new Error("Incomplete staff handoff token")
  }

  if (payload.expiresAt < Date.now()) {
    throw new Error("Staff handoff token expired")
  }

  return payload
}
