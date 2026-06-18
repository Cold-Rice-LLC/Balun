# Balun

Monorepo containing a Nuxt 4 frontend and a Sanity Studio CMS. Headless Shopify integration.

## Structure

```
balun/
├── nuxt/     # Nuxt 4 frontend
└── sanity/   # Sanity Studio
```

## Getting started

**Sanity Studio**

```bash
cd sanity
npm install
npm run dev
```

**Nuxt**

```bash
cd nuxt
npm install
npm run dev
```

Nuxt reads from Sanity via the `@nuxtjs/sanity` module (config in `nuxt/nuxt.config.ts`,
project `pful3cpt` / dataset `production`, public read-only — no token needed for published
content). GROQ queries live in `nuxt/app/utils/queries.ts`; pages are in `nuxt/app/pages/`.

For the browser to read from Sanity, the Nuxt dev origin must be allowed in the project's
CORS settings (already added for `http://localhost:3000` and `:3001`). To add another origin:

```bash
cd sanity
npx sanity cors add http://localhost:3000 --no-credentials
```

## Content model

- **Singletons** (one doc each): `homePage` (selects featured products), `infoPage`,
  `feedPage`, `livePage`, plus `siteSettings`.
- **Collections**: `product` (supplemental content for a Shopify product — linked by Shopify
  GID + handle; Shopify stays source of truth for title/price/inventory) and `feedPost`
  (feed entries, category = stream | products | events | blog).

### Shopify (next phase)

Products currently store only `shopifyGid` + `shopifyHandle`; live Shopify data
(title/price/images) is not yet fetched. Planned: a Nuxt server route calling the Shopify
Storefront API to merge live data at render time (cached — see `docs/performance-caching.md`).
See pages for `TODO(shopify)` markers.

**How products get into Sanity** — Shopify is always the source of truth for commerce data; the
Sanity `product` doc only adds editorial content + a pointer. Two viable approaches (decide before
building; a hand-rolled `products/*` webhook is **not** recommended — it re-implements the option
below, worse):

- **Reference-only + live cached fetch (lean default):** editors create a `product` doc and enter
  the Shopify handle/GID; the storefront fetches catalog data live (cached) from the Storefront API.
  Best fit for a curated merch catalog (dozens of SKUs). No sync infra, no drift.
- **Sanity Connect (official Shopify→Sanity sync app):** auto-creates/updates/deletes product docs
  from Shopify. Choose if you want products to appear in Sanity automatically and to build listing/
  collection pages from Sanity queries. Trade-off: imposes its own `shopify`-namespaced doc shape.

Either way, inventory/price are still fetched live (short-TTL cached); sync only covers catalog
structure.
