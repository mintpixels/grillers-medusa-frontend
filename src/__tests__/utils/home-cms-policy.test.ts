import { resolveHomepageCmsPolicies } from "@lib/home-cms-policy"

describe("homepage CMS execution policy", () => {
  it("uses patient bounded reads and log-only telemetry during builds", () => {
    const policy = resolveHomepageCmsPolicies({
      NEXT_PHASE: "phase-production-build",
    })

    expect(policy.home).toEqual({
      isBuildPhase: true,
      timeoutMs: 18_000,
      emitOpsAlerts: false,
    })
    expect(policy.global.timeoutMs).toBe(12_000)
    expect(policy.curated).toEqual({
      isBuildPhase: true,
      timeoutMs: 12_000,
      emitOpsAlerts: false,
    })
  })

  it("keeps shopper runtime reads tight and alerting enabled", () => {
    const policy = resolveHomepageCmsPolicies({
      NEXT_PHASE: "phase-production-server",
    })

    expect(policy.home.timeoutMs).toBe(5000)
    expect(policy.global.timeoutMs).toBe(3000)
    expect(policy.curated.timeoutMs).toBe(4000)
    expect(policy.home.emitOpsAlerts).toBe(true)
    expect(policy.curated.emitOpsAlerts).toBe(true)
  })
})
