import LocalizedClientLink from "@modules/common/components/localized-client-link"

type GuideSection = {
  id: string
  eyebrow: string
  title: string
  summary: string
  useFor: string[]
  howTo: string[]
  watch: string[]
}

type Playbook = {
  title: string
  steps: string[]
}

const systemMap = [
  {
    name: "Storefront",
    owner: "What customers and staff use in the browser",
    details:
      "The storefront shows products, takes carts through checkout, lets customers manage accounts, and gives staff the phone-order and order-support tools.",
  },
  {
    name: "Medusa",
    owner: "Commerce engine",
    details:
      "Medusa owns products, variants, carts, customers, orders, shipping, payment state, inventory quantities, saved cards, and the staff order actions.",
  },
  {
    name: "Strapi",
    owner: "Content and customer-facing catalog detail",
    details:
      "Strapi owns product copy, PDP images, page content, recipes, collections, checkout copy, shipping settings, waitlist settings, experiment content drafts, and customer-safe product names.",
  },
  {
    name: "Statsig and Jitsu",
    owner: "Experiment assignment and first-party measurement",
    details:
      "Statsig assigns storefront experiment variants. Jitsu receives exposure, shopping, checkout, and revenue events so winners are judged from first-party behavior, not GA4 alone.",
  },
  {
    name: "Stripe",
    owner: "Saved cards, final charges, and refunds",
    details:
      "Stripe stores saved cards, runs the final pre-shipment catch-weight charge, and handles card refunds. Stripe should not see a catch-weight order amount until staff finalize the weighed order.",
  },
  {
    name: "Postmark",
    owner: "Email delivery",
    details:
      "Postmark sends order, cancellation, refund, shipped, welcome, password reset, back-in-stock, review, lifecycle, campaign, and staff phone-order emails.",
  },
  {
    name: "QuickBooks Desktop",
    owner: "Accounting and the operating item list",
    details:
      "QuickBooks receives sales orders, order-backed customer records, and accounting follow-up through the sync service and Web Connector. Product matching must use ListID, also called the item hex.",
  },
]

const dailyChecklist = [
  "Open the staff console and confirm you can see Order Support without being redirected.",
  "Check QuickBooks Web Connector. A green bar means the session ran; still open Last Result or the log if the status says it sent an error back to the application.",
  "Open Pack & Finalize first. Every submitted launch order should appear there before it can ship.",
  "Use Order Support as lookup, not as a second fulfillment queue, especially for customer questions, refunds, cancellations, QBD failed, or QBD pending/manual orders.",
  "Open Customer Communications when checking campaign drafts, lifecycle flow health, customer timelines, suppressions, or Postmark delivery status.",
  "Place a small test order only when needed, using Stripe test cards while the site is still in test mode.",
  "Check that order, cancellation, refund, and back-in-stock emails are being received and that product names, PDP links, and pricing basis details are customer-safe.",
  "Before changing product availability, decide whether the item is out of stock, seasonal inactive, discontinued, or internal only. Those mean different things to customers.",
  "For any money action, verify three places separately: Medusa order/payment state, Stripe payment/refund state, and QuickBooks posting state.",
  "Before activating an experiment, confirm the experiment is approved, revenue gates are healthy if it affects shopping revenue, and the control still matches the current production experience.",
]

const publicSurfaces = [
  {
    route: "/us",
    name: "Homepage",
    staffUse:
      "Start here when explaining the site to a customer. It includes hero content, trust proof, reorder row, holiday banners, specialty rows, delivery promise, collections, learning links, recipes, and social content.",
  },
  {
    route: "/us/store",
    name: "Full catalog",
    staffUse:
      "Use for broad product browsing, filtering, sorting, and finding all published storefront products.",
  },
  {
    route: "/us/search",
    name: "Search",
    staffUse:
      "Use when a customer gives a product name, SKU, or partial phrase. It should show customer-safe Strapi/Medusa titles.",
  },
  {
    route: "/us/collections",
    name: "Collections hub",
    staffUse:
      "Use for curated shopping paths such as first order, freezer stocking, local delivery, shipping, holidays, and other missions.",
  },
  {
    route: "/us/collections/[handle]",
    name: "Collection page",
    staffUse:
      "Use for a specific curated collection, Strapi product collection, or tag-driven product set.",
  },
  {
    route: "/us/products/[handle]",
    name: "Product page",
    staffUse:
      "Use to confirm product title, images, price, packaging, ingredient disclosure, kosher facts, shipping eligibility, waitlist availability, and add-to-cart behavior.",
  },
  {
    route: "/us/cart",
    name: "Cart",
    staffUse:
      "Use to review line items, quantities, delivery ZIP context, free-shipping progress, and cart-level inventory issues.",
  },
  {
    route: "/us/checkout",
    name: "Checkout",
    staffUse:
      "Use to choose fulfillment, schedule pickup or delivery, enter address, resolve inventory blocks, and save a Stripe card for final catch-weight charging.",
  },
  {
    route: "/us/order/[id]/confirmed",
    name: "Order confirmation",
    staffUse:
      "Use to verify customer-facing order summary, fulfillment details, items, contact/address, payment, and account creation prompts.",
  },
  {
    route: "/us/account",
    name: "Account overview",
    staffUse:
      "Use to confirm customer profile, recent current orders, and imported legacy QuickBooks order history.",
  },
  {
    route: "/us/account/orders",
    name: "Customer orders",
    staffUse:
      "Use to help a customer find current order history and order detail pages.",
  },
  {
    route: "/us/account/reorder",
    name: "Reorder",
    staffUse:
      "Use to rebuild a cart from Medusa purchase history and imported QuickBooks history where the item has a catalog match.",
  },
  {
    route: "/us/account/wishlist",
    name: "Wishlist",
    staffUse:
      "Use to help a customer save and revisit products. Product names should be Strapi customer-safe titles.",
  },
  {
    route: "/us/account/payment-methods",
    name: "Saved cards",
    staffUse:
      "Use to help a customer review, add, delete, or choose default saved Stripe cards.",
  },
  {
    route: "/us/account/staff/orders",
    name: "Staff console",
    staffUse:
      "Use for customer context, new customer creation, phone orders, Pack & Finalize, order support, refunds, cancellations, QBD retry, and team access.",
  },
  {
    route: "/us/account/staff/communications",
    name: "Customer communications",
    staffUse:
      "Use for customer timelines, direct staff notes, lifecycle flows, campaign drafts, audience segments, suppressions, and Postmark delivery status.",
  },
  {
    route: "/us/account/staff/operations-guide",
    name: "This guide",
    staffUse: "Use as the staff operating manual and training link.",
  },
  {
    route: "/us/customer-service",
    name: "Customer service",
    staffUse:
      "Use for phone, email, hours, FAQ, policies, and support language managed in Strapi.",
  },
  {
    route: "/us/shipping/[slug]",
    name: "Shipping pages",
    staffUse:
      "Use for UPS, Southeast pickup, Atlanta delivery, plant pickup, and pallet-program explanations.",
  },
  {
    route: "/us/kashruth/[slug]",
    name: "Kashruth pages",
    staffUse: "Use for Passover, hechsherim, and supervision explanations.",
  },
  {
    route: "/us/holidays/order-deadlines",
    name: "Holiday deadlines",
    staffUse: "Use for seasonal cutoff and holiday ordering guidance.",
  },
  {
    route: "/us/page/[slug]",
    name: "Info and legal pages",
    staffUse:
      "Use for content-managed pages such as about, mission, legal, comparison, and policy content.",
  },
  {
    route: "/us/recipes",
    name: "Recipe hub",
    staffUse:
      "Use for recipe discovery, filters, holiday buckets, and product-related cooking guidance.",
  },
  {
    route: "/us/learn",
    name: "Butcher guide",
    staffUse:
      "Use for education content, cut guidance, kashruth education, and buying advice.",
  },
  {
    route: "/us/email-preferences",
    name: "Email preferences",
    staffUse:
      "Use when a customer wants to manage or unsubscribe from marketing email preferences.",
  },
  {
    route: "/us/navigation",
    name: "Site navigation",
    staffUse: "Use as a fast staff index of product and collection URLs.",
  },
  {
    route: "/agentic-commerce/*",
    name: "Agentic commerce feed",
    staffUse:
      "Used by automated shopping surfaces. Staff usually do not operate it, but should know it is a public product feed.",
  },
]

const sections: GuideSection[] = [
  {
    id: "customer-site",
    eyebrow: "Customer site",
    title: "What customers can do on the site",
    summary:
      "The customer site is the normal shopping experience. Staff should understand it because the staff console can enter a customer's account and use the same flow.",
    useFor: [
      "Browsing the homepage, store, search, collections, recipes, butcher guide, shipping pages, kashruth pages, legal pages, customer service, and site navigation.",
      "Viewing product pages with Strapi product titles, photos, ingredient disclosures, kosher status, shipping eligibility, and waitlist options.",
      "Adding products to cart, choosing fulfillment, paying by card, and receiving confirmation emails.",
      "Letting customers sign in, save addresses, manage saved cards, use wishlist, reorder from current or legacy history, and view order details.",
    ],
    howTo: [
      "Use /us/store for the full catalog. It is powered by Algolia for fast browsing, then enriched with Medusa prices and Strapi product details.",
      "Use /us/search when a customer is looking for a product by name or SKU. Search is live and should surface customer-safe titles.",
      "Use /us/collections for curated shopping paths. Individual collection pages may be Strapi product collections, product tags, or curated collections.",
      "Use a product page when confirming exact packaging, price mode, ingredient disclosure, kosher status, shipping eligibility, and whether a waitlist is offered.",
      "Use /us/navigation as a plain index of products and collections when staff need a fast reference page.",
    ],
    watch: [
      "Do not promise a product fact unless it appears in Strapi, Medusa, or current staff guidance.",
      "If a page shows a QuickBooks accounting title to customers, treat that as a bug. Customer-facing names should come from Strapi or Medusa.",
      "If a product is intentionally inactive, customers should not see a normal back-in-stock promise for it.",
    ],
  },
  {
    id: "catalog",
    eyebrow: "Catalog",
    title: "Products, names, SKUs, and QuickBooks ListIDs",
    summary:
      "The product title a customer sees is not the same thing as the QuickBooks item name. Staff should use customer-safe product names in customer conversations and use QuickBooks ListID only for operations.",
    useFor: [
      "Understanding why the same physical product may have a changed QuickBooks SKU or item name.",
      "Avoiding customer emails that expose seasonal QuickBooks prefixes, raw accounting names, or internal production names.",
      "Knowing what to backfill or check when a product fails to post to QuickBooks.",
    ],
    howTo: [
      "Use Strapi product Title and Medusa product title for customer wording.",
      "Use SKU as customer-safe subtext where it helps staff or customers confirm the item.",
      "Use QuickBooks ListID, also called the item hex or item name id, as the stable accounting identity.",
      "When QuickBooks SKUs change for seasonal sorting, do not remap by SKU first. Confirm the ListID.",
      "Treat QuickBooks items beginning with RM- as raw materials or internal production inputs unless Peter explicitly confirms they are sellable.",
    ],
    watch: [
      "A matching SKU can be misleading during Passover or other seasonal list management.",
      "A missing ListID on a product or variant can block QuickBooks posting.",
      "ListID is operational data. Do not show it to customers in storefront UI or emails.",
    ],
  },
  {
    id: "checkout",
    eyebrow: "Checkout",
    title: "Cart, fulfillment, and payment",
    summary:
      "Checkout is a single flow where the customer chooses fulfillment, confirms address and schedule, resolves inventory issues, and saves a Stripe card for the final weighed charge.",
    useFor: [
      "Plant pickup orders.",
      "Atlanta delivery orders.",
      "Southeast pickup orders.",
      "UPS shipping orders.",
      "Customer checkout links prepared by staff.",
      "Inventory blocks that require a replacement, waitlist, quantity change, or date change before payment.",
    ],
    howTo: [
      "Start from the cart and continue to /us/checkout. The old fulfillment-only checkout route redirects into the unified checkout.",
      "Confirm the fulfillment type first. This affects dates, addresses, shipping method, thresholds, and inventory availability.",
      "Use the inventory notice before payment. Customers may substitute an item, remove it, join the waitlist, move the order date, or complete only the available quantity.",
      "Stripe is the card processor. During test mode, use Stripe test cards only.",
      "After checkout, the customer sees the order confirmation page and should receive a confirmation email. For catch-weight orders, this is not the revenue charge.",
    ],
    watch: [
      "Wallet messaging should not be promised unless the backend supports it.",
      "Inventory can change between cart building and checkout. The final inventory check happens before order completion.",
      "Catch-weight checkout saves the card but does not authorize or charge the estimate. Staff charge the final amount in Pack & Finalize before shipment.",
      "A successful final Stripe charge is not the same as a posted QuickBooks sales order.",
    ],
  },
  {
    id: "staff-console",
    eyebrow: "Staff console",
    title: "Entering customer context",
    summary:
      "Staff can search for a customer, enter that customer context, and use the storefront as the customer. This is the safest way to help with account, cart, reorder, address, and checkout questions.",
    useFor: [
      "Helping a customer shop while on the phone.",
      "Checking what a customer sees in their account.",
      "Editing a saved address after customer verification.",
      "Starting from recent Medusa orders or imported QuickBooks history.",
    ],
    howTo: [
      "Go to Staff Console from the account nav.",
      "Use Customer Context, then search by name, email, phone, or order number.",
      "Select the correct customer and review the account detail shown on the right.",
      "Click Enter Account Context. The banner tells you when you are acting as that customer.",
      "Use Exit Context when done so you do not keep shopping as the customer by mistake.",
    ],
    watch: [
      "Legacy QuickBooks-only records are useful for lookup but may not be impersonatable unless they are linked to a storefront customer.",
      "Creating a storefront account does not create a QuickBooks customer. QuickBooks customer records are created or linked when the first accounting-ready order posts.",
      "Staff context actions are audited to the staff member.",
      "Always verify identity before entering account context or saving address/profile changes.",
    ],
  },
  {
    id: "phone-orders",
    eyebrow: "Phone orders",
    title: "Creating a staff phone order",
    summary:
      "The phone-order workspace lets staff create or select a customer, add products, choose fulfillment, handle inventory warnings, and either collect a card by phone or send a checkout link.",
    useFor: [
      "A customer calls and wants staff to place the order.",
      "A new caller needs a storefront account created.",
      "A customer wants to repeat items from recent or legacy order history.",
      "A customer wants a checkout link rather than reading card details over the phone.",
    ],
    howTo: [
      "Search for the customer first. If there is no match, use Create Account and enter email, phone, name, company if needed, and delivery address.",
      "If creating a new account, leave the account-claim email enabled unless there is a reason not to send it.",
      "If the customer agrees to texts, check Customer agreed to receive text messages. The account stores the phone number, opt-in time, source, copy version, and Twilio program metadata.",
      "Do not opt a phone-order customer into text messages unless the customer explicitly agrees to the SMS consent language. A phone number alone is not SMS marketing consent.",
      "Add products with product search or from recent or QuickBooks history when available.",
      "Review ATP and availability messages. Inactive items cannot be sold. Partial or blocked lines need an override reason and note.",
      "Choose fulfillment type, scheduled date, time window, substitution preference, delivery notes, and order notes.",
      "Check Customer identity and order details verified after reading the order back to the customer.",
      "For Collect card by phone, check the customer authorization box, prepare payment, enter the card in the Stripe field, then charge and place the order.",
      "For Send customer checkout link, prepare the checkout link and email it to the customer for review and payment.",
    ],
    watch: [
      "Never enter card details without explicit customer authorization.",
      "The checkout link expires. If a customer uses an old link and it fails, prepare a new one.",
      "Phone-order emails are separate from standard order confirmation emails; verify both when testing.",
      "Text-message consent is affirmative opt-in only. If the customer did not agree to receive texts, leave the SMS checkbox off.",
      "If a line needs an override, the note should explain what the customer accepted or who approved it.",
    ],
  },
  {
    id: "catch-weight-finalization",
    eyebrow: "Back office",
    title: "Pack & Finalize catch-weight orders",
    summary:
      "Pack & Finalize is the staff queue for every submitted launch order. The digital workflow starts with picking, moves to packing only after the picker marks the order ready, then ends with final charge and release by an approved staff member.",
    useFor: [
      "Every submitted customer order, because launch orders contain catch-weight items whose actual cut weight is not known until staff pick from the meat cabinet.",
      "Recording picked quantities, shortages, substitutions, and removals before the lug reaches packing.",
      "Recording packer-confirmed quantities and actual per-lb item weights before shipment.",
      "Recording shipper, cooler, or igloo counts. UPS shippers also need dry ice and packed weight.",
      "Reviewing the final total against the original estimate.",
      "Charging the saved Stripe card right before the order leaves when the staff account has final-charge permission.",
      "Holding an order when the final charge fails.",
    ],
    howTo: [
      "Open Staff Console and choose Pack & Finalize.",
      "Use the Staff timeline on the order to review recent staff actions before charging, releasing, or fulfilling. It records who changed the order, what changed, and when it happened.",
      "Pickers use the Picking tab. Claim the pick and enter the actual Picked quantity for each line. If Picked is lower than Ordered, including zero, the system records the shortage reason as Out of stock. Use Substitute only when replacing the item with another product. New lines start with Picked at 0.",
      "Click Ready For Packing only when every line is picked, removed, or substituted and the lug can move to the packing table.",
      "Packers use Ready for packing and Packing. Claim the pack before entering final pack data so two staff members do not work the same order phase at once. Claim Pack snapshots the picker handoff and resets the packer-confirmed Packed quantity to 0.",
      "Use the Per pack and By weight chips to see what the line needs. Per-pack lines need the packer-confirmed Packed quantity. By-weight lines unlock item-weight boxes after Claim Pack, one box for each picked pack; every picked pack must have a weight before the line is ready.",
      "If the packer finds a mismatch, use Send Back To Picking with a short reason. The order returns to the picker queue; staff can still handle the correction verbally while the audit trail records the handoff.",
      "Line edits autosave as staff type, and final totals refresh after each saved change. Use Save Line only when you want to validate a line immediately.",
      "If staff add an item that was not on the original customer order, use Add item, search the product, enter the fulfilled quantity, and choose a product with a saved QuickBooks item ID.",
      "If the picker substitutes a line, click Substitute, find the replacement product, confirm the replacement QBD ListID and replacement unit price, and record the substitution reason.",
      "If a picker cannot fill a line, leave Picked at 0 and save the line, or click Remove. The shortage reason is recorded as Out of stock automatically.",
      "In Packing complete details, record each shipper, cooler, igloo, or other package used. For UPS shipping orders, enter Micro, 330 Medium, 345 Large, or 360 Extra large, plus count, packed weight, dry ice pounds, and any package note.",
      "Do not mark a package over 50 lb including dry ice and packaging. Split the order into another box.",
      "Fix any missing weights, missing QBD ListIDs, replacement identities, shipping boxes, substitution reasons, or removed-line reasons shown in the queue.",
      "Click Mark Ready For Charge only after the final total is correct and the order is packed.",
      "Click Charge Card & Release only from a staff account with final-charge permission when the order is ready to leave. If Stripe fails, do not ship the order.",
      "After a successful charge, the order moves to Ready ship. Click Mark Fulfilled when staff physically hand off the pickup, delivery, or shipment so Medusa records the fulfillment.",
      "After fulfillment, verify QuickBooks posting is pending or complete.",
    ],
    watch: [
      "Stripe must not see an estimated catch-weight amount. It should only see the final weighed amount at Charge Card & Release.",
      "Team Access can assign Office, Picker, Packer, Manager, or Super Admin roles. Legacy General staff remains broad access for existing staff.",
      "Pickers can pick and hand off orders. Packers confirm packed counts, enter item weights, record boxes or coolers, and send mismatched orders back to picking. Managers and super admins can be granted final-charge permission.",
      "Packers can enter packing data without being allowed to charge saved cards. Super admins grant final-charge permission in Team Access.",
      "Every Pack & Finalize mutation should write to the order staff timeline, including claim pick, ready for packing, claim pack, line edits, added items, substitutions, removals, send back to picking, package capture, ready-for-charge, charge attempts, and fulfillment.",
      "Fulfillment is blocked until the final Stripe charge succeeds.",
      "Ready ship means the card has been charged and fulfillment is allowed; it does not by itself mean Medusa has a fulfillment record.",
      "QuickBooks receives the finalized weighed lines, not the original estimate. For per-lb items, QuickBooks quantity is the final pounds and QuickBooks amount is the final line subtotal; fulfilled quantity and staff notes travel in the line metadata or description.",
      "Staff-added items post as finalized accounting lines even though they were not part of the original customer cart. Add them only when the product identity and QBD item are clear.",
      "For UPS or free-shipping orders, the final total should preserve net shipping and promotion adjustments. If the final charge looks lower by the free-shipping amount, hold the order and escalate before charging.",
      "Use customer-safe product names when discussing substitutions. QBD ListIDs are staff/accounting identity only.",
      "A charge-failed hold means contact the customer for payment update before shipment.",
      "Final charge email goes after the card charge succeeds. It is separate from the checkout confirmation email.",
    ],
  },
  {
    id: "order-support",
    eyebrow: "Order support",
    title: "Refunds, cancellations, notes, credits, and QBD retries",
    summary:
      "Order Support is an order lookup and exception workspace, not the fulfillment queue. It can search current Medusa orders and imported legacy QuickBooks history, then apply audited actions to live Medusa orders.",
    useFor: [
      "Finding open, fulfilled, paid, refunded, or historical orders.",
      "Recording internal notes.",
      "Refunding a Stripe card payment.",
      "Capturing an authorized payment.",
      "Recording a shipping override.",
      "Recording an account credit follow-up.",
      "Canceling an order.",
      "Retrying a failed QuickBooks posting.",
    ],
    howTo: [
      "Open Staff Console and choose Order Support.",
      "Search by order number, invoice, email, customer name, or phone, or filter unfulfilled orders when support needs a starting list.",
      "Select the order and review item, payment, fulfillment, audit, and QBD status before choosing an action.",
      "Pick the action. Add a reason, internal staff note, and customer consent method when required.",
      "For refund, capture, or cancellation, review first and type the required confirmation word.",
      "Apply the action only after reading the warning panel. The audit timeline records the result.",
      "For legacy QuickBooks history, use the view for context only. Live money and cancellation actions are read-only there.",
    ],
    watch: [
      "Stripe card refunds send a refund email from the payment.refunded event and queue a QuickBooks accounting posting task.",
      "Offline payments and check refunds are disabled for launch. Use Stripe card capture/refund or record an internal note for accounting follow-up.",
      "Canceling before QuickBooks posting is skipped in QBD; canceling after QuickBooks posting queues a sales-order close task for Web Connector.",
      "Cancellation can be blocked once fulfillment has started. Record a note or credit follow-up if the order is locked.",
      "Retry QBD only appears when a previous QBD posting failed and has a retry key.",
    ],
  },
  {
    id: "communications-center",
    eyebrow: "Communications",
    title: "Customer communications center",
    summary:
      "Customer Communications is the staff view for the first-party lifecycle platform. Medusa stores profile, identity, event, cart lifecycle, segment, flow, campaign, suppression, attribution, template, import, and message-log records. Postmark delivers the actual emails.",
    useFor: [
      "Reviewing a customer's order, email, segment, lifecycle, and delivery timeline in one place.",
      "Sending an approved staff note to a customer when order support needs a separate email.",
      "Creating campaign drafts for consented audiences before sending through Postmark broadcast streams.",
      "Checking lifecycle flows such as welcome, abandoned cart, post-purchase, reorder, second-order loyalty, at-risk, dormant, holiday reminder, and back-in-stock follow-up.",
      "Reviewing whether a customer explicitly opted into SMS/text messaging at account creation.",
      "Checking whether an email was queued, sent, delivered, bounced, complained, unsubscribed, or suppressed.",
      "Reading 30-day reporting for attributed revenue, recovered carts, delivery targets, imports, and event mix.",
    ],
    howTo: [
      "Open Staff Console, then Customer Communications.",
      "Use Profiles to search by customer email, name, or customer ID and inspect their activity timeline.",
      "For SMS, confirm the profile has sms_consent before asking for a Twilio text campaign or lifecycle send.",
      "Use Send a staff note for customer-safe one-off messages. Keep product names customer-safe and do not include QuickBooks ListIDs or item hex values.",
      "Use Campaigns to draft a subject, intro, body, audience segment, schedule, and call to action. Send a test before sending to the audience.",
      "Use Flows or Run flows to process cart expiry, due lifecycle steps, refreshed segments, profile lifecycle stage changes, and scheduled campaigns.",
      "Use Reports to review attributed orders, attributed revenue, recovered carts, abandoned carts, and recent event mix.",
      "Use Templates to confirm which customer-safe templates exist before asking Postmark or engineering to change copy.",
      "Use Health to check Redis queue configuration, queue backlogs, ClickHouse delivery, GA4 delivery, and failed sends.",
      "Use Imports when migrating Constant Contact rows. Preserve unsubscribes and bounces before sending any marketing.",
    ],
    watch: [
      "Marketing and lifecycle unsubscribes must not block order-critical transactional emails.",
      "Postmark stream and message purpose are different. One-to-one abandoned-cart recovery may use the transactional Postmark stream, but it still requires marketing consent and respects cart-recovery preferences.",
      "Twilio is the assumed SMS delivery provider, but Medusa remains the durable consent source. Consent must include source, timestamp, version, phone number, and the consent text shown to the customer.",
      "Campaigns and broad announcements use the broadcast stream. Order, refund, cancellation, password, and account messages remain transactional or service messages.",
      "A Postmark send status does not prove the customer opened or clicked the email.",
      "Do not use this console as the order source of truth. Use Medusa and Stripe for order/payment state.",
      "Attributed revenue means a customer ordered after a lifecycle or campaign touch. It is useful for marketing decisions, not accounting.",
      "If Redis queues are not configured, scheduled Medusa jobs run the fallback path. That is acceptable, but slower and less visible.",
      "If a customer says an email has the wrong product name, compare against Strapi and Medusa customer-facing product titles first.",
    ],
  },
  {
    id: "inventory",
    eyebrow: "Inventory",
    title: "Allocation, out of stock, and waitlists",
    summary:
      "Out of stock and inactive are different promises. Out of stock means the item is still sellable but not available now. Inactive means the business does not want customers expecting it soon.",
    useFor: [
      "Preventing oversells while still accepting reasonable future demand.",
      "Letting customers join a back-in-stock list for active sellable items.",
      "Keeping seasonal Passover or discontinued items from creating false waitlist expectations.",
      "Reconciling active customer demand against QuickBooks quantities.",
    ],
    howTo: [
      "Active plus zero quantity means an item can be waitlist eligible if waitlist is enabled.",
      "Seasonal inactive, discontinued, and internal only should not show normal waitlist capture unless there is a deliberate override.",
      "Staff product search shows available to promise, future allowed, partial, blocked, or inactive.",
      "Partial and blocked lines may need an approved staff override before payment. Inactive lines must be replaced.",
      "Back-in-stock requests are stored in Strapi and emailed by Postmark when the trigger sees the item back in stock.",
      "The restock trigger respects a cooldown so customers are not spammed by inventory bouncing in and out.",
    ],
    watch: [
      "Do not use inventory quantity to mean inactive. Use lifecycle fields for inactive status.",
      "Do not use inactive for a product that should accept future or waitlist demand.",
      "Refunds and cancellations can release allocation, but that must be verified in Medusa allocation state, not assumed from Stripe alone.",
    ],
  },
  {
    id: "fulfillment",
    eyebrow: "Fulfillment",
    title: "Pickup, delivery, and shipping operations",
    summary:
      "Fulfillment choices drive dates, fees, thresholds, addresses, and customer instructions. The site currently supports plant pickup, Atlanta delivery, Southeast pickup, and UPS shipping.",
    useFor: [
      "Explaining pickup details and ID/order-number reminders.",
      "Checking Atlanta delivery ZIP eligibility and time windows.",
      "Checking Southeast pickup locations and dates.",
      "Checking UPS shipping minimums, rates, cold-chain settings, and fallback rates.",
    ],
    howTo: [
      "Checkout reads fulfillment settings from Strapi, with safe defaults if Strapi is temporarily unavailable.",
      "Plant pickup date rules, blackout dates, additional dates, cutoff hours, and post-order note are content-managed.",
      "Atlanta delivery uses ZIP/day configuration and delivery windows.",
      "Southeast pickup uses Strapi pickup locations with available dates and cutoff days.",
      "UPS shipping uses shipping settings, real-time rate toggle, origin ZIP, fallback amount, and the customer's requested arrival date. UPS does not use a scheduled pickup or local-delivery date.",
    ],
    watch: [
      "Changing fulfillment settings affects checkout immediately after deploy/cache refresh.",
      "If rates or dates look wrong, check Strapi settings first, then Medusa shipping options.",
      "QuickBooks sales orders include fulfillment details in the memo, but QuickBooks is not the checkout source of truth.",
    ],
  },
  {
    id: "emails",
    eyebrow: "Email",
    title: "Customer emails and Postmark",
    summary:
      "Transactional emails tell the customer what happened. They must use the same customer-safe product names as the storefront, link item names back to PDPs when a product handle exists, and include SKU plus pricing basis as helpful subtext, not QuickBooks accounting names.",
    useFor: [
      "Welcome and account claim emails.",
      "Password reset emails.",
      "Order placed emails for shipping and pickup.",
      "Order shipped emails.",
      "Order canceled emails.",
      "Refund issued emails.",
      "Final charge emails for catch-weight adjustments.",
      "Back-in-stock confirmation and restocked emails.",
      "Review acquisition emails.",
      "Staff phone-order review and paid confirmation emails.",
      "Lifecycle and campaign emails sent from Customer Communications.",
    ],
    howTo: [
      "Order emails are built from Medusa order data enriched for customer-safe display.",
      "Order, shipped, canceled, and final-charge item rows should show a PDP-linked customer title, SKU subtext, and whether the item is priced by pound or by pack. Per-pound rows should include the customer-facing price per pound when the order data can derive it.",
      "Refund emails are triggered by the payment.refunded event after the refund is created.",
      "Cancellation emails are triggered by order cancellation events.",
      "Back-in-stock emails use the Strapi back-in-stock request row and product snapshot.",
      "Customer Communications records every tracked send in the message log before Postmark delivery is attempted.",
      "Postmark webhooks update delivery, open, click, bounce, spam complaint, and unsubscribe status back into Medusa.",
      "Each tracked email has both a Postmark stream and a message purpose. The purpose decides consent and suppression rules.",
      "Email preferences can suppress individual marketing topics such as promotions, recipes, holiday reminders, and back-in-stock alerts.",
      "If a customer reports a wrong product name, compare the email to the storefront PDP title and Strapi product title first.",
    ],
    watch: [
      "Do not send QuickBooks item names, ListIDs, item hex values, or seasonal sorting prefixes in customer email rows.",
      "If an order email item row is missing a PDP link, pricing basis, or per-pound rate, check the Strapi product handle, PricingMode, AvgPackWeight, and Medusa order line metadata before editing the template.",
      "A customer note in Order Support is not always automatically emailed. Confirm before promising the customer will receive that note.",
      "If a refund succeeds but no email arrives, check the Medusa payment.refunded event and Postmark delivery before blaming Stripe.",
      "Marketing and lifecycle email preferences do not stop transactional order, refund, cancellation, password, or account emails.",
    ],
  },
  {
    id: "strapi",
    eyebrow: "Strapi",
    title: "Operating the content system",
    summary:
      "Strapi is where staff should edit content and customer-facing product details. It is not where staff should manually force payment, order, or accounting state.",
    useFor: [
      "Homepage sections, header, footer, customer service, legal, shipping, kashruth, holiday, recipes, learn articles, curated collections, testimonials, and checkout copy.",
      "Product titles, featured image, gallery images, product metadata, ingredient disclosures, SEO, social metadata, and related recipes.",
      "Availability lifecycle, waitlist settings, future-order eligibility, replenishment lead days, safety stock, unavailable copy, and suggested alternatives.",
      "Experiment records, variant content drafts, and placement content for content-driven tests.",
      "Back-in-stock request review when needed.",
    ],
    howTo: [
      "Open the correct Strapi content type, make the edit, and publish if the content type uses draft/publish.",
      "For product edits, use the customer-safe Title and PDP fields. Do not edit QuickBooks ListID unless you are deliberately correcting accounting identity.",
      "For lifecycle, choose active, seasonal inactive, discontinued, or internal only. Use Waitlist Enabled only when customers should expect notification when it returns.",
      "For checkout settings, edit available days, blackout dates, pickup notes, delivery lead time, and shipping settings with care.",
      "For experiment content, keep variants in draft until the experiment is approved. Publish only the records that should be available to the storefront.",
      "For media, use actual product or relevant page imagery. Avoid stock-like or unrelated photos.",
    ],
    watch: [
      "A public read token may not be able to write. If a backfill fails, verify token capability before assuming code is broken.",
      "Medusa-to-Strapi updates must fail closed if the existing Strapi record cannot be read. Do not let a sync fall back to QuickBooks or raw Medusa copy for product titles, descriptions, media, categorization, SEO, recipes, or merchandising fields.",
      "Medusa product deletion does not delete the Strapi product by default. Destructive Strapi sync requires a verified backup, a written cutover plan, and the explicit STRAPI_ALLOW_DESTRUCTIVE_SYNC=true backend switch.",
      "After sync changes, check QuickBooksListId, allocation fields, customer-safe titles, descriptions, featured images, gallery images, categorization, SEO, social metadata, and recipe associations.",
      "Do not move structural UX into Strapi. Strapi experiment records should manage content and placements; code controls major layout or checkout behavior.",
      "Generated or edited content should be published before staff expect it on the live site.",
    ],
  },
  {
    id: "medusa",
    eyebrow: "Medusa",
    title: "Operating the commerce backend",
    summary:
      "Medusa is the operational record for orders, carts, customers, products, variants, inventory, payments, saved cards, and fulfillment state.",
    useFor: [
      "Checking whether an order exists and what state it is in.",
      "Checking payment setup, final catch-weight charge, refund, and cancellation state.",
      "Checking product and variant IDs, SKUs, inventory quantities, and metadata.",
      "Checking customer profiles, addresses, saved cards, and account history.",
      "Checking allocation rows and availability snapshots when inventory is questioned.",
    ],
    howTo: [
      "Use Medusa order state to answer whether checkout completed.",
      "Use Stripe payment state to answer whether money moved.",
      "Use QuickBooks sync state to answer whether accounting posted.",
      "Use catch-weight finalization state to answer whether an order can leave the building.",
      "When editing product metadata, preserve qbd_list_id and allocation policy fields.",
      "For staff money actions, use the staff console unless a developer directs a specific backend operation.",
    ],
    watch: [
      "Medusa Admin can include legacy, disabled, reorder-only, or admin-only products. Do not treat every admin product as a storefront gap.",
      "A successful Stripe refund can still leave QBD posting pending.",
      "A catch-weight order can be placed with a saved card but no Stripe charge. Do not treat the checkout estimate as collected revenue.",
      "If a customer asks to close or delete their web account, do not delete QuickBooks customer records. Preserve accounting history, remove saved cards when appropriate, and suppress marketing if requested.",
      "Order cancellation after fulfillment may be restricted and may require operations review.",
    ],
  },
  {
    id: "quickbooks",
    eyebrow: "QuickBooks",
    title: "QuickBooks Desktop and Web Connector",
    summary:
      "QuickBooks is accounting infrastructure. The Web Connector pulls requests from the sync service, exchanges QBXML with QuickBooks Desktop, and returns results.",
    useFor: [
      "Pushing Medusa orders into QuickBooks as sales orders.",
      "Creating or linking the order's customer in QuickBooks at the first accounting event.",
      "Posting finalized catch-weight orders with actual weighed quantities and amounts.",
      "Reading QuickBooks catalog items, quantities, active status, ListIDs, and tax items.",
      "Posting accounting follow-up for refunds, captures, credits, and sales-order closes.",
      "Reconciling inventory allocation against QBD on-hand quantities.",
    ],
    howTo: [
      "Keep QuickBooks Desktop open on the connected machine with the correct company file.",
      "Keep QuickBooks Web Connector auto-run enabled for the Griller's Pride application.",
      "Use Last Result or the log when Web Connector says it sent an error back to the application.",
      "If QBXML parse errors appear, check the generated request and the specific item or tax config causing the parse failure.",
      "Use ListID for product matching. SKU is a fallback only.",
      "For sync health, use the sync service dashboard/logs or health command rather than relying only on the green Web Connector bars.",
    ],
    watch: [
      "Green progress bars mean the session completed, not necessarily that every order posted correctly.",
      "Tax uses its own QuickBooks item. Product ListIDs do not fix a missing or wrong tax item.",
      "Canceled before QuickBooks sync can be skipped; canceled after posting should create a Web Connector sales-order close task.",
      "Catch-weight orders should not post to QuickBooks before the final Stripe charge succeeds.",
      "Signup-only storefront accounts should not appear in QuickBooks. If one does, treat it as a sync policy bug.",
      "Do not delete QuickBooks customer records for account deletion requests. If cleanup is needed, escalate for staff-only inactive or notes handling after open orders, refunds, payment holds, and accounting tasks are clear.",
      "Stripe refunds should create a Web Connector refund or credit-memo accounting task and then mark the Medusa order metadata when posted.",
      "Do not make speculative changes to QWC files, secrets, or QuickBooks item mappings.",
    ],
  },
  {
    id: "analytics",
    eyebrow: "Measurement",
    title: "Analytics, experiments, reviews, and newsletters",
    summary:
      "Analytics and email preference systems help measure the site and follow up with customers. They should not be treated as the order source of truth.",
    useFor: [
      "Server-side purchase tracking from Medusa order.placed.",
      "Jitsu/first-party events such as page viewed, product viewed, cart viewed, checkout started, shipping submitted, payment submitted, and order completed.",
      "First-party lifecycle ingestion for profile, segment, flow, and campaign decisions.",
      "ClickHouse event storage and GA4 dual-write for reporting parity.",
      "Email attribution for last-click or last-touch lifecycle and campaign revenue.",
      "Statsig experiments for homepage ordering, PDP facts, PDP recommendations, cart upsells, navigation, PLP, search, collections, recipes, learn, newsletter, SEO/GEO copy, and reviews/proof.",
      "Review acquisition emails after orders.",
      "Newsletter subscribe, unsubscribe, and email preference links.",
      "Public agentic-commerce product feed and manifest.",
    ],
    howTo: [
      "Use analytics to understand customer behavior, not to decide whether a customer paid.",
      "Use Medusa and Stripe for order/payment truth.",
      "Storefront events dual-write to first-party communications ingestion when the communications endpoint is configured.",
      "Use Customer Communications reports for lifecycle and email performance. Use Medusa and Stripe for order and payment truth.",
      "When changing checkout or purchase logic, make sure order_completed still originates server-side from order.placed.",
      "Use first-party Jitsu experiment reports for winner calls. GA4 can be a secondary check, but should not be the only decision source.",
      "Revenue experiments should stay paused unless purchase tracking and parity gates are healthy.",
      "For content-driven experiments, create draft Strapi experiment, variant, and placement records before activation.",
      "Use the email preferences page when a customer asks to manage newsletter email.",
      "Use review links and review-click tracking for post-purchase follow-up.",
    ],
    watch: [
      "Do not fire purchase events from the confirmation page client as the source of truth.",
      "Do not replace first-party eventing with GA4-only logic.",
      "Experiment variants must not hide broken purchase tracking.",
      "Do not put internal strategy language, QuickBooks ListIDs, or operational notes in customer-facing experiment content.",
      "If a variant changes the shopping path, verify cart, checkout, PDP, and mobile before turning on traffic.",
    ],
  },
]

const playbooks: Playbook[] = [
  {
    title: "A customer says a product is unavailable",
    steps: [
      "Open the product page and confirm what the customer sees.",
      "Check whether the item is active, seasonal inactive, discontinued, or internal only.",
      "If active and out of stock, offer the waitlist or a replacement.",
      "If seasonal inactive, explain that it is not currently offered and should not be treated as a normal back-in-stock item.",
      "If the status looks wrong, check Strapi lifecycle fields and Medusa inventory quantity before changing anything.",
    ],
  },
  {
    title: "A customer wants a refund",
    steps: [
      "Open Order Support and find the order.",
      "Confirm the payment is a refundable Stripe card payment.",
      "Record the customer consent method, reason, and internal note.",
      "Preview the refund, type REFUND, and apply it.",
      "Verify Medusa payment state, Stripe refund state, refund email, QBD writer task, and final QuickBooks posting status separately.",
    ],
  },
  {
    title: "A catch-weight order is ready to ship",
    steps: [
      "Open Pack & Finalize and select the order.",
      "Confirm every per-lb line has actual weight and every line has a QBD ListID or approved accounting resolution.",
      "For substituted lines, confirm the replacement product, replacement QBD ListID, and substitution reason are saved.",
      "Click Mark Ready to Charge after the final total is correct.",
      "Click Charge Card & Release only when the order is actually ready to leave.",
      "If Stripe succeeds, click Mark Fulfilled when the order physically leaves or is handed off.",
      "After fulfillment, check QuickBooks posting status after Web Connector runs.",
      "If Stripe fails, hold the order and contact the customer for updated payment before shipment.",
    ],
  },
  {
    title: "A customer wants to cancel",
    steps: [
      "Open Order Support and check fulfillment state first.",
      "If fulfillment has not started, choose Cancel, record consent, preview, type CANCEL, and apply.",
      "If fulfillment is locked or shipped, record a note and route to operations for credit, refund, or shipment handling.",
      "Verify cancellation email. If the order already posted to QuickBooks, verify the QBD writer close task and the next Web Connector result.",
    ],
  },
  {
    title: "QuickBooks Web Connector shows an error",
    steps: [
      "Open Last Result or the Web Connector log. Do not rely only on the green bar.",
      "If the error says QuickBooks could not parse XML, inspect the generated QBXML request in sync logs.",
      "Check missing product mappings, missing tax item config, missing shipping/discount item config, and invalid line amounts.",
      "Requeue only the affected order or retry QBD posting only when you know the failure reason.",
      "After the next Web Connector run, confirm the order has a QuickBooks transaction id or a clear remaining error.",
    ],
  },
  {
    title: "A product name is wrong in an email",
    steps: [
      "Compare the email row to the storefront PDP and Strapi product title.",
      "If the email shows a QuickBooks title or seasonal prefix, treat it as a customer-facing bug.",
      "Check whether the email template is reading line item title, product_title, Strapi title map, or QuickBooks history fields.",
      "Use SKU as subtext only. Do not expose ListID or item hex.",
      "Use Customer Communications to inspect the message log and send a corrected customer-safe note if the wrong email caused confusion.",
    ],
  },
  {
    title: "A staff member needs access",
    steps: [
      "A super admin opens Staff Console and chooses Team Access.",
      "Search the customer account by email, name, or phone.",
      "Choose staff or super admin, enter a clear reason, and type the confirmation word.",
      "Turn on Can charge final orders only for staff trusted to press Charge Card & Release. Super admins always have this permission.",
      "Do not demote bootstrap super admins or remove your own super admin access.",
      "Ask the new staff member to sign in and confirm the Staff nav item appears.",
    ],
  },
  {
    title: "An experiment is ready to activate",
    steps: [
      "Confirm the control is the current production experience and the variant is approved for customers.",
      "If the experiment affects revenue, confirm purchase tracking and first-party Jitsu reporting are healthy before sending traffic.",
      "For content-driven variants, confirm the Strapi experiment, variant, and placement records are published only when ready.",
      "Activate assignment in Statsig or the approved environment flag. Do not use QA force flags for live customer allocation.",
      "Check the storefront on desktop and mobile, then confirm experiment_exposed events and downstream cart/order events carry the experiment context.",
      "To stop the test, pause assignment first. To ship a winner, freeze allocation, verify guardrails, set the winner as default, and remove losing variant references through normal review.",
    ],
  },
]

function AnchorNav() {
  return (
    <nav className="grid gap-2 text-sm font-maison-neue md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <a
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-Charcoal/70 transition hover:border-Gold/60 hover:text-Charcoal"
          href={`#${section.id}`}
          key={section.id}
        >
          {section.title}
        </a>
      ))}
    </nav>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-Charcoal/72">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-Gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 text-sm leading-relaxed text-Charcoal/72">
      {items.map((item, index) => (
        <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-2" key={item}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-Gold/50 bg-Gold/10 text-xs font-maison-neue-mono text-Charcoal">
            {index + 1}
          </span>
          <span className="pt-1">{item}</span>
        </li>
      ))}
    </ol>
  )
}

function GuideBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-maison-neue-mono uppercase text-Charcoal/50">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function StaffOperationsGuide() {
  return (
    <div className="bg-white">
      <section className="border-b border-gray-200 pb-8">
        <div className="flex flex-col gap-5 large:flex-row large:items-start large:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Staff operations
            </p>
            <h1 className="mt-2 text-h2-mobile font-gyst font-bold leading-tight text-Charcoal md:text-h2">
              Griller&apos;s Pride site operating guide
            </h1>
            <p className="mt-4 text-base leading-relaxed font-maison-neue text-Charcoal/68">
              This guide explains how Peter and staff should operate the new
              site in plain language. It covers the customer site, staff
              console, checkout, inventory, emails, Strapi, Medusa, Stripe, and
              QuickBooks.
            </p>
          </div>
          <LocalizedClientLink
            href="/account/staff/orders"
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal transition hover:bg-Charcoal hover:text-white"
          >
            Staff Console
          </LocalizedClientLink>
        </div>
      </section>

      <section className="border-b border-gray-200 py-8">
        <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
          Quick map of the systems
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {systemMap.map((system) => (
            <div
              className="rounded-md border border-gray-200 bg-SilverPlate/20 p-4"
              key={system.name}
            >
              <div className="flex flex-col gap-1 small:flex-row small:items-baseline small:justify-between">
                <h3 className="text-base font-maison-neue font-semibold text-Charcoal">
                  {system.name}
                </h3>
                <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                  {system.owner}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed font-maison-neue text-Charcoal/65">
                {system.details}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-gray-200 py-8">
        <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
          Site surface reference
        </h2>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <div className="hidden grid-cols-[220px_220px_minmax(0,1fr)] border-b border-gray-200 bg-SilverPlate/40 px-4 py-3 text-xs font-maison-neue-mono uppercase text-Charcoal/45 md:grid">
            <span>Route</span>
            <span>Surface</span>
            <span>Staff use</span>
          </div>
          <div className="divide-y divide-gray-100">
            {publicSurfaces.map((surface) => (
              <div
                className="grid gap-2 px-4 py-4 text-sm font-maison-neue md:grid-cols-[220px_220px_minmax(0,1fr)]"
                key={`${surface.route}-${surface.name}`}
              >
                <code className="break-words rounded bg-SilverPlate/35 px-2 py-1 text-xs text-Charcoal">
                  {surface.route}
                </code>
                <span className="font-semibold text-Charcoal">
                  {surface.name}
                </span>
                <span className="leading-relaxed text-Charcoal/68">
                  {surface.staffUse}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 py-8">
        <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
          Daily operating checklist
        </h2>
        <NumberedList items={dailyChecklist} />
      </section>

      <section className="border-b border-gray-200 py-8">
        <h2 className="mb-4 text-xl font-gyst font-bold text-Charcoal">
          Jump to a section
        </h2>
        <AnchorNav />
      </section>

      <div className="divide-y divide-gray-200">
        {sections.map((section) => (
          <section
            className="scroll-mt-24 py-9"
            id={section.id}
            key={section.id}
          >
            <div className="mb-6 max-w-3xl">
              <p className="text-xs font-maison-neue-mono uppercase text-Gold">
                {section.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-gyst font-bold text-Charcoal">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed font-maison-neue text-Charcoal/65">
                {section.summary}
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <GuideBlock title="Use this for">
                <BulletList items={section.useFor} />
              </GuideBlock>
              <GuideBlock title="How to operate it">
                <NumberedList items={section.howTo} />
              </GuideBlock>
              <GuideBlock title="Watch for">
                <BulletList items={section.watch} />
              </GuideBlock>
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-gray-200 py-9">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-maison-neue-mono uppercase text-Gold">
            Playbooks
          </p>
          <h2 className="mt-2 text-2xl font-gyst font-bold text-Charcoal">
            Common staff situations
          </h2>
          <p className="mt-3 text-sm leading-relaxed font-maison-neue text-Charcoal/65">
            Use these when a customer calls or when staff see something that
            needs action. They are intentionally practical and conservative.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {playbooks.map((playbook) => (
            <section
              className="rounded-md border border-gray-200 bg-white p-5"
              key={playbook.title}
            >
              <h3 className="mb-4 text-lg font-gyst font-bold text-Charcoal">
                {playbook.title}
              </h3>
              <NumberedList items={playbook.steps} />
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
