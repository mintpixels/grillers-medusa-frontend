"use server"

import "server-only"
import { cookies as nextCookies } from "next/headers"
import {
  DELIVERY_ZIP_COOKIE,
  normalizeDeliveryZip,
} from "@lib/util/delivery-zip"

export async function getDeliveryZipCookie(): Promise<string> {
  try {
    const cookies = await nextCookies()
    return normalizeDeliveryZip(cookies.get(DELIVERY_ZIP_COOKIE)?.value)
  } catch {
    return ""
  }
}
