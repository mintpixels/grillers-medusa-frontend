import { gql } from "graphql-request"
import { cachedStrapiRequest } from "@lib/strapi"
import {
  ATLANTA_DELIVERY_ZIP_DAYS,
} from "@lib/util/atlanta-delivery-zips"
import type { AtlantaZipDayConfig } from "@lib/util/eligible-arrival-dates"

const DAY_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

export type AtlantaDeliveryZone = {
  documentId: string
  ZipCode: string
  DeliveryDay: keyof typeof DAY_TO_INDEX
  Weekdays?: number[] | null
  CutoffHourLocal?: number | null
  FreeDeliveryThresholdCents?: number | null
  Rate250PlusCents?: number | null
  Rate150To249Cents?: number | null
  Rate100To149Cents?: number | null
  Rate50To99Cents?: number | null
  Rate0To49Cents?: number | null
  IsActive?: boolean | null
  SortOrder?: number | null
}

export const AtlantaDeliveryZonesQuery = gql`
  query AtlantaDeliveryZones {
    atlantaDeliveryZones(
      filters: { IsActive: { eq: true } }
      sort: ["SortOrder:asc", "ZipCode:asc"]
      pagination: { pageSize: 200 }
    ) {
      documentId
      ZipCode
      DeliveryDay
      Weekdays
      CutoffHourLocal
      FreeDeliveryThresholdCents
      Rate250PlusCents
      Rate150To249Cents
      Rate100To149Cents
      Rate50To99Cents
      Rate0To49Cents
      IsActive
      SortOrder
    }
  }
`

function normalizeWeekdays(zone: AtlantaDeliveryZone) {
  const fromJson = Array.isArray(zone.Weekdays)
    ? zone.Weekdays.filter(
        (day) => Number.isInteger(day) && day >= 0 && day <= 6
      )
    : []
  if (fromJson.length) return fromJson
  const fromDay = DAY_TO_INDEX[zone.DeliveryDay]
  return Number.isInteger(fromDay) ? [fromDay] : []
}

export function zonesToAtlantaZipConfig(
  zones: AtlantaDeliveryZone[]
): Record<string, AtlantaZipDayConfig> {
  return zones.reduce<Record<string, AtlantaZipDayConfig>>((acc, zone) => {
    const zip = String(zone.ZipCode || "").replace(/\D/g, "").slice(0, 5)
    const weekdays = normalizeWeekdays(zone)
    if (zip.length !== 5 || weekdays.length === 0) return acc
    acc[zip] = {
      weekdays,
      cutoffHour: zone.CutoffHourLocal ?? 12,
    }
    return acc
  }, {})
}

export async function getAtlantaDeliveryZones(): Promise<AtlantaDeliveryZone[]> {
  try {
    const data = await cachedStrapiRequest<{
      atlantaDeliveryZones?: AtlantaDeliveryZone[]
    }>("atlanta-delivery-zones", AtlantaDeliveryZonesQuery)
    return data.atlantaDeliveryZones || []
  } catch (error) {
    console.error("Error fetching Atlanta delivery zones:", error)
    return []
  }
}

export async function getAtlantaDeliveryZipConfig(): Promise<
  Record<string, AtlantaZipDayConfig>
> {
  const zones = await getAtlantaDeliveryZones()
  const fromStrapi = zonesToAtlantaZipConfig(zones)
  return Object.keys(fromStrapi).length ? fromStrapi : ATLANTA_DELIVERY_ZIP_DAYS
}
