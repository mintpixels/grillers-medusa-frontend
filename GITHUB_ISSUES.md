# Grillers Pride Frontend - GitHub Issues

This document contains all planned GitHub issues for the Grillers Pride Medusa Frontend, organized by page/component category.

## Summary

| Priority | Count |
|----------|-------|
| Critical | 6 |
| High | 29 |
| Medium | 27 |
| Low | 12 |
| **Total** | **74** |

---

## Table of Contents

1. [Home Page](#home-page)
2. [Global Header](#global-header)
3. [Global Footer](#global-footer)
4. [Product Detail Page (PDP)](#product-detail-page-pdp)
5. [Collections Page](#collections-page)
6. [General/Site-Wide](#generalsite-wide)
7. [Checkout Page](#checkout-page)
8. [Blog/Recipes Page](#blogrecipes-page)

---

## Home Page

### Issue #1: Update home page metadata to Grillers Pride branding
**Priority:** High | **Type:** Bug | **Labels:** `bug`, `high-priority`, `home-page`

**Description:**
Current metadata shows "Medusa Next.js Starter Template" instead of Grillers Pride branding.

**Location:**
`src/app/[countryCode]/(main)/page.tsx:16-20`

**Current State:**
```typescript
export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description: "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}
```

**Acceptance Criteria:**
- [ ] Title reflects Grillers Pride brand
- [ ] Description is customer-facing and SEO-optimized

---

### Issue #2: Add hero CTA button component
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `home-page`

**Description:**
Hero section only displays title. Add configurable CTA button from Strapi for primary conversion action.

**Location:**
`src/modules/home/components/hero/index.tsx`

**Requirements:**
- CTA button text configurable from Strapi
- CTA button link configurable from Strapi
- Button styling consistent with brand guidelines

**Acceptance Criteria:**
- [ ] CTA button renders below hero title
- [ ] Button text and link come from Strapi CMS
- [ ] Button is responsive on mobile

---

### Issue #3: Add newsletter signup section to home page
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `home-page`

**Description:**
Per SOW email marketing requirements, add newsletter subscription component. No newsletter functionality exists currently.

**SOW Reference:**
> Email Marketing: Segmented campaigns and automation

**Requirements:**
- Email input field with validation
- Submit button
- Success/error state handling
- Integration with email marketing platform (Klaviyo, Mailchimp, etc.)

**Acceptance Criteria:**
- [ ] Newsletter signup form displays on home page
- [ ] Email validation works correctly
- [ ] Form submits to email marketing platform
- [ ] Success message displays after submission

---

### Issue #4: Implement lazy loading for home page sections
**Priority:** Medium | **Type:** Enhancement | **Labels:** `enhancement`, `medium-priority`, `home-page`, `performance`

**Description:**
Add intersection observer-based lazy loading for below-fold sections to improve initial page load performance.

**Sections to Lazy Load:**
- Testimonial Section
- Blog Explore Section
- Follow Us Section

**Acceptance Criteria:**
- [ ] Below-fold sections load when scrolled into view
- [ ] Loading skeletons display while content loads
- [ ] Core Web Vitals (LCP) improved

---

### Issue #5: Add JSON-LD structured data for Organization
**Priority:** High | **Type:** SEO | **Labels:** `seo`, `high-priority`, `home-page`

**Description:**
No structured data exists. Add Organization schema markup for rich search results.

**SOW Reference:**
> SEO Strategy: On-page and technical SEO

**Requirements:**
Add JSON-LD script with:
- Organization name
- Logo
- Contact information
- Social media profiles
- Address

**Acceptance Criteria:**
- [ ] Organization schema renders in page head
- [ ] Schema validates in Google Rich Results Test
- [ ] Includes all required Organization properties

---

### Issue #6: Add accessibility improvements to hero section
**Priority:** High | **Type:** Accessibility | **Labels:** `accessibility`, `high-priority`, `home-page`

**Description:**
Hero background image needs proper `role="img"` and accessible text alternative. Currently uses inline `backgroundImage` style without accessibility attributes.

**Location:**
`src/modules/home/components/hero/index.tsx`

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Acceptance Criteria:**
- [ ] Hero has appropriate ARIA attributes
- [ ] Screen readers can understand the hero content
- [ ] Color contrast meets WCAG AA standards

---

## Global Header

### Issue #7: Add mobile search bar to header
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `header`

**Description:**
Search bar is hidden on mobile (`hidden md:block` at line 40). Comment indicates "Search bar for mobile" at line 91 but not implemented.

**Location:**
`src/modules/layout/templates/nav/header.tsx:40-47, 91-92`

**Requirements:**
- Search icon in mobile header
- Expandable search input on tap
- Same Algolia functionality as desktop

**Acceptance Criteria:**
- [ ] Search is accessible on mobile devices
- [ ] Search results display correctly on mobile
- [ ] Search can be dismissed/closed

---

### Issue #8: Add skip-to-main-content link for accessibility
**Priority:** High | **Type:** Accessibility | **Labels:** `accessibility`, `high-priority`, `header`

**Description:**
WCAG 2.1 AA requires skip navigation link. Not present in current implementation.

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Requirements:**
- Visually hidden link that appears on focus
- Links to main content area
- First focusable element on page

**Acceptance Criteria:**
- [ ] Skip link is first focusable element
- [ ] Skip link visible when focused
- [ ] Skip link jumps to main content

---

### Issue #9: Add announcement bar component
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `header`

**Description:**
`announcement-bar.tsx` file exists but not integrated into main header. Implement for promotions/alerts.

**Location:**
`src/modules/layout/templates/nav/announcement-bar.tsx`

**Requirements:**
- Dismissible banner
- Content from Strapi CMS
- Optional link/CTA
- Configurable background color

**Acceptance Criteria:**
- [ ] Announcement bar displays above header
- [ ] Content is editable from Strapi
- [ ] Users can dismiss the banner
- [ ] Dismissed state persists in session

---

### Issue #10: Implement country/region selector in header
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `header`

**Description:**
`country-select` component exists but not visible in header. Add for multi-region support.

**Location:**
`src/modules/layout/components/country-select/index.tsx`

**Requirements:**
- Display current region/country
- Dropdown to select different region
- Updates cart and pricing accordingly

**Acceptance Criteria:**
- [ ] Region selector visible in header
- [ ] Selecting region updates URL country code
- [ ] Cart and prices update to selected region

---

### Issue #11: Add keyboard navigation for dropdown menus
**Priority:** High | **Type:** Accessibility | **Labels:** `accessibility`, `high-priority`, `header`

**Description:**
Desktop menu dropdowns use Headless UI but need explicit keyboard trap and focus management testing.

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Requirements:**
- Arrow key navigation within dropdowns
- Escape key closes dropdown
- Tab trapping within open menu
- Focus returns to trigger on close

**Acceptance Criteria:**
- [ ] All menu items reachable via keyboard
- [ ] Focus is properly managed
- [ ] Escape closes menus

---

### Issue #12: Phone number should be clickable (tel: link)
**Priority:** Low | **Type:** Enhancement | **Labels:** `enhancement`, `low-priority`, `header`

**Description:**
Phone number at line 50-51 is plain text, should be a clickable `tel:` link.

**Location:**
`src/modules/layout/templates/nav/header.tsx:50-51`

**Current State:**
```tsx
<span className="hidden md:inline-block...">(888) 627-3284</span>
```

**Expected State:**
```tsx
<a href="tel:+18886273284" className="...">(888) 627-3284</a>
```

**Acceptance Criteria:**
- [ ] Phone number is clickable
- [ ] Opens phone app on mobile devices

---

## Global Footer

### Issue #13: Replace Medusa branding with Grillers Pride
**Priority:** Critical | **Type:** Bug | **Labels:** `bug`, `critical`, `footer`

**Description:**
Footer shows "Medusa Store" and links to Medusa GitHub/docs. Update to Grillers Pride branding.

**Location:**
`src/modules/layout/templates/footer/index.tsx`

**Items to Update:**
- Line 23-24: "Medusa Store" text
- Lines 112-144: Medusa links section (GitHub, Documentation, Source code)
- Line 151: Copyright "Medusa Store"

**Acceptance Criteria:**
- [ ] All Medusa references removed
- [ ] Grillers Pride branding throughout
- [ ] Relevant company links added

---

### Issue #14: Add newsletter signup form to footer
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `footer`

**Description:**
Per SOW email marketing requirements. Common footer placement for email capture.

**SOW Reference:**
> Email Marketing: Segmented campaigns and automation

**Requirements:**
- Email input with validation
- Subscribe button
- Privacy policy link
- Success/error states

**Acceptance Criteria:**
- [ ] Newsletter form in footer
- [ ] Form integrates with email platform
- [ ] GDPR-compliant with privacy link

---

### Issue #15: Add social media links section
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `footer`

**Description:**
Footer should include Instagram, Facebook, Pinterest, TikTok links per SOW social media strategy.

**SOW Reference:**
> Social Media: Instagram, Facebook, Pinterest, TikTok

**Requirements:**
- Social media icons
- Links to Grillers Pride social profiles
- Icons from Strapi for flexibility

**Acceptance Criteria:**
- [ ] Social icons display in footer
- [ ] Links open in new tab
- [ ] Icons have accessible labels

---

### Issue #16: Add Strapi-driven footer content
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `footer`

**Description:**
Footer content (contact info, policies, about) should come from Strapi CMS for admin editability.

**Requirements:**
- Footer links from Strapi
- Contact information from Strapi
- Policy pages links (Privacy, Terms, etc.)

**Acceptance Criteria:**
- [ ] Footer content editable in Strapi
- [ ] Changes reflect without code deployment

---

### Issue #17: Add payment method icons to footer
**Priority:** Low | **Type:** Enhancement | **Labels:** `enhancement`, `low-priority`, `footer`

**Description:**
Display accepted payment methods (Visa, MC, Amex, PayPal) for trust signals.

**Requirements:**
- Payment provider icons
- Display in footer bottom section

**Acceptance Criteria:**
- [ ] Payment icons display in footer
- [ ] Icons match accepted payment methods

---

### Issue #18: Add kosher certification badge to footer
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `footer`

**Description:**
Display kosher certification for brand trust. Important for target audience.

**Requirements:**
- Kosher certification logo/badge
- Link to certification details if applicable

**Acceptance Criteria:**
- [ ] Certification badge visible in footer
- [ ] Badge is high quality/crisp

---

## Product Detail Page (PDP)

### Issue #19: Update PDP metadata to use Grillers Pride branding
**Priority:** High | **Type:** Bug | **Labels:** `bug`, `high-priority`, `pdp`

**Description:**
Metadata at line 74 shows "Medusa Store". Update to "Grillers Pride".

**Location:**
`src/app/[countryCode]/(main)/products/[handle]/page.tsx:74-81`

**Current State:**
```typescript
return {
  title: `${product.title} | Medusa Store`,
  ...
}
```

**Acceptance Criteria:**
- [ ] Product titles show "| Grillers Pride"
- [ ] OpenGraph tags use correct branding

---

### Issue #20: Add JSON-LD Product structured data
**Priority:** High | **Type:** SEO | **Labels:** `seo`, `high-priority`, `pdp`

**Description:**
No Product schema markup. Add for rich search results (price, availability, reviews).

**SOW Reference:**
> SEO Strategy: On-page and technical SEO

**Requirements:**
Add JSON-LD with:
- Product name, description, image
- Price and currency
- Availability status
- Brand
- SKU
- Reviews/ratings (when available)

**Acceptance Criteria:**
- [ ] Product schema renders on all PDPs
- [ ] Schema validates in Google Rich Results Test
- [ ] Price updates with variant selection

---

### Issue #21: Add breadcrumb navigation
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `pdp`, `seo`

**Description:**
No breadcrumbs on PDP. Add for UX and SEO (BreadcrumbList schema).

**Requirements:**
- Home > Category > Product Name
- Clickable links
- JSON-LD BreadcrumbList schema

**Acceptance Criteria:**
- [ ] Breadcrumbs display on PDP
- [ ] Links navigate correctly
- [ ] Schema markup included

---

### Issue #22: Add product reviews/ratings display
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `pdp`

**Description:**
Testimonial shows star ratings but no product-specific reviews. Integrate reviews system.

**Requirements:**
- Display average rating
- Show review count
- List individual reviews
- Consider integration (Yotpo, Judge.me, etc.)

**Acceptance Criteria:**
- [ ] Reviews display on PDP
- [ ] Rating aggregate shows
- [ ] Reviews are real customer reviews

---

### Issue #23: Add social sharing buttons
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `pdp`

**Description:**
Add share to Facebook, Pinterest, Twitter for products.

**Requirements:**
- Share buttons on PDP
- Pre-populated share text/image
- Pinterest especially important for food products

**Acceptance Criteria:**
- [ ] Share buttons visible on PDP
- [ ] Sharing works correctly
- [ ] Shared content includes product image

---

### Issue #24: Add wishlist functionality
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `pdp`

**Description:**
No wishlist feature currently exists. Allow customers to save products for later.

**Requirements:**
- Add to wishlist button
- Wishlist page in account
- Persist for logged-in users
- Guest wishlist via localStorage

**Acceptance Criteria:**
- [ ] Users can add products to wishlist
- [ ] Wishlist accessible in account
- [ ] Wishlist persists across sessions

---

### Issue #25: Add weight/nutritional information display
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `pdp`

**Description:**
Strapi has metadata fields (avg_pack_size, weight, serves) - verify all display correctly.

**Location:**
Verify `src/modules/products/components/product-detail/`

**Fields to Verify:**
- Average pack size
- Weight
- Serves count
- Pieces per pack
- Gluten-free flag
- Certifications

**Acceptance Criteria:**
- [ ] All metadata fields display when populated
- [ ] Missing fields don't show empty sections

---

### Issue #26: Fix image gallery accessibility
**Priority:** High | **Type:** Accessibility | **Labels:** `accessibility`, `high-priority`, `pdp`

**Description:**
Ensure all product images have descriptive alt text and gallery is keyboard navigable.

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Requirements:**
- Descriptive alt text on all images
- Keyboard navigation for gallery
- Focus indicators on thumbnails
- Screen reader announcements for image changes

**Acceptance Criteria:**
- [ ] All images have meaningful alt text
- [ ] Gallery navigable via keyboard
- [ ] Focus visible on all interactive elements

---

### Issue #27: Add related products loading skeleton
**Priority:** Low | **Type:** Enhancement | **Labels:** `enhancement`, `low-priority`, `pdp`

**Description:**
Add skeleton loader for related products while data loads.

**Requirements:**
- Skeleton matches product card layout
- Displays during data fetch
- Smooth transition to loaded content

**Acceptance Criteria:**
- [ ] Skeleton displays while loading
- [ ] No layout shift when content loads

---

## Collections Page

### Issue #28: Update collections metadata to use Grillers Pride branding
**Priority:** High | **Type:** Bug | **Labels:** `bug`, `high-priority`, `collections`

**Description:**
Metadata at line 78 shows "Medusa Store". Update to Grillers Pride.

**Location:**
`src/app/[countryCode]/(main)/collections/[handle]/page.tsx:77-83`

**Acceptance Criteria:**
- [ ] Collection titles show "| Grillers Pride"

---

### Issue #29: Add collection description from Strapi
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `collections`

**Description:**
Collection pages should display marketing description from CMS.

**Requirements:**
- Description text area in collection header
- Rich text support from Strapi
- SEO-friendly description

**Acceptance Criteria:**
- [ ] Collection description displays
- [ ] Description editable in Strapi

---

### Issue #30: Add JSON-LD CollectionPage structured data
**Priority:** Medium | **Type:** SEO | **Labels:** `seo`, `medium-priority`, `collections`

**Description:**
Add structured data for collection/category pages.

**Requirements:**
- CollectionPage or ItemList schema
- Include products in list
- Pagination handling

**Acceptance Criteria:**
- [ ] Schema renders on collection pages
- [ ] Validates in testing tools

---

### Issue #31: Add filtering by product attributes
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `collections`

**Description:**
Algolia integration exists but need filters for dietary (gluten-free), certifications, price range.

**Requirements:**
- Gluten-free filter
- Certification filters
- Price range slider
- Clear all filters option

**Acceptance Criteria:**
- [ ] Filters display in collection sidebar
- [ ] Filtering updates product grid
- [ ] Active filters clearly shown

---

### Issue #32: Add collection banner/hero image
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `collections`

**Description:**
Collections should have customizable hero image from Strapi.

**Requirements:**
- Hero image at top of collection
- Title overlay
- Optional CTA button
- Mobile-responsive

**Acceptance Criteria:**
- [ ] Hero image displays on collections
- [ ] Image configurable in Strapi

---

### Issue #33: Remove legacy collection pages
**Priority:** Low | **Type:** Cleanup | **Labels:** `cleanup`, `low-priority`, `collections`

**Description:**
Delete deprecated `collections-old` and `categories-old` routes.

**Location:**
- `src/app/[countryCode]/(main)/collections-old/`
- `src/app/[countryCode]/(main)/categories-old/`

**Acceptance Criteria:**
- [ ] Legacy routes removed
- [ ] No broken links to old routes

---

### Issue #34: Add product count display
**Priority:** Low | **Type:** Enhancement | **Labels:** `enhancement`, `low-priority`, `collections`

**Description:**
Show total product count in collection header.

**Requirements:**
- "Showing X products" text
- Updates with filtering

**Acceptance Criteria:**
- [ ] Product count displays
- [ ] Count updates with filters

---

## General/Site-Wide

### Issue #35: Implement Google Analytics 4 tracking
**Priority:** Critical | **Type:** Feature | **Labels:** `feature`, `critical`, `analytics`

**Description:**
No analytics implementation. Per SOW Data & Analytics plan, implement GA4.

**SOW Reference:**
> Event Capture Plan: Configure tracking in Google Tag Manager and Google Analytics

**Requirements:**
- GA4 property setup
- Page view tracking
- Enhanced ecommerce events
- User properties

**Acceptance Criteria:**
- [ ] GA4 script loads on all pages
- [ ] Page views tracked
- [ ] Ecommerce events fire correctly

---

### Issue #36: Implement Google Tag Manager
**Priority:** Critical | **Type:** Feature | **Labels:** `feature`, `critical`, `analytics`

**Description:**
Per SOW event capture plan, set up GTM for event tracking.

**SOW Reference:**
> Configure tracking in Google Tag Manager

**Requirements:**
- GTM container on all pages
- Data layer implementation
- Event triggers configured

**Acceptance Criteria:**
- [ ] GTM container loads
- [ ] Data layer populates correctly
- [ ] Events fire to GTM

---

### Issue #37: Add cookie consent banner
**Priority:** Critical | **Type:** Legal | **Labels:** `feature`, `critical`, `legal`

**Description:**
Per SOW Cookies & Privacy requirements. GDPR/CCPA compliance needed.

**SOW Reference:**
> Cookies & Privacy: Design a detailed event capture plan

**Requirements:**
- Cookie consent popup
- Granular consent options
- Consent stored in cookie
- Block tracking until consent

**Acceptance Criteria:**
- [ ] Consent banner displays for new visitors
- [ ] Users can accept/reject cookies
- [ ] Preference persists
- [ ] Tracking respects preferences

---

### Issue #38: Add event tracking for key user actions
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `analytics`

**Description:**
Track key ecommerce events per SOW requirements.

**SOW Reference:**
> Event Capture Plan: form submissions, button clicks

**Events to Track:**
- `view_item`
- `add_to_cart`
- `remove_from_cart`
- `begin_checkout`
- `add_shipping_info`
- `add_payment_info`
- `purchase`
- `search`
- `view_item_list`

**Acceptance Criteria:**
- [ ] All events fire correctly
- [ ] Events contain required parameters
- [ ] Events appear in GA4

---

### Issue #39: Setup unit testing framework
**Priority:** High | **Type:** Testing | **Labels:** `testing`, `high-priority`

**Description:**
No tests exist. Setup Jest + React Testing Library.

**SOW Reference:**
> Quality Assurance Process: rigorous testing, including unit, integration tests

**Requirements:**
- Jest configuration
- React Testing Library setup
- Coverage reporting
- CI integration

**Acceptance Criteria:**
- [ ] Jest runs successfully
- [ ] Sample tests pass
- [ ] Coverage reports generate

---

### Issue #40: Setup E2E testing framework
**Priority:** High | **Type:** Testing | **Labels:** `testing`, `high-priority`

**Description:**
Setup Playwright for critical path testing (checkout flow).

**SOW Reference:**
> Quality Assurance Process: user acceptance tests

**Requirements:**
- Playwright configuration
- Critical path test scripts
- CI/CD integration

**Test Scenarios:**
- Complete checkout flow
- User registration/login
- Product search and filter
- Add to cart

**Acceptance Criteria:**
- [ ] Playwright configured
- [ ] Checkout flow test passes
- [ ] Tests run in CI

---

### Issue #41: Add component integration tests
**Priority:** Medium | **Type:** Testing | **Labels:** `testing`, `medium-priority`

**Description:**
Test key components: cart, checkout forms, product detail.

**Components to Test:**
- Cart item management
- Checkout address form
- Product variant selector
- Search functionality

**Acceptance Criteria:**
- [ ] Key component tests written
- [ ] Tests cover happy path and edge cases

---

### Issue #42: Complete WCAG 2.1 AA accessibility audit
**Priority:** Critical | **Type:** Accessibility | **Labels:** `accessibility`, `critical`

**Description:**
Only 25 ARIA attributes found across codebase. Comprehensive audit needed per SOW ADA compliance.

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Audit Areas:**
- Color contrast
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Form labels and errors
- Image alt text
- Heading hierarchy

**Acceptance Criteria:**
- [ ] Full audit completed
- [ ] Issues documented
- [ ] Remediation plan created

---

### Issue #43: Add focus visible styles throughout
**Priority:** High | **Type:** Accessibility | **Labels:** `accessibility`, `high-priority`

**Description:**
Ensure all interactive elements have visible focus indicators.

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Requirements:**
- Consistent focus ring style
- High contrast focus indicators
- No `outline:none` without replacement

**Acceptance Criteria:**
- [ ] All buttons have focus style
- [ ] All links have focus style
- [ ] All form inputs have focus style

---

### Issue #44: Add ARIA live regions for dynamic content
**Priority:** High | **Type:** Accessibility | **Labels:** `accessibility`, `high-priority`

**Description:**
Cart updates, form errors, loading states need aria-live announcements.

**SOW Reference:**
> ADA Compliance with WCAG 2.1 Level AA Standards

**Areas Needing Live Regions:**
- Cart item add/remove
- Form validation errors
- Loading states
- Search results updates
- Toast notifications

**Acceptance Criteria:**
- [ ] Screen readers announce dynamic changes
- [ ] Appropriate politeness levels used

---

### Issue #45: Generate and verify sitemap.xml
**Priority:** High | **Type:** SEO | **Labels:** `seo`, `high-priority`

**Description:**
`next-sitemap.js` exists but verify it generates correctly with all routes.

**Location:**
`/next-sitemap.js`

**Requirements:**
- All public pages included
- Proper lastmod dates
- Correct priority values
- Submitted to Google Search Console

**Acceptance Criteria:**
- [ ] Sitemap generates on build
- [ ] All pages included
- [ ] No excluded pages that should be included

---

### Issue #46: Add canonical URLs to all pages
**Priority:** Medium | **Type:** SEO | **Labels:** `seo`, `medium-priority`

**Description:**
Prevent duplicate content issues with proper canonical tags.

**Requirements:**
- Self-referencing canonicals on all pages
- Handle pagination canonicals
- Handle filtered page canonicals

**Acceptance Criteria:**
- [ ] All pages have canonical tag
- [ ] Canonicals are absolute URLs

---

### Issue #47: Add hreflang tags for multi-region
**Priority:** Medium | **Type:** SEO | **Labels:** `seo`, `medium-priority`

**Description:**
Site supports multiple regions but no hreflang implementation.

**Requirements:**
- hreflang tags for each region
- x-default fallback
- Reciprocal tags on all variants

**Acceptance Criteria:**
- [ ] hreflang tags on all pages
- [ ] Tags validate correctly

---

### Issue #48: Create 500 error page
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`

**Description:**
Only 404 handler exists. Add custom 500 error page.

**Requirements:**
- Branded error page
- Helpful messaging
- Link back to home
- Error logging

**Acceptance Criteria:**
- [ ] 500 page displays on server errors
- [ ] Page matches site branding

---

### Issue #49: Add page transition loading states
**Priority:** Low | **Type:** Enhancement | **Labels:** `enhancement`, `low-priority`

**Description:**
Add loading indicators during page navigation.

**Requirements:**
- Progress bar or spinner
- Consistent across navigation
- Accessible loading announcements

**Acceptance Criteria:**
- [ ] Loading indicator shows during navigation
- [ ] Smooth transitions

---

### Issue #50: Document component library
**Priority:** Medium | **Type:** Documentation | **Labels:** `documentation`, `medium-priority`

**Description:**
Per SOW CMS Documentation requirements.

**SOW Reference:**
> CMS Documentation: Develop detailed documentation for the CMS

**Requirements:**
- Component usage examples
- Props documentation
- Storybook or similar tool

**Acceptance Criteria:**
- [ ] All components documented
- [ ] Examples provided

---

### Issue #51: Create technical stack documentation
**Priority:** Medium | **Type:** Documentation | **Labels:** `documentation`, `medium-priority`

**Description:**
Per SOW Tech Stack Documentation requirements.

**SOW Reference:**
> Tech Stack Documentation: Document the complete technology stack

**Requirements:**
- Architecture overview
- Technology choices rationale
- Setup instructions
- Deployment guide

**Acceptance Criteria:**
- [ ] README updated
- [ ] Architecture documented
- [ ] Setup guide complete

---

## Checkout Page

### Issue #52: Add checkout metadata with Grillers Pride branding
**Priority:** High | **Type:** Bug | **Labels:** `bug`, `high-priority`, `checkout`

**Description:**
Checkout title is just "Checkout" - add full branding.

**Location:**
`src/app/[countryCode]/(checkout)/checkout/page.tsx:9-11`

**Acceptance Criteria:**
- [ ] Title includes Grillers Pride
- [ ] Meta description added

---

### Issue #53: Add credit card verification display
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `checkout`

**Description:**
Per SOW: "Develop and integrate a credit card verification system" - show CVV verification status.

**SOW Reference:**
> Develop and integrate a credit card verification system to ensure customers submit valid credit card information

**Requirements:**
- CVV verification indicator
- Card validation feedback
- Clear error messages for invalid cards

**Acceptance Criteria:**
- [ ] Card validation feedback displays
- [ ] Invalid card errors are clear

---

### Issue #54: Integrate UPS API for real-time shipping rates
**Priority:** Critical | **Type:** Feature | **Labels:** `feature`, `critical`, `checkout`, `shipping`

**Description:**
Per SOW: shipping with transit days and real-time rates. Currently uses flat/calculated but not UPS API.

**SOW Reference:**
> UPS API Integration: Access the UPS API to retrieve essential shipping parameters such as transit days and real-time shipping rates

**Requirements:**
- UPS API integration in backend
- Display transit days
- Real-time rate calculation
- Handle API errors gracefully

**Acceptance Criteria:**
- [ ] UPS rates display at checkout
- [ ] Transit days shown
- [ ] Rates update based on address

---

### Issue #55: Add shipping box estimation display
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `checkout`, `shipping`

**Description:**
Per SOW: "Calculate estimated weight and dimensions of shipping boxes"

**SOW Reference:**
> Shipping Box Estimation: Calculate the estimated weight and dimensions of the shipping boxes required for UPS shipments

**Requirements:**
- Display estimated package weight
- Show box dimensions
- Factor into shipping calculation

**Acceptance Criteria:**
- [ ] Package weight displays
- [ ] Information helps customer understand shipping

---

### Issue #56: Add dry ice calculation display
**Priority:** High | **Type:** Feature | **Labels:** `feature`, `high-priority`, `checkout`, `shipping`

**Description:**
Per SOW: "Determine total dry ice needed for temperature-sensitive products"

**SOW Reference:**
> Dry Ice Requirement Calculation: Determine the total dry ice needed for temperature-sensitive products during UPS shipping

**Requirements:**
- Calculate dry ice based on products
- Display dry ice info to customer
- Factor into shipping if applicable

**Acceptance Criteria:**
- [ ] Dry ice requirements shown when applicable
- [ ] Customer informed about cold shipping

---

### Issue #57: Fix typo in shipping disclaimer
**Priority:** Low | **Type:** Bug | **Labels:** `bug`, `low-priority`, `checkout`

**Description:**
"guarenteed" should be "guaranteed" at line 382.

**Location:**
`src/modules/checkout/components/shipping/index.tsx:382`

**Current:**
```
*This is estimate and specific days are not guarenteed.
```

**Expected:**
```
*This is an estimate and specific days are not guaranteed.
```

**Acceptance Criteria:**
- [ ] Typo fixed
- [ ] Grammar corrected ("is estimate" -> "is an estimate")

---

### Issue #58: Add plant pickup discount display
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `checkout`, `shipping`

**Description:**
Per SOW: "Plant Pickup Incentive Discounts" - show savings when selecting pickup.

**SOW Reference:**
> Plant Pickup Incentive Discounts: Incorporate discount percentages for customers who opt for plant pickup

**Requirements:**
- Show savings amount for pickup
- Highlight discount compared to shipping
- Clear messaging about pickup benefits

**Acceptance Criteria:**
- [ ] Pickup savings displayed
- [ ] Customer understands discount

---

### Issue #59: Add order summary sticky behavior on scroll
**Priority:** Medium | **Type:** Enhancement | **Labels:** `enhancement`, `medium-priority`, `checkout`

**Description:**
Keep order summary visible while scrolling through long checkout form.

**Requirements:**
- Sticky positioning on desktop
- Doesn't overlap content on mobile
- Smooth scroll behavior

**Acceptance Criteria:**
- [ ] Summary stays visible on desktop
- [ ] Mobile experience not degraded

---

### Issue #60: Add express checkout options
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `checkout`

**Description:**
Add Apple Pay, Google Pay buttons for faster checkout.

**Requirements:**
- Apple Pay integration
- Google Pay integration
- Stripe Payment Request Button
- Display based on device support

**Acceptance Criteria:**
- [ ] Express checkout buttons display when supported
- [ ] Payment completes successfully

---

### Issue #61: Add checkout progress indicator
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `checkout`

**Description:**
Visual stepper showing Address -> Delivery -> Payment -> Review.

**Requirements:**
- Step indicator component
- Current step highlighted
- Completed steps marked
- Clickable to go back (when valid)

**Acceptance Criteria:**
- [ ] Progress indicator displays
- [ ] Current step clear
- [ ] Navigation works

---

### Issue #62: Add gift options/messaging
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `checkout`

**Description:**
Allow gift messages and gift wrapping options.

**Requirements:**
- Gift message text field
- Gift wrapping option (if offered)
- Message included on packing slip
- Hide prices on gift orders

**Acceptance Criteria:**
- [ ] Gift message option available
- [ ] Message appears on order

---

### Issue #63: Add promo code validation feedback
**Priority:** Medium | **Type:** Enhancement | **Labels:** `enhancement`, `medium-priority`, `checkout`

**Description:**
Show success/error states clearly when applying discount codes.

**Requirements:**
- Loading state while validating
- Success message with discount amount
- Clear error for invalid codes
- Remove code option

**Acceptance Criteria:**
- [ ] Validation feedback is clear
- [ ] Discount amount shown on success
- [ ] Errors are helpful

---

### Issue #64: Fix shipping option negative price workaround
**Priority:** Medium | **Type:** Bug | **Labels:** `bug`, `medium-priority`, `checkout`, `shipping`

**Description:**
Line 247 hides options with price < -10. Properly fix the underlying issue.

**Location:**
`src/modules/checkout/components/shipping/index.tsx:247`

**Current Workaround:**
```tsx
calculatedPricesMap[option.id] > -10 && (
```

**Issue:**
This is a workaround for negative pricing. The root cause should be identified and fixed properly.

**Acceptance Criteria:**
- [ ] Root cause identified
- [ ] Proper fix implemented
- [ ] Workaround removed

---

## Blog/Recipes Page

### Issue #65: Update recipes metadata with Grillers Pride branding
**Priority:** Medium | **Type:** Bug | **Labels:** `bug`, `medium-priority`, `recipes`

**Description:**
Generic description "Browse our collection of delicious recipes" should include branding.

**Location:**
`src/app/[countryCode]/(main)/recipes/page.tsx:13-16`

**Acceptance Criteria:**
- [ ] Title includes Grillers Pride
- [ ] Description is brand-specific

---

### Issue #66: Add JSON-LD Recipe structured data
**Priority:** High | **Type:** SEO | **Labels:** `seo`, `high-priority`, `recipes`

**Description:**
Add Recipe schema for rich search results (cook time, ingredients, nutrition).

**Requirements:**
Add JSON-LD with:
- Recipe name and description
- Cook time, prep time
- Ingredients list
- Instructions
- Nutrition info (if available)
- Images
- Ratings (if available)

**Acceptance Criteria:**
- [ ] Recipe schema on all recipe pages
- [ ] Schema validates in testing tools
- [ ] Rich results appear in search

---

### Issue #67: Add recipe filtering/categories
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `recipes`

**Description:**
Filter recipes by category, cooking method, difficulty, dietary restrictions.

**Requirements:**
- Category filter
- Cooking method filter (grill, oven, etc.)
- Difficulty level
- Dietary tags (gluten-free, etc.)

**Acceptance Criteria:**
- [ ] Filters display on recipes page
- [ ] Filtering works correctly
- [ ] URL updates with filters

---

### Issue #68: Add recipe search functionality
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `recipes`

**Description:**
Search within recipes content.

**Requirements:**
- Search input on recipes page
- Search recipe titles and content
- Instant results or dedicated results page

**Acceptance Criteria:**
- [ ] Recipe search works
- [ ] Results are relevant

---

### Issue #69: Add recipe print functionality
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `recipes`

**Description:**
Printer-friendly recipe format.

**Requirements:**
- Print button on recipe page
- Print stylesheet
- Clean format without navigation

**Acceptance Criteria:**
- [ ] Print button available
- [ ] Printed recipe is clean and readable

---

### Issue #70: Add recipe social sharing
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `recipes`

**Description:**
Share recipes to Pinterest (major recipe traffic source), Facebook, Twitter.

**Requirements:**
- Share buttons on recipe pages
- Pinterest especially important for food
- Pre-populated share content

**Acceptance Criteria:**
- [ ] Share buttons display
- [ ] Pinterest sharing works with recipe image

---

### Issue #71: Add related products on recipe pages
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `recipes`

**Description:**
Cross-link products used in recipes for conversion.

**Requirements:**
- Products section on recipe page
- Products linked from Strapi recipe
- Add to cart functionality

**Acceptance Criteria:**
- [ ] Related products display
- [ ] Products can be added to cart from recipe

---

### Issue #72: Add recipe ratings/reviews
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `recipes`

**Description:**
Allow users to rate recipes.

**Requirements:**
- Star rating input
- Average rating display
- Review comments (optional)

**Acceptance Criteria:**
- [ ] Users can rate recipes
- [ ] Average rating displays

---

### Issue #73: Add recipe save/favorites
**Priority:** Low | **Type:** Feature | **Labels:** `feature`, `low-priority`, `recipes`

**Description:**
Allow logged-in users to save favorite recipes.

**Requirements:**
- Save/heart button
- Saved recipes in account
- Persist across sessions

**Acceptance Criteria:**
- [ ] Users can save recipes
- [ ] Saved recipes accessible in account

---

### Issue #74: Add cooking tips/video embeds
**Priority:** Medium | **Type:** Feature | **Labels:** `feature`, `medium-priority`, `recipes`

**Description:**
Support video content in recipes from Strapi.

**Requirements:**
- Video embed support
- YouTube/Vimeo integration
- Responsive video player

**Acceptance Criteria:**
- [ ] Videos display in recipes
- [ ] Videos are responsive

---

## Labels Reference

Create these labels in GitHub:

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | #d73a4a | Something isn't working |
| `feature` | #a2eeef | New feature or request |
| `enhancement` | #84b6eb | Improvement to existing feature |
| `accessibility` | #7057ff | Accessibility improvements |
| `seo` | #0e8a16 | Search engine optimization |
| `testing` | #fbca04 | Testing related |
| `documentation` | #0075ca | Documentation improvements |
| `legal` | #b60205 | Legal/compliance requirements |
| `cleanup` | #fef2c0 | Code cleanup/tech debt |
| `analytics` | #5319e7 | Analytics and tracking |
| `critical` | #b60205 | Critical priority |
| `high-priority` | #d93f0b | High priority |
| `medium-priority` | #fbca04 | Medium priority |
| `low-priority` | #0e8a16 | Low priority |
| `home-page` | #c5def5 | Home page related |
| `header` | #c5def5 | Header related |
| `footer` | #c5def5 | Footer related |
| `pdp` | #c5def5 | Product detail page |
| `collections` | #c5def5 | Collections page |
| `checkout` | #c5def5 | Checkout related |
| `recipes` | #c5def5 | Recipes/blog related |
| `shipping` | #c5def5 | Shipping related |
| `performance` | #d4c5f9 | Performance related |
