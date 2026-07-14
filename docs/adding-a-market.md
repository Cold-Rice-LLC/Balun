# Runbook: Adding a New Market

Operational checklist for adding a market (country) to the storefront. Companion
to [shopify-and-localization-strategy.md](./shopify-and-localization-strategy.md),
which explains *why* the model is shaped this way — read §2–3 there if the
market-vs-language distinction below is unfamiliar.

> A **market** is a country: it controls currency, price, availability, and which
> market-scoped content shows. It is **not** a language. Adding German *content*
> (translation) is a separate task — see [Markets vs languages](#markets-vs-languages).

---

## The change: one file + Shopify admin

All locale config lives in the repo-root **[`locales.mjs`](../locales.mjs)** —
the single source of truth consumed by both the Nuxt app (`i18n.locales`) and
the Studio (plugin languages, schema market options). Example: adding
**Germany**.

### 1. `locales.mjs` — markets, languages, and supported combos

```js
export const MARKETS = [
  {id: 'us', title: 'United States'},
  {id: 'gb', title: 'United Kingdom'},
  {id: 'de', title: 'Germany'},   // ← add the market
]

const COMBOS = [
  ['en', 'us'],
  ['en', 'gb'],
  ['es', 'us'],
  ['en', 'de'],                   // ← add the combo(s) this market supports
]
```

That's it on the code side. The `/en-de` URL prefix, the market switcher entry,
the Studio's market options, and `useMarket()` all derive from this file.
Adding a **language** is the same file: add to `LANGUAGES` and list its combos —
only combos you actually support, never the cartesian product.

> Restart both dev servers after editing — the file is read at config time by
> Nuxt and the Studio.

### 2. Shopify admin → Markets — the purchase boundary

Enable the market/country in Shopify. This is what makes
`@inContext(country: DE)` return real price, currency, and availability. Without
it the buy box renders null / "unavailable" for that market — graceful, but no
sale. **This is the real gate on buying**, independent of any Sanity content.

---

## Code agreement: get the casing right

`useMarket()` derives everything from the URL locale, so the codes must line up.
Use **ISO country codes** — the classic trap is the UK, whose code is `gb`, not
`uk`.

| Source                                   | Value (Germany) | Used for                    |
| ---------------------------------------- | --------------- | --------------------------- |
| `i18n.locales[].code`                    | `en-de`         | URL prefix                  |
| `MARKETS[].id` / GROQ `$market`          | `de` (lower)    | Sanity content filter       |
| `@inContext(country:)` / `useMarket().country` | `DE` (upper) | Shopify pricing             |

`useMarket()` splits `en-de` → `lang: 'en'`, `country: 'DE'`, `market: 'de'`.

---

## What you do NOT have to change

Adding a market is safe by design — existing content keeps working:

- **Featured products / any market-scoped list.** Items with no markets set show
  everywhere; per-market lists fall back to the default via `coalesce()`. A new
  market gets default content on day one. You only add work for markets that
  should differ.
- **Non-scoped pages** (footer links, editorial that's identical everywhere)
  render the same for every market — no `$market` involved. Leave them alone.
- **The MarketSwitcher** updates itself from `i18n.locales`.

Adding a market never retro-forks existing content; it just makes a new prefix
available and lets editors optionally scope content to it.

---

## Verify

1. `npm run --prefix nuxt dev`, visit `/en-de/` — the page renders (default
   content until you scope anything), and Germany appears in the footer market
   switcher.
2. Switch to Germany in the Studio's featured-product slots (or a page's market
   override) and confirm `/en-de` shows the scoped content while `/en-us` does
   not.
3. Confirm the buy box shows real EUR pricing on a product page — if it shows
   "unavailable", the Shopify Markets step (#2) isn't done.

---

## Markets vs languages

Adding a market does **not** add a language. `/en-de` is *English content,
German market*. To serve German **words**, you add a language — a separate,
later task (strategy doc build-order step 6: the `internationalized-array`
plugin, keyed on `$lang`).

The two compose without multiplying: market picks *which* content block, language
picks the *translation of the words* inside it. Market overrides are authored
**once per country** with translatable fields inside — never a
language × market matrix. See the strategy doc §2–3.
