"use server"

import "server-only"

const BACKEND =
  process.env.MEDUSA_BACKEND_URL ||
  "https://grillers-medusa-admin-production.up.railway.app"

export async function getPreferences(token: string) {
  try {
    const response = await fetch(
      `${BACKEND}/preferences/${encodeURIComponent(token)}`,
      { cache: "no-store" }
    )
    if (!response.ok) return null
    return (await response.json()) as {
      email_masked: string
      first_name: string
      email_consent: boolean
      topics: Record<string, boolean>
    }
  } catch {
    return null
  }
}

export async function updatePreferences(
  token: string,
  input: { topics?: Record<string, boolean>; unsubscribe_all?: boolean }
): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(
      `${BACKEND}/preferences/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        cache: "no-store",
      }
    )
    return { ok: response.ok }
  } catch {
    return { ok: false }
  }
}
