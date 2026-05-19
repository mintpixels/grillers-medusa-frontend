import "server-only"

import crypto from "crypto"
import { cookies } from "next/headers"
import type { StaffImpersonationSession } from "./impersonation-types"

export const STAFF_IMPERSONATION_COOKIE = "_gp_staff_impersonation"

function getSecret(): string {
  const secret =
    process.env.STAFF_IMPERSONATION_SECRET ||
    process.env.STAFF_ORDER_LINK_SECRET ||
    process.env.CRON_SECRET ||
    process.env.REVALIDATE_SECRET

  if (!secret) {
    throw new Error(
      "STAFF_IMPERSONATION_SECRET missing. Staff impersonation requires a signing secret."
    )
  }

  return secret
}

function signature(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url")
}

export function encodeStaffImpersonationSession(
  session: StaffImpersonationSession
): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return `${payload}.${signature(payload)}`
}

export function decodeStaffImpersonationSession(
  value: string | undefined
): StaffImpersonationSession | null {
  if (!value) return null

  try {
    const [payload, sig] = value.split(".")
    if (!payload || !sig) return null

    const expected = signature(payload)
    const expectedBuffer = new Uint8Array(Buffer.from(expected))
    const actualBuffer = new Uint8Array(Buffer.from(sig))
    if (
      expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return null
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as StaffImpersonationSession

    if (session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export async function readStaffImpersonationCookie(): Promise<StaffImpersonationSession | null> {
  const cookieStore = await cookies()
  return decodeStaffImpersonationSession(
    cookieStore.get(STAFF_IMPERSONATION_COOKIE)?.value
  )
}

export async function writeStaffImpersonationCookie(
  session: StaffImpersonationSession
) {
  const cookieStore = await cookies()
  cookieStore.set(
    STAFF_IMPERSONATION_COOKIE,
    encodeStaffImpersonationSession(session),
    {
      maxAge: 60 * 60 * 4,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    }
  )
}

export async function clearStaffImpersonationCookie() {
  const cookieStore = await cookies()
  cookieStore.set(STAFF_IMPERSONATION_COOKIE, "", {
    maxAge: -1,
    path: "/",
  })
}
