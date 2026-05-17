"use server"

import "server-only"

import crypto from "crypto"
import { cookies } from "next/headers"
import { retrieveCustomer } from "@lib/data/customer"
import { isStaffCustomer, staffDisplayName } from "@lib/util/staff-access"

const COOKIE_NAME = "_gp_staff_impersonation"

export type StaffImpersonationSession = {
  staffCustomerId: string
  staffEmail: string
  staffName: string
  targetCustomerId: string
  targetEmail: string
  targetName: string
  startedAt: string
  expiresAt: number
}

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

function encode(session: StaffImpersonationSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return `${payload}.${signature(payload)}`
}

function decode(value: string | undefined): StaffImpersonationSession | null {
  if (!value) return null
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
}

async function requireStaffForImpersonation() {
  const staff = await retrieveCustomer()
  if (!staff || !isStaffCustomer(staff)) {
    throw new Error("Staff access required.")
  }
  return staff
}

export async function getStaffImpersonationSession(): Promise<StaffImpersonationSession | null> {
  const cookieStore = await cookies()
  const session = decode(cookieStore.get(COOKIE_NAME)?.value)
  if (!session) return null

  const staff = await retrieveCustomer().catch(() => null)
  if (!staff || !isStaffCustomer(staff) || staff.id !== session.staffCustomerId) {
    return null
  }

  return session
}

export async function startStaffImpersonation(input: {
  targetCustomerId: string
  targetEmail: string
  targetName: string
}): Promise<{ ok: boolean; session?: StaffImpersonationSession; error?: string }> {
  try {
    const staff = await requireStaffForImpersonation()
    const session: StaffImpersonationSession = {
      staffCustomerId: staff.id,
      staffEmail: staff.email,
      staffName: staffDisplayName(staff),
      targetCustomerId: input.targetCustomerId,
      targetEmail: input.targetEmail,
      targetName: input.targetName || input.targetEmail,
      startedAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 4,
    }

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, encode(session), {
      maxAge: 60 * 60 * 4,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return { ok: true, session }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Could not start impersonation." }
  }
}

export async function stopStaffImpersonation(): Promise<{ ok: boolean }> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "", {
    maxAge: -1,
    path: "/",
  })
  return { ok: true }
}
