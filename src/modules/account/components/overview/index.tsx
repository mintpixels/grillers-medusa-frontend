import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const profileStatus = getProfileStatus(customer)
  const addressCount = customer?.addresses?.length || 0
  const orderCount = orders?.length || 0

  return (
    <div data-testid="overview-page-wrapper" className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 small:p-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-Gold/10 flex items-center justify-center shrink-0">
            <span className="text-Gold font-gyst font-bold text-2xl">
              {customer?.first_name?.charAt(0) || "G"}
            </span>
          </div>
          <div>
            <h1
              className="text-h4 font-gyst font-bold text-Charcoal"
              data-testid="welcome-message"
              data-value={customer?.first_name}
            >
              Welcome back, {customer?.first_name}
            </h1>
            <p className="text-sm font-maison-neue text-Charcoal/50 mt-0.5">
              {customer?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Orders"
          value={orderCount}
          href="/account/orders"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <StatCard
          label="Addresses"
          value={addressCount}
          href="/account/addresses"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
        />
        <ProfileStatCard status={profileStatus} />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-gyst font-bold text-Charcoal">
            Recent Orders
          </h2>
          {orderCount > 0 && (
            <LocalizedClientLink
              href="/account/orders"
              className="text-xs font-maison-neue font-semibold text-Gold hover:text-Gold/80 transition-colors"
            >
              View all
            </LocalizedClientLink>
          )}
        </div>

        <ul data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <li
                key={order.id}
                data-testid="order-wrapper"
                data-value={order.id}
                className="border-b border-gray-50 last:border-0"
              >
                <LocalizedClientLink
                  href={`/account/orders/details/${order.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex -space-x-2 shrink-0">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 overflow-hidden"
                        style={{ zIndex: 3 - idx }}
                      >
                        {item.thumbnail && (
                          <Image
                            src={item.thumbnail}
                            alt={item.product_title || ""}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-maison-neue text-Charcoal/60">
                        +{(order.items?.length || 0) - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-maison-neue font-semibold text-Charcoal"
                        data-testid="order-id"
                        data-value={order.display_id}
                      >
                        Order #{order.display_id}
                      </span>
                      <OrderStatusBadge status={order.fulfillment_status} />
                    </div>
                    <p
                      className="text-xs font-maison-neue text-Charcoal/50 mt-0.5"
                      data-testid="order-created-date"
                    >
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <span
                    className="text-sm font-maison-neue font-semibold text-Charcoal"
                    data-testid="order-amount"
                  >
                    {convertToLocale({
                      amount: order.total,
                      currency_code: order.currency_code,
                    })}
                  </span>

                  <svg className="w-4 h-4 text-Charcoal/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </LocalizedClientLink>
              </li>
            ))
          ) : (
            <li className="px-6 py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-Charcoal/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm font-maison-neue text-Charcoal/50 mb-4" data-testid="no-orders-message">
                No orders yet
              </p>
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center gap-2 text-sm font-maison-neue font-semibold text-Gold hover:text-Gold/80 transition-colors"
              >
                Browse products
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </LocalizedClientLink>
            </li>
          )}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 small:grid-cols-3 gap-4">
        <QuickAction
          href="/store"
          title="Browse Products"
          description="Explore our full catalog"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
            </svg>
          }
        />
        <QuickAction
          href="/account/reorder"
          title="Quick Reorder"
          description="Reorder your favorites"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652" />
            </svg>
          }
        />
        <QuickAction
          href="/account/profile"
          title="Update Profile"
          description="Keep your info current"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value: number | string
  href: string
  icon: React.ReactNode
}) {
  return (
    <LocalizedClientLink
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-Gold/30 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-Gold/70 group-hover:text-Gold transition-colors">{icon}</span>
        <span className="text-xs font-maison-neue font-semibold text-Charcoal/50 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-gyst font-bold text-Charcoal">{value}</p>
    </LocalizedClientLink>
  )
}

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <LocalizedClientLink
      href={href}
      className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-Gold/30 hover:shadow-sm transition-all group"
    >
      <div className="w-12 h-12 rounded-lg bg-Gold/5 flex items-center justify-center shrink-0 text-Gold/60 group-hover:text-Gold group-hover:bg-Gold/10 transition-all">
        {icon}
      </div>
      <div>
        <p className="text-sm font-maison-neue font-semibold text-Charcoal">{title}</p>
        <p className="text-xs font-maison-neue text-Charcoal/50 mt-0.5">{description}</p>
      </div>
    </LocalizedClientLink>
  )
}

function OrderStatusBadge({ status }: { status?: string }) {
  if (!status) return null

  const statusConfig: Record<string, { label: string; className: string }> = {
    not_fulfilled: { label: "Processing", className: "bg-amber-50 text-amber-700 border-amber-200" },
    fulfilled: { label: "Shipped", className: "bg-blue-50 text-blue-700 border-blue-200" },
    shipped: { label: "Shipped", className: "bg-blue-50 text-blue-700 border-blue-200" },
    delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" },
    canceled: { label: "Canceled", className: "bg-gray-50 text-gray-500 border-gray-200" },
    partially_fulfilled: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
    partially_shipped: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
  }

  const config = statusConfig[status] || { label: status, className: "bg-gray-50 text-gray-500 border-gray-200" }

  return (
    <span className={`inline-flex px-2 py-0.5 text-[10px] font-maison-neue font-semibold rounded-full border ${config.className}`}>
      {config.label}
    </span>
  )
}

type ProfileField = {
  label: string
  done: boolean
  href: string
}

type ProfileStatus = {
  fields: ProfileField[]
  doneCount: number
  total: number
  pct: number
  firstMissingHref: string
}

// Replaces the bare percentage tile with field-level breakdown so customers
// can see which 25% they're missing and click straight to the field that
// needs filling. Closes the "what does 75% even mean?" gap (#28).
const getProfileStatus = (
  customer: HttpTypes.StoreCustomer | null
): ProfileStatus => {
  const billingAddress = customer?.addresses?.find(
    (addr) => addr.is_default_billing
  )
  const fields: ProfileField[] = [
    {
      label: "Name",
      done: Boolean(customer?.first_name && customer?.last_name),
      href: "/account/profile",
    },
    {
      label: "Email",
      done: Boolean(customer?.email),
      href: "/account/profile",
    },
    {
      label: "Phone",
      done: Boolean(customer?.phone),
      href: "/account/profile",
    },
    {
      label: "Default billing address",
      done: Boolean(billingAddress),
      href: "/account/addresses",
    },
  ]
  const doneCount = fields.filter((f) => f.done).length
  const total = fields.length
  const firstMissing = fields.find((f) => !f.done)
  return {
    fields,
    doneCount,
    total,
    pct: Math.round((doneCount / total) * 100),
    firstMissingHref: firstMissing?.href || "/account/profile",
  }
}

function ProfileStatCard({ status }: { status: ProfileStatus }) {
  const isComplete = status.doneCount === status.total
  const ctaHref = isComplete ? "/account/profile" : status.firstMissingHref

  return (
    <LocalizedClientLink
      href={ctaHref}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-Gold/30 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-Gold/70 group-hover:text-Gold transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </span>
        <span className="text-xs font-maison-neue font-semibold text-Charcoal/50 uppercase tracking-wider">
          Profile
        </span>
      </div>
      {isComplete ? (
        <>
          <p className="text-2xl font-gyst font-bold text-Charcoal">
            ✓ Complete
          </p>
          <p className="text-xs font-maison-neue text-Charcoal/50 mt-1">
            All set — faster checkout, saved everything.
          </p>
        </>
      ) : (
        <>
          <p className="text-2xl font-gyst font-bold text-Charcoal">
            {status.doneCount} of {status.total} done
          </p>
          <ul className="mt-3 space-y-1">
            {status.fields.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-2 text-xs font-maison-neue text-Charcoal/70"
              >
                <span
                  aria-hidden="true"
                  className={
                    f.done
                      ? "inline-block w-3.5 text-Gold"
                      : "inline-block w-3.5 text-Charcoal/30"
                  }
                >
                  {f.done ? "✓" : "○"}
                </span>
                <span className={f.done ? "" : "text-Charcoal"}>{f.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-maison-neue font-semibold text-Gold group-hover:text-Gold/80">
            Complete profile →
          </p>
        </>
      )}
    </LocalizedClientLink>
  )
}

export default Overview
