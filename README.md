# Balun

Monorepo containing a Nuxt 4 frontend and a Sanity Studio CMS. Headless Shopify integration.

## Structure

```
balun/
├── web/          # Nuxt 4 frontend
├── studio/       # Sanity Studio
├── locales.mjs   # Locale/market list shared by both
└── docs/         # Strategy and how-to notes
```

## Getting started

**Sanity Studio**

```bash
cd studio
npm install
npm run dev
```

**Nuxt**

```bash
cd web
npm install
npm run dev
```

Nuxt reads from Sanity via the `@nuxtjs/sanity` module (config in `web/nuxt.config.ts`,
project `pful3cpt` / dataset `production`, public read-only — no token needed for published
content). GROQ queries live in `web/app/utils/queries.ts`; pages are in `web/app/pages/`.

For the browser to read from Sanity, the Nuxt dev origin must be allowed in the project's
CORS settings (already added for `http://localhost:3000`, `:3001` and `:3333`). To add another
origin:

```bash
cd studio
npx sanity cors add http://localhost:3000 --no-credentials
```

## Content model

- **Singletons** (one doc each): `homePage`, `infoPage`, `feedPage`, `livePage`, plus
  `siteSettings`.
- **Collections**: `product` (synced from Shopify by Sanity Connect; editorial fields layered
  on top — Shopify stays source of truth for title/price/inventory) and `feedPost` (feed
  entries, category = stream | products | events | blog).

## Further reading

- Shopify + localization: `docs/shopify-and-localization-strategy.md`
- Caching: `docs/performance-caching.md`
- Geo pricing and drop gating: `docs/geo-and-access-strategy.md`
- Live streaming: `docs/live-streaming.md`
- Launch checklist: `docs/launch-checklist.md`
