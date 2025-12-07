# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 e-commerce storefront for Grillers, built with the Medusa.js v2 backend. It integrates with Strapi CMS for content management and Algolia for search functionality.

## Development Commands

### Core Development
```bash
yarn dev         # Start development server with Turbopack on port 8000
yarn build       # Build production bundle
yarn start       # Start production server on port 8000
yarn lint        # Run ESLint
```

### Bundle Analysis
```bash
yarn analyze     # Analyze bundle size (sets ANALYZE=true)
```

## Required Environment Variables

Critical variables that must be set:
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` - Medusa publishable API key (required)
- `MEDUSA_BACKEND_URL` - Medusa backend URL (defaults to http://localhost:9000)
- `STRAPI_ENDPOINT` - Strapi CMS endpoint
- `STRAPI_API_TOKEN` - Strapi authentication token
- `ALGOLIA_APPLICATION_ID` - Algolia app ID
- `ALGOLIA_SEARCH_API_KEY` - Algolia search API key
- `NEXT_PUBLIC_STRIPE_KEY` - Stripe public key for payment processing

## Architecture Overview

### Application Structure
The app uses Next.js 15 App Router with the following key architectural decisions:

1. **Route Groups**: 
   - `(main)` - Public storefront routes
   - `(checkout)` - Checkout flow with separate layout

2. **Internationalization**: 
   - Dynamic `[countryCode]` routing for region-specific stores
   - Middleware handles automatic country detection and redirection

3. **Data Fetching**:
   - **Medusa SDK** (`src/lib/config.ts`) for e-commerce data
   - **Strapi GraphQL** (`src/lib/strapi/`) for CMS content
   - **Algolia** (`src/lib/algolia/`) for search functionality

4. **State Management**:
   - Server Components for initial data fetching
   - Server Actions for mutations
   - SWR for client-side data fetching where needed

### Key Integration Points

1. **Medusa Backend**:
   - Product catalog, cart, checkout flow
   - Customer accounts and orders
   - Region/country management

2. **Strapi CMS**:
   - Homepage content
   - Collections and categories metadata
   - Recipe content
   - PDPs enriched content

3. **Algolia Search**:
   - Product search with faceted filtering
   - Collection page search experiences

4. **Stripe Payments**:
   - Integrated via `@stripe/react-stripe-js`
   - Payment element in checkout

### Module Organization

- `/modules/` - Feature-based modules containing components and templates
  - Each module has `components/` and `templates/` subdirectories
  - Templates compose components into page-level layouts

- `/lib/data/` - Data fetching functions organized by domain
  - Separate files for cart, products, orders, etc.
  - Strapi-specific fetchers in `/lib/data/strapi/`

- `/lib/hooks/` - Custom React hooks for common functionality

### Important Middleware

The middleware (`src/middleware.ts`) handles:
- Country code detection from URL or IP geolocation
- Automatic redirection to appropriate regional store
- Cache ID management for region-specific caching

### Styling and UI

- **Tailwind CSS** for styling
- **@medusajs/ui** component library
- **@headlessui/react** for accessible UI components
- Custom fonts in `/src/styles/fonts/`

### TypeScript Configuration

- Strict mode enabled
- Path aliases configured:
  - `@lib/*` → `src/lib/*`
  - `@modules/*` → `src/modules/*`
- Build errors are ignored (see `ignoreBuildErrors: true` in next.config.js)

## Performance Considerations

- Next.js 15 with Turbopack for faster development builds
- Static pre-rendering where possible
- Server Components by default
- Image optimization with Next.js Image component
- Bundle analysis available via `yarn analyze`