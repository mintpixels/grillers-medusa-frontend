import { transferCart } from "@lib/data/customer"
import { sdk } from "@lib/config"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "@lib/data/cookies"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { revalidateTag } from "next/cache"

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    },
    client: {
      fetch: jest.fn(),
    },
    store: {
      cart: {
        create: jest.fn(),
        createLineItem: jest.fn(),
        transferCart: jest.fn(),
      },
      customer: {
        create: jest.fn(),
        createAddress: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(),
  getCacheTag: jest.fn(),
  getCartId: jest.fn(),
  getStaffImpersonationCartId: jest.fn(),
  removeAuthToken: jest.fn(),
  removeCartId: jest.fn(),
  setAuthToken: jest.fn(),
  setCartId: jest.fn(),
}))

jest.mock("@lib/data/staff/session-cookie", () => ({
  clearStaffImpersonationCookie: jest.fn(),
  readStaffImpersonationCookie: jest.fn(),
}))

jest.mock("@lib/data/staff/admin", () => ({
  adminFetch: jest.fn(),
  appendStaffAuditLog: (metadata: Record<string, unknown> = {}, entry: any) => ({
    ...metadata,
    staff_audit_log: JSON.stringify([entry]),
  }),
  retrieveAdminCustomer: jest.fn(),
  staffAuditFields: (_session: any, action: string, extra = {}) => ({
    staff_action: action,
    ...extra,
  }),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockedSdk = sdk as jest.Mocked<typeof sdk>
const mockedClientFetch = mockedSdk.client.fetch as jest.Mock
const mockedTransferCart = mockedSdk.store.cart.transferCart as jest.Mock
const mockedCreateCart = mockedSdk.store.cart.create as jest.Mock
const mockedCreateLineItem = mockedSdk.store.cart.createLineItem as jest.Mock
const mockedGetAuthHeaders = getAuthHeaders as jest.MockedFunction<
  typeof getAuthHeaders
>
const mockedGetCacheTag = getCacheTag as jest.MockedFunction<typeof getCacheTag>
const mockedGetCartId = getCartId as jest.MockedFunction<typeof getCartId>
const mockedRemoveCartId = removeCartId as jest.MockedFunction<
  typeof removeCartId
>
const mockedSetCartId = setCartId as jest.MockedFunction<typeof setCartId>
const mockedRevalidateTag = revalidateTag as jest.MockedFunction<
  typeof revalidateTag
>
const mockedEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("cart transfer recovery alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCartId.mockResolvedValue("cart_broken")
    mockedGetAuthHeaders.mockResolvedValue({ authorization: "Bearer test" })
    mockedGetCacheTag.mockImplementation(async (tag) => tag)
  })

  it("alerts when transfer recovery cannot read the broken guest cart", async () => {
    mockedTransferCart.mockRejectedValueOnce(
      new Error("transfer failed for cart_broken")
    )
    mockedClientFetch.mockRejectedValueOnce(
      new Error("read failed for shopper@example.com and cart_broken")
    )

    await transferCart()

    expect(mockedRemoveCartId).toHaveBeenCalled()
    expect(mockedRevalidateTag).toHaveBeenCalledWith("carts")
    expect(mockedEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cart_transfer_recovery_failed",
        severity: "warn",
        title: "Cart transfer recovery could not read the guest cart",
        fingerprint: "cart_transfer_recovery:cart_read_failed",
        meta: expect.objectContaining({
          cart_recovery_stage: "cart_read_failed",
          cart_id: "cart_broken",
          error_message: "read failed for [email] and [id]",
        }),
      })
    )
  })

  it("alerts when transfer recovery cannot preserve items in the fresh cart", async () => {
    mockedTransferCart.mockRejectedValueOnce(
      new Error("transfer failed for cart_broken")
    )
    mockedClientFetch.mockResolvedValueOnce({
      cart: {
        region_id: "reg_123",
        items: [
          { variant_id: "variant_123", quantity: 2 },
          { quantity: 1 },
        ],
      },
    })
    mockedCreateCart.mockResolvedValueOnce({ cart: { id: "cart_fresh" } })
    mockedCreateLineItem.mockRejectedValueOnce(
      new Error("line li_123 failed for shopper@example.com")
    )

    await transferCart()

    expect(mockedSetCartId).toHaveBeenCalledWith("cart_fresh")
    expect(mockedCreateLineItem).toHaveBeenCalledWith(
      "cart_fresh",
      { variant_id: "variant_123", quantity: 2 },
      {},
      { authorization: "Bearer test" }
    )
    expect(mockedEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cart_transfer_recovery_failed",
        title: "Cart transfer recovery could not preserve cart items",
        fingerprint: "cart_transfer_recovery:item_preservation_failed",
        meta: expect.objectContaining({
          cart_recovery_stage: "item_preservation_failed",
          cart_id: "cart_broken",
          line_item_count: 1,
          has_region_id: true,
          error_message: "line [id] failed for [email]",
        }),
      })
    )
  })

  it("alerts when transfer recovery has items but no region for a replacement cart", async () => {
    mockedTransferCart.mockRejectedValueOnce(
      new Error("transfer failed for cart_broken")
    )
    mockedClientFetch.mockResolvedValueOnce({
      cart: {
        region_id: null,
        items: [{ variant_id: "variant_123", quantity: 2 }],
      },
    })

    await transferCart()

    expect(mockedCreateCart).not.toHaveBeenCalled()
    expect(mockedEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cart_transfer_recovery_failed",
        title: "Cart transfer recovery could not recreate a customer cart",
        fingerprint: "cart_transfer_recovery:missing_region_for_recovery",
        meta: expect.objectContaining({
          cart_recovery_stage: "missing_region_for_recovery",
          cart_id: "cart_broken",
          line_item_count: 1,
          has_region_id: false,
          error_message: null,
        }),
      })
    )
  })
})
