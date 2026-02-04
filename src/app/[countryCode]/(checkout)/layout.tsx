import Image from "next/image"
import Link from "next/link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full relative min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative z-10 h-16 bg-white border-b border-gray-200">
        <nav className="relative flex h-full items-center justify-between px-4 small:px-8 lg:px-16 max-w-7xl mx-auto">
          {/* Back to cart link */}
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase min-w-[120px]"
            data-testid="back-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back to cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>

          {/* Center logo */}
          <Link
            href="/"
            className="flex items-center absolute left-1/2 -translate-x-1/2"
            data-testid="store-link"
          >
            {/* Desktop logo */}
            <Image
              src="/images/logos/logo-horizontal.svg"
              alt="Grillers Pride"
              width={160}
              height={40}
              className="hidden small:block"
              priority
            />
            {/* Mobile logo */}
            <Image
              src="/images/logos/logo-mobile.svg"
              alt="Grillers Pride"
              width={40}
              height={40}
              className="block small:hidden"
              priority
            />
          </Link>
          
          <div className="w-8" /> {/* Spacer */}
        </nav>
      </div>

      {/* Content */}
      <div className="relative z-10" data-testid="checkout-container">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 flex items-center justify-center">
        <p className="text-xs text-gray-500">
          Secure checkout powered by Stripe
        </p>
      </div>
    </div>
  )
}
