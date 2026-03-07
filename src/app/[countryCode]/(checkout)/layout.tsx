import Image from "next/image"
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
      <div className="relative z-20 h-16 bg-white border-b border-gray-200">
        <nav className="flex h-full items-center justify-between px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          {/* Logo — far left */}
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-1.5"
            data-testid="store-link"
          >
            <Image
              src="/images/logos/logo-mobile.svg"
              alt="Grillers Pride"
              width={32}
              height={32}
              priority
            />
            <span className="hidden small:inline text-lg font-rexton font-bold text-[#2D479D] uppercase tracking-wider">
              Griller&apos;s <span className="text-Gold">&#9733;</span> Pride
            </span>
          </LocalizedClientLink>

          {/* Back to cart — right side */}
          <LocalizedClientLink
            href="/cart"
            className="flex items-center gap-x-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
            data-testid="back-link"
          >
            <span className="hidden small:block">Back to cart</span>
            <span className="block small:hidden">Back</span>
            <ChevronDown className="-rotate-90" size={16} />
          </LocalizedClientLink>
        </nav>
      </div>

      {/* Content */}
      <div className="relative z-10" data-testid="checkout-container">
        {children}
      </div>

      {/* Footer - extra bottom padding to clear cookie consent banner */}
      <div className="relative z-10 py-4 pb-24 flex items-center justify-center">
        <p className="text-xs text-gray-500">
          Secure checkout powered by Stripe
        </p>
      </div>
    </div>
  )
}
