# Active Issues

This document tracks 10 GitHub issues from [mintpixels/grillers-documentation](https://github.com/mintpixels/grillers-documentation) to be worked on in this repository.

---

## 1. #58 - [Checkout] Fix typo in shipping disclaimer

**Labels:** `bug`, `low-priority`, `checkout`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/58

### Description
"guarenteed" should be "guaranteed" at line 382.

### Location
`src/modules/checkout/components/shipping/index.tsx:382`

### Current
```
*This is estimate and specific days are not guarenteed.
```

### Expected
```
*This is an estimate and specific days are not guaranteed.
```

### Acceptance Criteria
- [ ] Typo fixed
- [ ] Grammar corrected ("is estimate" -> "is an estimate")

---

## 2. #13 - [Header] Phone number should be clickable (tel: link)

**Labels:** `enhancement`, `low-priority`, `header`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/13

### Description
Phone number at line 50-51 is plain text, should be a clickable tel: link.

### Location
`src/modules/layout/templates/nav/header.tsx:50-51`

### Current State
```tsx
<span className="hidden md:inline-block...">(888) 627-3284</span>
```

### Expected State
```tsx
<a href="tel:+18886273284" className="...">(888) 627-3284</a>
```

### Acceptance Criteria
- [ ] Phone number is clickable
- [ ] Opens phone app on mobile devices

---

## 3. #34 - [Collections] Remove legacy collection pages

**Labels:** `cleanup`, `low-priority`, `collections`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/34

### Description
Delete deprecated `collections-old` and `categories-old` routes.

### Location
- `src/app/[countryCode]/(main)/collections-old/`
- `src/app/[countryCode]/(main)/categories-old/`

### Acceptance Criteria
- [ ] Legacy routes removed
- [ ] No broken links to old routes

---

## 4. #2 - [Home] Update home page metadata to Grillers Pride branding

**Labels:** `bug`, `high-priority`, `home-page`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/2

### Description
Current metadata shows "Medusa Next.js Starter Template" instead of Grillers Pride branding.

### Location
`src/app/[countryCode]/(main)/page.tsx:16-20`

### Current State
```typescript
export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description: "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}
```

### Expected State
Update to Grillers Pride branding with appropriate title and description.

### Acceptance Criteria
- [ ] Title reflects Grillers Pride brand
- [ ] Description is customer-facing and SEO-optimized

---

## 5. #20 - [PDP] Update metadata to use Grillers Pride branding

**Labels:** `bug`, `high-priority`, `pdp`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/20

### Description
Metadata at line 74 shows "Medusa Store". Update to "Grillers Pride".

### Location
`src/app/[countryCode]/(main)/products/[handle]/page.tsx:74-81`

### Current State
```typescript
return {
  title: `${product.title} | Medusa Store`,
  ...
}
```

### Acceptance Criteria
- [ ] Product titles show "| Grillers Pride"
- [ ] OpenGraph tags use correct branding

---

## 6. #66 - [Recipes] Update metadata with Grillers Pride branding

**Labels:** `bug`, `medium-priority`, `recipes`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/66

### Description
Generic description "Browse our collection of delicious recipes" should include branding.

### Location
`src/app/[countryCode]/(main)/recipes/page.tsx:13-16`

### Acceptance Criteria
- [ ] Title includes Grillers Pride
- [ ] Description is brand-specific

---

## 7. #29 - [Collections] Update metadata to use Grillers Pride branding

**Labels:** `bug`, `high-priority`, `collections`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/29

### Description
Metadata at line 78 shows "Medusa Store". Update to Grillers Pride.

### Location
`src/app/[countryCode]/(main)/collections/[handle]/page.tsx:77-83`

### Acceptance Criteria
- [ ] Collection titles show "| Grillers Pride"

---

## 8. #53 - [Checkout] Add checkout metadata with Grillers Pride branding

**Labels:** `bug`, `high-priority`, `checkout`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/53

### Description
Checkout title is just "Checkout" - add full branding.

### Location
`src/app/[countryCode]/(checkout)/checkout/page.tsx:9-11`

### Acceptance Criteria
- [ ] Title includes Grillers Pride
- [ ] Meta description added

---

## 9. #14 - [Footer] Replace Medusa branding with Grillers Pride

**Labels:** `bug`, `critical`, `footer`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/14

### Description
Footer shows "Medusa Store" and links to Medusa GitHub/docs. Update to Grillers Pride branding.

### Location
`src/modules/layout/templates/footer/index.tsx`

### Items to Update
- Line 23-24: "Medusa Store" text
- Lines 112-144: Medusa links section (GitHub, Documentation, Source code)
- Line 151: Copyright "Medusa Store"

### Acceptance Criteria
- [ ] All Medusa references removed
- [ ] Grillers Pride branding throughout
- [ ] Relevant company links added

---

## 10. #9 - [Header] Add skip-to-main-content link for accessibility

**Labels:** `high-priority`, `header`, `accessibility`, `medusa-frontend`  
**GitHub:** https://github.com/mintpixels/grillers-documentation/issues/9

### Description
WCAG 2.1 AA requires skip navigation link. Not present in current implementation.

### SOW Reference
> ADA Compliance with WCAG 2.1 Level AA Standards

### Requirements
- Visually hidden link that appears on focus
- Links to main content area
- First focusable element on page

### Acceptance Criteria
- [ ] Skip link is first focusable element
- [ ] Skip link visible when focused
- [ ] Skip link jumps to main content

