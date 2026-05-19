"use client"

import { useMemo, useState, useTransition } from "react"
import type { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import Button from "@modules/common/components/button"
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { getStripePublishableKey } from "@lib/util/stripe-key"
import {
  completeStaffPhoneOrder,
  createStaffCustomer,
  getStaffCustomerContext,
  getStaffLegacyOrderContext,
  prepareStaffPhoneOrder,
  searchStaffCustomers,
  searchStaffProducts,
  saveStaffCustomerAddress,
  updateStaffCustomerProfile,
  type StaffAddressInput,
  type StaffCompleteOrderResult,
  type StaffCustomerContext,
  type StaffCustomerSummary,
  type StaffOrderLineInput,
  type StaffPaymentMode,
  type StaffPrepareOrderResult,
  type StaffProductSearchResult,
} from "@lib/data/staff/order-entry"
import { isSuperAdminCustomer } from "@lib/util/staff-access"
import {
  startStaffImpersonation,
  stopStaffImpersonation,
} from "@lib/data/staff/impersonation"
import type { StaffImpersonationSession } from "@lib/data/staff/impersonation-types"
import StaffOrderExceptionConsole from "@modules/staff/components/order-exception-console"
import StaffTeamAccessConsole from "@modules/staff/components/team-access-console"

type Props = {
  countryCode: string
  staffCustomer: HttpTypes.StoreCustomer
  initialImpersonation: StaffImpersonationSession | null
}

const stripeKey = getStripePublishableKey()
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

type DraftCustomer = {
  id?: string
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
}

const emptyAddress: StaffAddressInput = {
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  postalCode: "",
  countryCode: "us",
  phone: "",
}

function draftFromCustomer(customer: StaffCustomerSummary): DraftCustomer {
  return {
    id: isSyntheticCustomerId(customer.id) ? undefined : customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    company: customer.company,
  }
}

function addressFromCustomer(
  customer: StaffCustomerSummary
): StaffAddressInput {
  return customer.defaultAddress
    ? { ...emptyAddress, ...customer.defaultAddress }
    : {
        ...emptyAddress,
        firstName: customer.firstName,
        lastName: customer.lastName,
        company: customer.company,
        phone: customer.phone,
      }
}

function isSyntheticCustomerId(id?: string) {
  return Boolean(id?.startsWith("order:") || id?.startsWith("legacy-order:"))
}

function legacySyntheticOrderId(customer: StaffCustomerSummary) {
  if (customer.matchedLegacyOrderId) return customer.matchedLegacyOrderId
  if (customer.id?.startsWith("legacy-order:")) {
    return customer.id.slice("legacy-order:".length)
  }
  return ""
}

function formatPrice(value?: number, currencyCode = "usd") {
  if (typeof value !== "number") return "Price unavailable"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(value)
}

function formatDate(value?: string) {
  if (!value) return "Unknown date"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function sourceLabel(source: StaffCustomerSummary["source"]) {
  if (source === "legacy_order") return "Legacy order"
  if (source === "order") return "Order"
  return "Customer"
}

function fieldClass() {
  return "min-h-[44px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-maison-neue text-Charcoal outline-none transition focus:border-Gold focus:ring-1 focus:ring-Gold disabled:cursor-not-allowed disabled:bg-SilverPlate/40 disabled:text-Charcoal/40"
}

function labelClass() {
  return "text-xs font-maison-neue-mono uppercase text-Charcoal/55"
}

function StaffChargeCard({
  result,
  billingAddress,
  onComplete,
}: {
  result: StaffPrepareOrderResult
  billingAddress: StaffAddressInput
  onComplete: (result: StaffCompleteOrderResult) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [isCharging, startTransition] = useTransition()

  function chargeCard() {
    if (!stripe || !elements || !result.paymentClientSecret || !result.cartId) {
      setCardError("Payment form is not ready.")
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      setCardError("Card field is not ready.")
      return
    }

    startTransition(async () => {
      const payment = await stripe.confirmCardPayment(
        result.paymentClientSecret!,
        {
          payment_method: {
            card,
            billing_details: {
              name: [billingAddress.firstName, billingAddress.lastName]
                .filter(Boolean)
                .join(" "),
              email: result.cart?.email || undefined,
              phone: billingAddress.phone || undefined,
              address: {
                line1: billingAddress.address1 || undefined,
                line2: billingAddress.address2 || undefined,
                city: billingAddress.city || undefined,
                state: billingAddress.province || undefined,
                postal_code: billingAddress.postalCode || undefined,
                country: billingAddress.countryCode || undefined,
              },
            },
          },
        }
      )

      if (payment.error) {
        setCardError(
          payment.error.message || "Stripe could not authorize the card."
        )
        return
      }

      onComplete(await completeStaffPhoneOrder(result.cartId!))
    })
  }

  return (
    <div className="mt-4 rounded-md border border-Gold/35 bg-Gold/10 p-4">
      <p className="mb-2 text-sm font-maison-neue font-semibold text-Charcoal">
        Card collection
      </p>
      <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
        <CardElement
          onChange={(event) => {
            setCardComplete(event.complete)
            setCardError(event.error?.message || null)
          }}
        />
      </div>
      {cardError && (
        <p className="mt-2 text-sm font-maison-neue text-red-700">
          {cardError}
        </p>
      )}
      <Button
        className="mt-3 min-h-[44px] w-full rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
        disabled={!cardComplete || isCharging}
        isLoading={isCharging}
        onClick={chargeCard}
        type="button"
      >
        Charge Card and Place Order
      </Button>
    </div>
  )
}

export default function PhoneOrderCopilot({
  countryCode,
  staffCustomer,
  initialImpersonation,
}: Props) {
  const router = useRouter()
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<
    StaffCustomerSummary[]
  >([])
  const [selectedContext, setSelectedContext] =
    useState<StaffCustomerContext | null>(null)
  const [draftCustomer, setDraftCustomer] = useState<DraftCustomer>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
  })
  const [shippingAddress, setShippingAddress] =
    useState<StaffAddressInput>(emptyAddress)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [customerVerified, setCustomerVerified] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [productResults, setProductResults] = useState<
    StaffProductSearchResult[]
  >([])
  const [lines, setLines] = useState<StaffOrderLineInput[]>([])
  const [fulfillmentType, setFulfillmentType] = useState<
    "plant_pickup" | "atlanta_delivery" | "ups_shipping" | "southeast_pickup"
  >("plant_pickup")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTimeWindow, setScheduledTimeWindow] = useState("")
  const [paymentMode, setPaymentMode] =
    useState<StaffPaymentMode>("collect_card_now")
  const [paymentConsent, setPaymentConsent] = useState(false)
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [orderNotes, setOrderNotes] = useState("")
  const [substitutionPreference, setSubstitutionPreference] = useState("")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [prepareResult, setPrepareResult] =
    useState<StaffPrepareOrderResult | null>(null)
  const [completeResult, setCompleteResult] =
    useState<StaffCompleteOrderResult | null>(null)
  const [impersonation, setImpersonation] =
    useState<StaffImpersonationSession | null>(initialImpersonation)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeWorkspace, setActiveWorkspace] = useState<
    "phone_order" | "exceptions" | "team_access"
  >("phone_order")
  const canManageTeamAccess = isSuperAdminCustomer(staffCustomer)
  const hasSelectedCustomer = Boolean(draftCustomer.id)
  const hasOrderLines = lines.length > 0
  const canEditShippingAddress = hasSelectedCustomer
  const canEditOrderControls = hasSelectedCustomer && hasOrderLines
  const prepareDisabled =
    !hasSelectedCustomer ||
    !hasOrderLines ||
    !customerVerified ||
    (paymentMode === "collect_card_now" && !paymentConsent)

  const staffName = useMemo(
    () =>
      [staffCustomer.first_name, staffCustomer.last_name]
        .filter(Boolean)
        .join(" ") || staffCustomer.email,
    [staffCustomer]
  )

  function updateDraftCustomer(patch: Partial<DraftCustomer>) {
    setDraftCustomer((current) => ({ ...current, ...patch }))
  }

  function updateShippingAddress(patch: Partial<StaffAddressInput>) {
    setShippingAddress((current) => ({ ...current, ...patch }))
  }

  function runCustomerSearch() {
    setError(null)
    startTransition(async () => {
      try {
        const results = await searchStaffCustomers(customerQuery)
        setCustomerResults(results)
        if (!results.length) setStatus("No matching customers found.")
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function selectCustomer(customer: StaffCustomerSummary) {
    setError(null)
    setStatus(null)
    setCheckoutUrl(null)
    setDraftCustomer(draftFromCustomer(customer))
    setShippingAddress(addressFromCustomer(customer))
    setCustomerVerified(false)
    if (isSyntheticCustomerId(customer.id)) {
      const legacyOrderId = legacySyntheticOrderId(customer)
      if (!legacyOrderId) {
        setSelectedContext(null)
        return
      }

      startTransition(async () => {
        try {
          const context = await getStaffLegacyOrderContext(legacyOrderId)
          setSelectedContext(context)
          setDraftCustomer(draftFromCustomer(context))
          setShippingAddress(addressFromCustomer(context))
        } catch (err) {
          setSelectedContext(null)
          setError(err instanceof Error ? err.message : String(err))
        }
      })
      return
    }

    startTransition(async () => {
      try {
        const context = await getStaffCustomerContext(customer.id, {
          includeLegacyOrderId: customer.matchedLegacyOrderId,
        })
        setSelectedContext(context)
        setDraftCustomer(draftFromCustomer(context))
        setShippingAddress(addressFromCustomer(context))
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function createCustomer() {
    setError(null)
    setCheckoutUrl(null)
    startTransition(async () => {
      try {
        const customer = await createStaffCustomer(draftCustomer)
        setStatus("Customer profile created.")
        selectCustomer(customer)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function saveCustomerProfile() {
    if (!draftCustomer.id) return
    setError(null)
    startTransition(async () => {
      const result = await updateStaffCustomerProfile({
        customerId: draftCustomer.id!,
        ...draftCustomer,
      })
      if (!result.ok || !result.customer) {
        setError(result.error || "Could not save customer profile.")
        return
      }
      setSelectedContext(result.customer)
      setDraftCustomer(draftFromCustomer(result.customer))
      setStatus("Customer profile saved with staff audit metadata.")
    })
  }

  function saveCustomerAddress() {
    if (!draftCustomer.id) return
    setError(null)
    startTransition(async () => {
      const result = await saveStaffCustomerAddress({
        customerId: draftCustomer.id!,
        address: shippingAddress,
      })
      if (!result.ok || !result.customer) {
        setError(result.error || "Could not save customer address.")
        return
      }
      setSelectedContext(result.customer)
      setShippingAddress(addressFromCustomer(result.customer))
      setStatus("Customer address saved with staff audit metadata.")
    })
  }

  function beginImpersonation() {
    if (!draftCustomer.id) return
    setError(null)
    startTransition(async () => {
      const result = await startStaffImpersonation({
        targetCustomerId: draftCustomer.id!,
        targetEmail: draftCustomer.email,
        targetName:
          [draftCustomer.firstName, draftCustomer.lastName]
            .filter(Boolean)
            .join(" ") || draftCustomer.email,
      })
      if (!result.ok || !result.session) {
        setError(result.error || "Could not enter customer context.")
        return
      }
      setImpersonation(result.session)
      setStatus(`Now acting as ${result.session.targetName}.`)
      router.refresh()
    })
  }

  function endImpersonation() {
    startTransition(async () => {
      await stopStaffImpersonation()
      setImpersonation(null)
      setStatus("Exited customer context.")
      router.refresh()
    })
  }

  function runProductSearch() {
    setError(null)
    startTransition(async () => {
      try {
        const results = await searchStaffProducts(productQuery, countryCode)
        setProductResults(results)
        if (!results.length) setStatus("No matching products found.")
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function addProduct(product: StaffProductSearchResult) {
    setLines((current) => {
      const existing = current.find(
        (line) => line.variantId === product.variantId
      )
      if (existing) {
        return current.map((line) =>
          line.variantId === product.variantId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        )
      }
      return [
        ...current,
        {
          variantId: product.variantId,
          quantity: 1,
          title:
            product.variantTitle && product.variantTitle !== "Default"
              ? `${product.title} - ${product.variantTitle}`
              : product.title,
          sku: product.sku,
        },
      ]
    })
  }

  function addLegacyItem(
    item: StaffCustomerContext["legacyOrders"][number]["items"][number]
  ) {
    if (!item.variantId) return

    const quantity = Math.max(1, Math.round(Number(item.quantity || 1)))
    setLines((current) => {
      const existing = current.find((line) => line.variantId === item.variantId)
      if (existing) {
        return current.map((line) =>
          line.variantId === item.variantId
            ? { ...line, quantity: line.quantity + quantity }
            : line
        )
      }

      return [
        ...current,
        {
          variantId: item.variantId!,
          quantity,
          title: item.title,
          sku: item.sku,
          source: "legacy_order_history",
          legacyPurchaseHistoryKey: item.purchaseHistoryKey,
          legacyOrderId: item.legacyOrderId,
          legacyOrderLineId: item.id,
        },
      ]
    })
  }

  function updateLineQuantity(variantId: string, quantity: number) {
    if (quantity <= 0) {
      setLines((current) =>
        current.filter((line) => line.variantId !== variantId)
      )
      return
    }
    setLines((current) =>
      current.map((line) =>
        line.variantId === variantId ? { ...line, quantity } : line
      )
    )
  }

  function prepareOrder() {
    setError(null)
    setStatus(null)
    setCheckoutUrl(null)
    setPrepareResult(null)
    setCompleteResult(null)
    startTransition(async () => {
      try {
        const result = await prepareStaffPhoneOrder({
          countryCode,
          customer: draftCustomer,
          shippingAddress,
          sameAsShipping,
          lines,
          fulfillmentType,
          scheduledDate,
          scheduledTimeWindow,
          customerVerified,
          paymentMode,
          paymentConsent,
          sendConfirmation,
          orderNotes,
          substitutionPreference,
          deliveryInstructions,
        })

        if (!result.ok) {
          throw new Error(result.error || "Could not prepare phone order.")
        }

        setPrepareResult(result)
        setCheckoutUrl(result.checkoutUrl || null)
        setStatus(
          paymentMode === "collect_card_now"
            ? "Payment session prepared. Enter the customer's card with consent."
            : result.confirmationSent
            ? "Checkout link prepared and emailed."
            : "Checkout link prepared."
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 large:flex-row large:items-start large:justify-between">
          <div>
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Staff console
            </p>
            <h1 className="mt-2 text-h3 font-gyst font-bold text-Charcoal">
              Help a customer
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-maison-neue text-Charcoal/60">
              Search for a customer, enter their account context, then use the
              storefront exactly as they would. Staff actions remain auditable.
            </p>
          </div>
          <div className="rounded-md border border-Gold/35 bg-Gold/10 px-4 py-3">
            <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
              Signed in
            </p>
            <p className="mt-1 text-sm font-maison-neue font-semibold text-Charcoal">
              {staffName}
            </p>
          </div>
        </div>
      </div>

      {impersonation && (
        <div className="rounded-md border border-Gold/40 bg-Gold/10 px-4 py-3">
          <div className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
            <div>
              <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                Acting as {impersonation.targetName}
              </p>
              <p className="text-sm font-maison-neue text-Charcoal/60">
                Storefront, account, cart, and phone-order actions are audited
                to {impersonation.staffName}.
              </p>
            </div>
            <Button
              className="min-h-[40px] rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
              isLoading={isPending}
              onClick={endImpersonation}
              type="button"
            >
              Exit Context
            </Button>
          </div>
        </div>
      )}

      {(error || status) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-maison-neue ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || status}
        </div>
      )}

      <div
        className={`grid gap-3 ${
          canManageTeamAccess ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <button
          className={`rounded-lg border p-5 text-left transition ${
            activeWorkspace === "phone_order"
              ? "border-Charcoal bg-Charcoal text-white"
              : "border-gray-200 bg-white text-Charcoal hover:border-Gold/50"
          }`}
          onClick={() => setActiveWorkspace("phone_order")}
          type="button"
        >
          <span className="block text-xs font-maison-neue-mono uppercase opacity-70">
            Customer context
          </span>
          <span className="mt-2 block text-xl font-gyst font-bold">
            Enter account
          </span>
          <span className="mt-2 block text-sm font-maison-neue opacity-75">
            Find the customer, enter their account, then shop, reorder, edit
            addresses, and check out from the customer-facing flow.
          </span>
        </button>
        <button
          className={`rounded-lg border p-5 text-left transition ${
            activeWorkspace === "exceptions"
              ? "border-Charcoal bg-Charcoal text-white"
              : "border-gray-200 bg-white text-Charcoal hover:border-Gold/50"
          }`}
          onClick={() => setActiveWorkspace("exceptions")}
          type="button"
        >
          <span className="block text-xs font-maison-neue-mono uppercase opacity-70">
            Existing order
          </span>
          <span className="mt-2 block text-xl font-gyst font-bold">
            Order support
          </span>
          <span className="mt-2 block text-sm font-maison-neue opacity-75">
            Search an order, review payment and fulfillment state, then record a
            refund, credit, shipping exception, or note.
          </span>
        </button>
        {canManageTeamAccess && (
          <button
            className={`rounded-lg border p-5 text-left transition ${
              activeWorkspace === "team_access"
                ? "border-Charcoal bg-Charcoal text-white"
                : "border-gray-200 bg-white text-Charcoal hover:border-Gold/50"
            }`}
            onClick={() => setActiveWorkspace("team_access")}
            type="button"
          >
            <span className="block text-xs font-maison-neue-mono uppercase opacity-70">
              Super admin
            </span>
            <span className="mt-2 block text-xl font-gyst font-bold">
              Team access
            </span>
            <span className="mt-2 block text-sm font-maison-neue opacity-75">
              Search customer accounts, make staff members, promote super
              admins, and audit every permission change.
            </span>
          </button>
        )}
      </div>

      {activeWorkspace === "team_access" && canManageTeamAccess ? (
        <StaffTeamAccessConsole />
      ) : activeWorkspace === "phone_order" ? (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid gap-6 large:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Customer lookup
                </p>
                <h2 className="mt-1 text-2xl font-gyst font-bold text-Charcoal">
                  Enter a customer account
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-maison-neue text-Charcoal/60">
                  Search by name, email, phone, or legacy order. Pick the
                  customer, then enter their account context. From there staff
                  can use the same account, cart, address, reorder, and checkout
                  surfaces the customer uses.
                </p>

                <div className="mt-5 flex flex-col gap-3 small:flex-row small:items-end">
                  <label className="flex flex-1 flex-col gap-1">
                    <span className={labelClass()}>Customer search</span>
                    <input
                      className={fieldClass()}
                      value={customerQuery}
                      onChange={(event) => setCustomerQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") runCustomerSearch()
                      }}
                      placeholder="Name, email, phone, or order number"
                      type="search"
                    />
                  </label>
                  <Button
                    className="min-h-[44px] rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                    isLoading={isPending}
                    onClick={runCustomerSearch}
                    type="button"
                  >
                    Search
                  </Button>
                </div>

                {customerResults.length > 0 && (
                  <div className="mt-5 divide-y rounded-md border border-gray-100">
                    {customerResults.map((customer) => (
                      <button
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-SilverPlate/40"
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-maison-neue font-semibold text-Charcoal">
                            {[customer.firstName, customer.lastName]
                              .filter(Boolean)
                              .join(" ") || customer.email}
                          </span>
                          <span className="block break-words text-xs font-maison-neue text-Charcoal/55">
                            {[
                              customer.email,
                              customer.phone,
                              customer.matchedLegacyOrderDisplayId
                                ? `Legacy ${customer.matchedLegacyOrderDisplayId}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" | ")}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-maison-neue-mono uppercase text-Charcoal/45">
                          {sourceLabel(customer.source)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="rounded-md border border-Gold/30 bg-Gold/10 p-4">
                <p className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
                  Selected customer
                </p>
                {draftCustomer.id ? (
                  <>
                    <h3 className="mt-2 text-xl font-gyst font-bold text-Charcoal">
                      {[draftCustomer.firstName, draftCustomer.lastName]
                        .filter(Boolean)
                        .join(" ") || draftCustomer.email}
                    </h3>
                    <p className="mt-1 break-words text-sm font-maison-neue text-Charcoal/60">
                      {draftCustomer.email}
                    </p>
                    <Button
                      className="mt-4 min-h-[44px] w-full rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                      isLoading={isPending}
                      onClick={beginImpersonation}
                      type="button"
                    >
                      {impersonation?.targetCustomerId === draftCustomer.id
                        ? "Context Active"
                        : "Enter Account Context"}
                    </Button>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-maison-neue text-Charcoal/60">
                    Search and select a storefront customer to begin. Legacy
                    records without a linked storefront account can be reviewed
                    in Order Support, but cannot be impersonated.
                  </p>
                )}
              </aside>
            </div>
          </section>

          <div className="hidden" aria-hidden="true">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Customer profile
                </p>
                <h2 className="text-xl font-gyst font-bold text-Charcoal">
                  Find or create the customer
                </h2>
                <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
                  Search fills the editable profile fields below. Save Customer
                  persists profile changes with a staff audit entry.
                </p>
              </div>
              <div className="mb-4 flex flex-col gap-3 small:flex-row small:items-end">
                <label className="flex flex-1 flex-col gap-1">
                  <span className={labelClass()}>Customer search</span>
                  <input
                    className={fieldClass()}
                    value={customerQuery}
                    onChange={(event) => setCustomerQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") runCustomerSearch()
                    }}
                    type="search"
                  />
                </label>
                <Button
                  className="min-h-[44px] rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                  isLoading={isPending}
                  onClick={runCustomerSearch}
                  type="button"
                >
                  Search
                </Button>
              </div>

              {customerResults.length > 0 && (
                <div className="mb-5 divide-y rounded-md border border-gray-100">
                  {customerResults.map((customer) => (
                    <button
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-SilverPlate/40"
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      type="button"
                    >
                      <span>
                        <span className="block text-sm font-maison-neue font-semibold text-Charcoal">
                          {[customer.firstName, customer.lastName]
                            .filter(Boolean)
                            .join(" ") || customer.email}
                        </span>
                        <span className="block text-xs font-maison-neue text-Charcoal/55">
                          {[
                            customer.email,
                            customer.matchedLegacyOrderDisplayId
                              ? `Legacy ${customer.matchedLegacyOrderDisplayId}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </span>
                      </span>
                      <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/45">
                        {sourceLabel(customer.source)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Email</span>
                  <input
                    className={fieldClass()}
                    type="email"
                    value={draftCustomer.email}
                    onChange={(event) =>
                      updateDraftCustomer({ email: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Phone</span>
                  <input
                    className={fieldClass()}
                    value={draftCustomer.phone}
                    onChange={(event) =>
                      updateDraftCustomer({ phone: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>First name</span>
                  <input
                    className={fieldClass()}
                    value={draftCustomer.firstName}
                    onChange={(event) =>
                      updateDraftCustomer({ firstName: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Last name</span>
                  <input
                    className={fieldClass()}
                    value={draftCustomer.lastName}
                    onChange={(event) =>
                      updateDraftCustomer({ lastName: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className={labelClass()}>Company</span>
                  <input
                    className={fieldClass()}
                    value={draftCustomer.company}
                    onChange={(event) =>
                      updateDraftCustomer({ company: event.target.value })
                    }
                  />
                </label>
              </div>

              {!draftCustomer.id && (
                <Button
                  className="mt-4 min-h-[44px] rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                  isLoading={isPending}
                  onClick={createCustomer}
                  type="button"
                >
                  Create Customer
                </Button>
              )}

              {draftCustomer.id && (
                <div className="mt-4 grid gap-3 small:grid-cols-2">
                  <Button
                    className="min-h-[44px] rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                    isLoading={isPending}
                    onClick={saveCustomerProfile}
                    type="button"
                  >
                    Save Customer
                  </Button>
                  <Button
                    className="min-h-[44px] rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                    isLoading={isPending}
                    onClick={beginImpersonation}
                    type="button"
                  >
                    {impersonation?.targetCustomerId === draftCustomer.id
                      ? "Context Active"
                      : "Enter Account Context"}
                  </Button>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Shipping address
                </p>
                <h2 className="text-xl font-gyst font-bold text-Charcoal">
                  Address for this order
                </h2>
                <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
                  Select or create the customer first. Their saved address
                  loads here when available. Edits apply to this order only
                  unless you explicitly save them back to the customer account.
                </p>
              </div>
              {!canEditShippingAddress && (
                <div className="mb-4 rounded-md border border-Gold/30 bg-Gold/10 px-4 py-3">
                  <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                    Address unlocks after customer selection.
                  </p>
                  <p className="mt-1 text-sm font-maison-neue text-Charcoal/60">
                    Search or create a customer above, then confirm the shipping
                    address for this specific phone order.
                  </p>
                </div>
              )}
              <fieldset
                className="grid gap-3 md:grid-cols-2"
                disabled={!canEditShippingAddress}
              >
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>First name</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.firstName}
                    onChange={(event) =>
                      updateShippingAddress({ firstName: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Last name</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.lastName}
                    onChange={(event) =>
                      updateShippingAddress({ lastName: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className={labelClass()}>Address 1</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.address1}
                    onChange={(event) =>
                      updateShippingAddress({ address1: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className={labelClass()}>Address 2</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.address2 || ""}
                    onChange={(event) =>
                      updateShippingAddress({ address2: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>City</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.city}
                    onChange={(event) =>
                      updateShippingAddress({ city: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>State</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.province}
                    onChange={(event) =>
                      updateShippingAddress({ province: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>ZIP</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.postalCode}
                    onChange={(event) =>
                      updateShippingAddress({ postalCode: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass()}>Phone</span>
                  <input
                    className={fieldClass()}
                    value={shippingAddress.phone || ""}
                    onChange={(event) =>
                      updateShippingAddress({ phone: event.target.value })
                    }
                  />
                </label>
              </fieldset>
              {draftCustomer.id && (
                <Button
                  className="mt-4 min-h-[44px] rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                  isLoading={isPending}
                  onClick={saveCustomerAddress}
                  type="button"
                >
                  Save Address to Customer
                </Button>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Order items
                </p>
                <h2 className="text-xl font-gyst font-bold text-Charcoal">
                  Add products
                </h2>
                <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
                  Product results add line items to this staff-prepared cart.
                  Quantities are edited in the order panel.
                </p>
              </div>
              <div className="mb-4 flex flex-col gap-3 small:flex-row small:items-end">
                <label className="flex flex-1 flex-col gap-1">
                  <span className={labelClass()}>Product search</span>
                  <input
                    className={fieldClass()}
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") runProductSearch()
                    }}
                    type="search"
                  />
                </label>
                <Button
                  className="min-h-[44px] rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                  isLoading={isPending}
                  onClick={runProductSearch}
                  type="button"
                >
                  Search
                </Button>
              </div>

              {productResults.length > 0 && (
                <div className="divide-y rounded-md border border-gray-100">
                  {productResults.map((product) => (
                    <button
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-SilverPlate/40"
                      key={product.variantId}
                      onClick={() => addProduct(product)}
                      type="button"
                    >
                      <span>
                        <span className="block text-sm font-maison-neue font-semibold text-Charcoal">
                          {product.title}
                        </span>
                        <span className="block text-xs font-maison-neue text-Charcoal/55">
                          {[product.variantTitle, product.sku]
                            .filter(Boolean)
                            .join(" | ")}
                        </span>
                      </span>
                      <span className="text-sm font-maison-neue text-Charcoal">
                        {formatPrice(
                          product.calculatedAmount,
                          product.currencyCode
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  Staff-prepared cart
                </p>
                <h2 className="text-xl font-gyst font-bold text-Charcoal">
                  Order controls
                </h2>
                <p className="mt-1 text-sm font-maison-neue text-Charcoal/55">
                  These fields apply to this order only. They unlock after a
                  customer and at least one product are selected, then preparing
                  payment creates the staff cart.
                </p>
              </div>
              {!canEditOrderControls && (
                <div className="mb-4 rounded-md border border-Gold/30 bg-Gold/10 px-4 py-3">
                  <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                    Build the draft before choosing fulfillment.
                  </p>
                  <div className="mt-3 space-y-2 text-sm font-maison-neue text-Charcoal/70">
                    <div className="flex items-center justify-between gap-3">
                      <span>Customer selected</span>
                      <span className="font-semibold text-Charcoal">
                        {hasSelectedCustomer ? "Done" : "Needed"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Products added</span>
                      <span className="font-semibold text-Charcoal">
                        {hasOrderLines ? "Done" : "Needed"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Order verified</span>
                      <span className="font-semibold text-Charcoal">
                        {customerVerified ? "Done" : "After items"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {lines.length ? (
                <div className="divide-y border-y border-gray-100">
                  {lines.map((line) => (
                    <div className="py-3" key={line.variantId}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                            {line.title}
                          </p>
                          {line.sku && (
                            <p className="text-xs font-maison-neue text-Charcoal/50">
                              {line.sku}
                            </p>
                          )}
                        </div>
                        <input
                          aria-label={`Quantity for ${line.title}`}
                          className="h-10 w-20 rounded-md border border-gray-200 px-2 text-center text-sm"
                          min={0}
                          type="number"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLineQuantity(
                              line.variantId,
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-maison-neue text-Charcoal/55">
                  No products added yet.
                </p>
              )}

              {canEditOrderControls ? (
                <>
                  <fieldset className="mt-4 space-y-3">
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Fulfillment</span>
                      <select
                        className={fieldClass()}
                        value={fulfillmentType}
                        onChange={(event) =>
                          setFulfillmentType(
                            event.target.value as typeof fulfillmentType
                          )
                        }
                      >
                        <option value="plant_pickup">Plant pickup</option>
                        <option value="atlanta_delivery">
                          Atlanta delivery
                        </option>
                        <option value="southeast_pickup">
                          Southeast pickup
                        </option>
                        <option value="ups_shipping">UPS shipping</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Scheduled date</span>
                      <input
                        className={fieldClass()}
                        type="date"
                        value={scheduledDate}
                        onChange={(event) =>
                          setScheduledDate(event.target.value)
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Time window</span>
                      <input
                        className={fieldClass()}
                        value={scheduledTimeWindow}
                        onChange={(event) =>
                          setScheduledTimeWindow(event.target.value)
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Substitutions</span>
                      <input
                        className={fieldClass()}
                        value={substitutionPreference}
                        onChange={(event) =>
                          setSubstitutionPreference(event.target.value)
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Delivery notes</span>
                      <textarea
                        className={`${fieldClass()} min-h-[90px]`}
                        value={deliveryInstructions}
                        onChange={(event) =>
                          setDeliveryInstructions(event.target.value)
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Order notes</span>
                      <textarea
                        className={`${fieldClass()} min-h-[90px]`}
                        value={orderNotes}
                        onChange={(event) => setOrderNotes(event.target.value)}
                      />
                    </label>
                    <label className="flex items-start gap-3 text-sm font-maison-neue text-Charcoal">
                      <input
                        checked={sameAsShipping}
                        className="mt-1"
                        onChange={(event) =>
                          setSameAsShipping(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Billing address matches shipping
                    </label>
                    <label className="flex items-start gap-3 text-sm font-maison-neue text-Charcoal">
                      <input
                        checked={customerVerified}
                        className="mt-1"
                        onChange={(event) =>
                          setCustomerVerified(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Customer identity and order details verified
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass()}>Payment handling</span>
                      <select
                        className={fieldClass()}
                        value={paymentMode}
                        onChange={(event) =>
                          setPaymentMode(event.target.value as StaffPaymentMode)
                        }
                      >
                        <option value="collect_card_now">
                          Collect card by phone
                        </option>
                        <option value="send_checkout_link">
                          Send customer checkout link
                        </option>
                      </select>
                    </label>
                    {paymentMode === "collect_card_now" && (
                      <label className="flex items-start gap-3 rounded-md border border-Gold/35 bg-Gold/10 p-3 text-sm font-maison-neue text-Charcoal">
                        <input
                          checked={paymentConsent}
                          className="mt-1"
                          onChange={(event) =>
                            setPaymentConsent(event.target.checked)
                          }
                          type="checkbox"
                        />
                        Customer explicitly authorized this staff member to
                        enter and process card details for this order.
                      </label>
                    )}
                    <label className="flex items-start gap-3 text-sm font-maison-neue text-Charcoal">
                      <input
                        checked={sendConfirmation}
                        className="mt-1"
                        onChange={(event) =>
                          setSendConfirmation(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Email checkout link to customer
                    </label>
                  </fieldset>

                  <Button
                    className="mt-5 min-h-[48px] w-full rounded-md bg-Gold px-4 text-sm font-rexton font-bold uppercase text-Charcoal disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-Charcoal/40"
                    disabled={prepareDisabled}
                    isLoading={isPending}
                    onClick={prepareOrder}
                    type="button"
                  >
                    {paymentMode === "collect_card_now"
                      ? "Prepare Payment"
                      : "Prepare Checkout Link"}
                  </Button>
                </>
              ) : (
                <p className="mt-4 rounded-md border border-gray-100 bg-SilverPlate/30 px-3 py-3 text-sm font-maison-neue text-Charcoal/60">
                  Fulfillment, verification, and payment controls appear after
                  the staff draft has a customer and at least one product.
                </p>
              )}

              {checkoutUrl && (
                <a
                  className="mt-4 block break-words rounded-md border border-Gold/40 bg-Gold/10 px-3 py-3 text-sm font-maison-neue text-Charcoal underline"
                  href={checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {checkoutUrl}
                </a>
              )}

              {prepareResult?.ok &&
                prepareResult.paymentClientSecret &&
                paymentMode === "collect_card_now" &&
                (stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: prepareResult.paymentClientSecret,
                    }}
                  >
                    <StaffChargeCard
                      result={prepareResult}
                      billingAddress={shippingAddress}
                      onComplete={(result) => {
                        setCompleteResult(result)
                        setStatus(
                          result.ok
                            ? `Order ${
                                result.displayId || result.orderId
                              } placed.`
                            : null
                        )
                        if (!result.ok)
                          setError(result.error || "Could not complete order.")
                      }}
                    />
                  </Elements>
                ) : (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm font-maison-neue text-red-700">
                    Stripe publishable key is not configured for this deploy.
                  </div>
                ))}

              {completeResult?.ok && (
                <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm font-maison-neue text-green-700">
                  Order {completeResult.displayId || completeResult.orderId}{" "}
                  placed and marked as staff-entered.
                </div>
              )}
            </section>

            {selectedContext?.recentOrders?.length ? (
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
                  Recent orders
                </h2>
                <div className="space-y-3">
                  {selectedContext.recentOrders.map((order) => (
                    <div
                      className="rounded-md border border-gray-100 p-3"
                      key={order.id}
                    >
                      <p className="text-sm font-maison-neue font-semibold text-Charcoal">
                        {order.displayId}
                      </p>
                      <p className="text-xs font-maison-neue text-Charcoal/55">
                        {new Date(order.createdAt).toLocaleDateString()} |{" "}
                        {order.status}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs font-maison-neue text-Charcoal/70">
                        {order.items.slice(0, 4).map((item, index) => (
                          <li key={`${order.id}-${index}`}>
                            {item.quantity} x {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {selectedContext?.legacyOrders?.length ? (
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
                  QuickBooks history
                </h2>
                <div className="space-y-3">
                  {selectedContext.legacyOrders.map((order) => (
                    <div
                      className="rounded-md border border-gray-100 p-3"
                      key={order.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-maison-neue font-semibold text-Charcoal">
                            {order.displayId}
                          </p>
                          <p className="text-xs font-maison-neue text-Charcoal/55">
                            {formatDate(order.placedAt)} | {order.status}
                          </p>
                        </div>
                        <p className="shrink-0 text-right text-xs font-maison-neue font-semibold text-Charcoal">
                          {formatPrice(order.total, order.currencyCode)}
                        </p>
                      </div>

                      <ul className="mt-2 space-y-2 text-xs font-maison-neue text-Charcoal/70">
                        {order.items.slice(0, 6).map((item) => (
                          <li
                            className="border-t border-gray-100 pt-2"
                            key={item.id}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="min-w-0 break-words">
                                {item.quantity} x {item.title}
                              </span>
                              <span className="shrink-0 text-Charcoal/55">
                                {formatPrice(
                                  item.lineTotal,
                                  order.currencyCode
                                )}
                              </span>
                            </div>
                            {(item.sku || item.lineKind !== "product") && (
                              <p className="mt-1 text-[11px] uppercase tracking-normal text-Charcoal/45">
                                {[
                                  item.sku,
                                  item.lineKind !== "product"
                                    ? item.lineKind
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </p>
                            )}
                            {item.description && (
                              <p className="mt-1 line-clamp-2 text-Charcoal/50">
                                {item.description}
                              </p>
                            )}
                            {item.variantId ? (
                              <button
                                className="mt-2 inline-flex min-h-[32px] items-center justify-center rounded-md bg-Gold px-3 text-[11px] font-rexton font-bold uppercase text-Charcoal transition-opacity hover:opacity-95"
                                onClick={() => addLegacyItem(item)}
                                type="button"
                              >
                                Add to Order
                              </button>
                            ) : item.lineKind === "product" ? (
                              <p className="mt-2 text-[11px] font-maison-neue-mono uppercase text-Charcoal/45">
                                Needs catalog match
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>

                      {order.lineCount > order.items.slice(0, 6).length && (
                        <p className="mt-2 text-xs font-maison-neue text-Charcoal/45">
                          +{order.lineCount - order.items.slice(0, 6).length}{" "}
                          more lines
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
          </div>
        </>
      ) : (
        <StaffOrderExceptionConsole />
      )}
    </div>
  )
}
