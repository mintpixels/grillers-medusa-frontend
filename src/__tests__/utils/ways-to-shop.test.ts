import {
  WAYS_TO_SHOP_MISSIONS,
  collectionOccasionsForMission,
  getWaysToShopMission,
  isCollectionOccasion,
  isWaysToShopMissionId,
} from "@lib/content/ways-to-shop"

describe("ways to shop mission model", () => {
  it("defines customer-facing destinations for every mission", () => {
    expect(WAYS_TO_SHOP_MISSIONS).toHaveLength(8)

    for (const mission of WAYS_TO_SHOP_MISSIONS) {
      expect(mission.shopHref).toBe(
        `/collections?mission=${mission.id}#collections-results`
      )
      expect(mission.cookHref).toBe(
        `/recipes?mission=${mission.id}#recipes-results`
      )
      expect(mission.learnHref).toBe(
        `/learn?mission=${mission.id}#learning-path`
      )
      expect(mission.collectionOccasions.length).toBeGreaterThan(0)
      expect(mission.learnLinks).toHaveLength(3)
    }
  })

  it("resolves valid missions and collection occasions only", () => {
    expect(isWaysToShopMissionId("shabbos")).toBe(true)
    expect(getWaysToShopMission("shabbos")?.recipeBucket).toBe("shabbos-table")
    expect(isWaysToShopMissionId("internal-strategy")).toBe(false)
    expect(isCollectionOccasion("stock_up")).toBe(true)
    expect(isCollectionOccasion("qbd")).toBe(false)
  })

  it("maps collection filters from mission first, then occasion fallback", () => {
    expect(collectionOccasionsForMission("grilling")).toEqual([
      "grilling",
      "premium",
    ])
    expect(collectionOccasionsForMission(undefined, "weeknight")).toEqual([
      "weeknight",
    ])
    expect(collectionOccasionsForMission(undefined, "unknown")).toEqual([])
  })
})
