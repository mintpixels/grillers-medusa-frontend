import { resolveCmsExecutionPolicy } from "@lib/util/build-context"

export const HOMEPAGE_CMS_TIMEOUTS = {
  home: { runtimeTimeoutMs: 5000, buildTimeoutMs: 18_000 },
  global: { runtimeTimeoutMs: 3000, buildTimeoutMs: 12_000 },
  curated: { runtimeTimeoutMs: 4000, buildTimeoutMs: 12_000 },
} as const

export function resolveHomepageCmsPolicies(
  env: Record<string, string | undefined> = process.env
) {
  return {
    home: resolveCmsExecutionPolicy({ ...HOMEPAGE_CMS_TIMEOUTS.home, env }),
    global: resolveCmsExecutionPolicy({
      ...HOMEPAGE_CMS_TIMEOUTS.global,
      env,
    }),
    curated: resolveCmsExecutionPolicy({
      ...HOMEPAGE_CMS_TIMEOUTS.curated,
      env,
    }),
  }
}
