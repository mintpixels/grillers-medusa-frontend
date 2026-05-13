/**
 * Picks the right Stripe publishable key for the current deploy.
 *
 * The error #63 surfaced — `No such payment_intent: ...; a similar object
 * exists in test mode, but a live mode key was used to make this request`
 * — happens when the Medusa backend creates a test-mode `PaymentIntent`
 * and the frontend tries to confirm it with a live-mode publishable key
 * (or vice versa). For QA we need staging deploys to use Stripe TEST
 * keys so the team can drive checkout with `4242 4242 4242 4242`.
 *
 * Convention (mirrors Vercel's recommended pattern):
 *
 *   - `production` (Vercel production alias) → live publishable key
 *   - everything else (preview, development, local)  → test publishable key
 *
 * Vercel exposes the deploy mode through `NEXT_PUBLIC_VERCEL_ENV`. The
 * unprefixed `VERCEL_ENV` is NOT inlined into the client bundle by
 * Next.js — only `NEXT_PUBLIC_*` env vars are. Reading the unprefixed
 * name from a "use client" module would always be `undefined`, silently
 * routing production traffic into the non-production branch.
 *
 * Vercel sets `NEXT_PUBLIC_VERCEL_ENV` automatically on every Next.js
 * deploy as a "Framework Environment Variable" — no manual config
 * needed.
 *
 * Env vars (set both on Vercel; the helper picks the right one):
 *
 *   - `NEXT_PUBLIC_STRIPE_KEY_LIVE` — `pk_live_...` (production only)
 *   - `NEXT_PUBLIC_STRIPE_KEY_TEST` — `pk_test_...` (preview + dev)
 *   - `NEXT_PUBLIC_STRIPE_KEY`       — legacy single-key var; used as a
 *                                       fallback when neither of the
 *                                       above is set. Keep until Chris
 *                                       migrates both Vercel envs.
 *
 * Safety: this function REFUSES a mode-mismatched key. If the only
 * available value in production is a `pk_test_` key (e.g. the legacy
 * env is still test), it returns `undefined` instead of returning a
 * key that will fail at PaymentIntent confirmation. The downstream
 * payment wrapper renders the "Stripe is not configured" branch in
 * that case, making the misconfig visibly broken instead of silently
 * unable to charge.
 */

type DeployMode = "production" | "preview" | "development"

function getDeployMode(): DeployMode {
  // Prefer the client-safe NEXT_PUBLIC_ alias. Fall back to the
  // unprefixed name for server-only callers (none today, but the
  // module is isomorphic so a future server import won't break).
  const env = (
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    ""
  ).toLowerCase()
  if (env === "production") return "production"
  if (env === "preview") return "preview"
  return "development"
}

function isLiveKey(key: string | undefined): key is string {
  return typeof key === "string" && key.startsWith("pk_live_")
}

function isTestKey(key: string | undefined): key is string {
  return typeof key === "string" && key.startsWith("pk_test_")
}

export function getStripePublishableKey(): string | undefined {
  const mode = getDeployMode()
  const candidates =
    mode === "production"
      ? [
          process.env.NEXT_PUBLIC_STRIPE_KEY_LIVE,
          process.env.NEXT_PUBLIC_STRIPE_KEY,
        ]
      : [
          process.env.NEXT_PUBLIC_STRIPE_KEY_TEST,
          process.env.NEXT_PUBLIC_STRIPE_KEY,
        ]

  for (const key of candidates) {
    if (!key) continue
    // Reject mode-mismatched keys outright so a misconfig surfaces as
    // "Stripe not configured" rather than "PaymentIntent confirm
    // failed". The legacy `NEXT_PUBLIC_STRIPE_KEY` may still be test
    // even after `NEXT_PUBLIC_STRIPE_KEY_LIVE` is configured — this
    // guard makes that transition safe.
    if (mode === "production" && isTestKey(key)) continue
    if (mode !== "production" && isLiveKey(key)) continue
    return key
  }
  return undefined
}

/**
 * Returns a one-line warning when the key resolution has fallen back
 * to an unusable / missing state, OR when both the live and test envs
 * happen to be set and one of them is the wrong mode for this deploy.
 *
 * Components can log this during render so a misconfigured deploy
 * surfaces in the browser console instead of failing silently at
 * PaymentIntent confirm time.
 *
 * Returns null when the key/mode pairing is healthy.
 */
export function getStripeKeyMismatchWarning(
  key: string | undefined
): string | null {
  const mode = getDeployMode()
  // Missing-key case: the production fallback intentionally refuses
  // a test key, so a "key is missing" state can also be a "test key
  // in production" misconfig. Surface this case loudly.
  if (!key) {
    const legacy = process.env.NEXT_PUBLIC_STRIPE_KEY
    if (mode === "production" && isTestKey(legacy)) {
      return (
        "[Stripe] Production deploy has a TEST publishable key in " +
        "NEXT_PUBLIC_STRIPE_KEY — refusing it to prevent silent " +
        "checkout failure. Set NEXT_PUBLIC_STRIPE_KEY_LIVE. (#63)"
      )
    }
    if (mode !== "production" && isLiveKey(legacy)) {
      return (
        "[Stripe] Non-production deploy has a LIVE publishable key in " +
        "NEXT_PUBLIC_STRIPE_KEY — refusing it so test cards work. " +
        "Set NEXT_PUBLIC_STRIPE_KEY_TEST. (#63)"
      )
    }
    return null
  }
  if (mode === "production" && isTestKey(key)) {
    return (
      "[Stripe] Production deploy is using a TEST publishable key — " +
      "orders will fail at PaymentIntent confirmation. Set " +
      "NEXT_PUBLIC_STRIPE_KEY_LIVE. (#63)"
    )
  }
  if (mode !== "production" && isLiveKey(key)) {
    return (
      "[Stripe] Non-production deploy is using a LIVE publishable key — " +
      "Stripe test cards will not work. Set " +
      "NEXT_PUBLIC_STRIPE_KEY_TEST. (#63)"
    )
  }
  return null
}
