import { sdk } from "@lib/config"
import { verifyStaffCartHandoff } from "@lib/data/staff/order-token"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function normalizedEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function metadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key]
  return typeof value === "string" ? value : ""
}

function isStaffPhoneOrderCart(cart: HttpTypes.StoreCart) {
  const metadata = (cart.metadata || {}) as Record<string, unknown>
  return (
    metadata.source === "staff_phone_order" ||
    metadata.staff_phone_order === true ||
    String(metadata.staff_phone_order).toLowerCase() === "true"
  )
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function emitHandoffCartLookupFailure(cartId: string, error: unknown): void {
  const message = errorMessage(error)
  void emitStorefrontOpsAlert({
    alertKind: "staff_handoff_cart_lookup_failed",
    severity: "warn",
    title: "Staff checkout handoff cart lookup failed",
    path: "src/app/api/staff/phone-order/handoff/route.ts",
    source: "medusa-server",
    fingerprint: "staff_handoff:cart_lookup_failed",
    meta: {
      staff_module: "phone_order",
      cart_id: cartId,
      error_message: message.slice(0, 300),
    },
  }).catch(() => {
    // Fail-open: alerting must never block the handoff response.
  })
}

async function retrieveHandoffCart(cartId: string) {
  try {
    const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${cartId}`,
      {
        method: "GET",
        query: {
          fields: "id,email,customer_id,metadata,completed_at",
        },
        cache: "no-store",
      }
    )

    return cart
  } catch (error) {
    emitHandoffCartLookupFailure(cartId, error)
    return null
  }
}

function handoffError(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const payload = verifyStaffCartHandoff(token)
    const cart = await retrieveHandoffCart(payload.cartId)

    if (!cart) {
      return handoffError(
        "This staff checkout link no longer maps to an active cart.",
        410
      )
    }

    if ((cart as any).completed_at) {
      return handoffError(
        "This staff checkout link has already been used.",
        409
      )
    }

    const metadata = (cart.metadata || {}) as Record<string, unknown>
    if (!isStaffPhoneOrderCart(cart)) {
      return handoffError("This cart is not eligible for staff handoff.", 403)
    }

    if (
      metadataString(metadata, "staff_actor_customer_id") !==
      payload.staffCustomerId
    ) {
      return handoffError(
        "This staff checkout link does not match the cart.",
        403
      )
    }

    if (
      normalizedEmail(cart.email) !==
      normalizedEmail(payload.targetCustomerEmail)
    ) {
      return handoffError(
        "This staff checkout link does not match the customer email.",
        403
      )
    }

    const metadataTargetCustomerId = metadataString(
      metadata,
      "staff_selected_customer_id"
    )
    if (
      payload.targetCustomerId &&
      metadataTargetCustomerId !== payload.targetCustomerId
    ) {
      return handoffError(
        "This staff checkout link does not match the customer.",
        403
      )
    }

    const target = new URL(`/${payload.countryCode}/checkout`, request.url)
    const response = NextResponse.redirect(target)

    response.cookies.set("_medusa_cart_id", payload.cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
    response.headers.set("Cache-Control", "no-store")

    return response
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "This staff checkout link is invalid or expired.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
