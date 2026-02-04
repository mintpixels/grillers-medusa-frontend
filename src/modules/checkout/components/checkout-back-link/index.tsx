import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutBackLink() {
  return (
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
  )
}
