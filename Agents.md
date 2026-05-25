# Agent Notes: Storefront Repo

Canonical full-project repo guide:

```text
/Users/aviswerdlow/coding/grillerspride/Agents.md
```

This repository is `mintpixels/grillers-medusa-frontend`. It owns the customer-facing Medusa/Next.js storefront on Vercel: homepage, PDP, PLP/search, cart UI, checkout UI, account, navigation, recipes, learn, collections, frontend analytics, and experiment assignment.

Before editing, run:

```bash
git status --short
git branch --show-current
git remote -v
```

Do not stage unrelated dirty files. This repo often has local work in progress.

Common checks:

```bash
yarn jest --runTestsByPath path/to/test.ts
yarn test
yarn build
yarn smoke:storefront-backend
```

Critical contracts:

- Do not invent product facts. Product facts must come from Strapi or Medusa.
- Do not add wallet payment messaging unless backend support exists. Current checkout supports Stripe credit cards.
- Do not fire `order_completed` from client confirmation pages. Purchase tracking belongs to the Medusa backend `order.placed` subscriber.
- Use Mobbin for UX patterns when requested or when the treatment is unclear.
- Store customer-facing generated imagery in Strapi unless it is a static design-system asset.
- QuickBooks SKUs/names are mutable operational fields. When cart, checkout, or account code touches QuickBooks-backed catalog metadata, preserve and pass through `qbd_list_id`/QuickBooks `ListID` when available; do not rely on SKU as the canonical QuickBooks key.
- Do not show QuickBooks accounting item names, list IDs, or seasonal `Y`/`P` sorting prefixes to customers. Storefront and email display should use Strapi/Medusa customer-facing titles.
