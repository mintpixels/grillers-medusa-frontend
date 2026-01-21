# Common Components Library

This directory contains reusable UI components used throughout the Grillers Pride storefront.

## Table of Contents

- [Breadcrumb](#breadcrumb)
- [DeleteButton](#deletebutton)
- [LazySection](#lazysection)
- [LineItemOptions](#lineitemoptions)
- [LineItemPrice](#lineitemprice)
- [LocalizedClientLink](#localizedclientlink)
- [NewsletterForm](#newsletterform)
- [SocialShare](#socialshare)
- [VideoEmbed](#videoembed)

---

## Breadcrumb

Navigation breadcrumb component with JSON-LD structured data support.

### Usage

```tsx
import Breadcrumb, { buildProductBreadcrumbs } from "@modules/common/components/breadcrumb"

// For product pages
const items = buildProductBreadcrumbs(product.collection, countryCode)

<Breadcrumb items={items} currentPage={product.title} />
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `BreadcrumbItem[]` | Yes | Array of breadcrumb items with `label` and `href` |
| `currentPage` | `string` | Yes | Current page name (not linked) |

---

## DeleteButton

Button component for removing items (cart items, wishlist items, etc.).

### Usage

```tsx
import DeleteButton from "@modules/common/components/delete-button"

<DeleteButton id={item.id}>Remove</DeleteButton>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | ID of the item to delete |
| `children` | `ReactNode` | No | Button content |
| `className` | `string` | No | Additional CSS classes |

---

## LazySection

Wrapper component for lazy loading below-the-fold content using Intersection Observer.

### Usage

```tsx
import LazySection from "@modules/common/components/lazy-section"

<LazySection minHeight="400px" rootMargin="200px">
  <ExpensiveComponent />
</LazySection>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to lazy load |
| `fallback` | `ReactNode` | Skeleton | Loading placeholder |
| `rootMargin` | `string` | `"200px"` | Intersection Observer margin |
| `minHeight` | `string` | `"400px"` | Minimum height for placeholder |
| `className` | `string` | `""` | Additional CSS classes |

---

## LocalizedClientLink

Next.js Link component that automatically prepends the country code to URLs.

### Usage

```tsx
import LocalizedClientLink from "@modules/common/components/localized-client-link"

<LocalizedClientLink href="/products/chicken-breast">
  View Product
</LocalizedClientLink>
```

### Props

Extends all Next.js `Link` props.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `href` | `string` | Yes | Path (country code auto-prepended) |
| `children` | `ReactNode` | Yes | Link content |

---

## NewsletterForm

Email newsletter signup form with validation and provider integration.

### Usage

```tsx
import NewsletterForm from "@components/newsletter-form"

// Default variant
<NewsletterForm />

// Footer variant with custom text
<NewsletterForm
  variant="footer"
  title="Stay Updated"
  description="Get exclusive offers and recipes."
  source="footer"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Subscribe to our newsletter"` | Form heading |
| `description` | `string` | `"Get updates..."` | Form description |
| `placeholderText` | `string` | `"Enter your email"` | Input placeholder |
| `buttonText` | `string` | `"Subscribe"` | Submit button text |
| `successMessage` | `string` | `"Thank you..."` | Success message |
| `errorMessage` | `string` | `"Please enter..."` | Error message |
| `source` | `string` | `"website"` | Tracking source |
| `variant` | `"default" \| "footer"` | `"default"` | Visual variant |

### Environment Variables

- `KLAVIYO_API_KEY` + `KLAVIYO_LIST_ID` for Klaviyo
- `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` + `MAILCHIMP_SERVER` for Mailchimp

---

## SocialShare

Social media sharing buttons component.

### Usage

```tsx
import SocialShare from "@modules/common/components/social-share"

<SocialShare
  url={window.location.href}
  title="Delicious Recipe"
  description="Check out this amazing recipe!"
  imageUrl={recipe.image}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string` | Yes | URL to share |
| `title` | `string` | Yes | Share title |
| `description` | `string` | No | Share description |
| `imageUrl` | `string` | No | Image URL for rich sharing |

---

## VideoEmbed

Responsive video embed component supporting YouTube and Vimeo.

### Usage

```tsx
import VideoEmbed from "@modules/common/components/video-embed"

<VideoEmbed
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  title="How to make the perfect steak"
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string` | Yes | YouTube or Vimeo URL |
| `title` | `string` | No | Video title for accessibility |

### Supported URL Formats

- YouTube: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/shorts/`
- Vimeo: `vimeo.com/`, `player.vimeo.com/video/`

---

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader announcements via `aria-live` regions
- Sufficient color contrast
- Visible focus indicators

## Testing

Components have corresponding test files in `src/__tests__/components/`:

```bash
# Run component tests
npm test

# Run with coverage
npm run test:coverage
```
