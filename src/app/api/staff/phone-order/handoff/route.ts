import { verifyStaffCartHandoff } from "@lib/data/staff/order-token"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const payload = verifyStaffCartHandoff(token)
    const target = new URL(`/${payload.countryCode}/checkout`, request.url)
    const response = NextResponse.redirect(target)

    response.cookies.set("_medusa_cart_id", payload.cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return response
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "This staff checkout link is invalid or expired.",
      },
      { status: 400 }
    )
  }
}
