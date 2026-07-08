# Shopify Sync & Localization Strategy (headless Shopify + Sanity + Nuxt on Vercel)

> Status: **recommendations, not yet built.** Companion to
> [geo-and-access-strategy.md](./geo-and-access-strategy.md) (drop gating, geo pricing mechanics)
> and [performance-caching.md](./performance-caching.md) (why locale must live in the URL).

## Context

Two intertwined decisions:

1. **How do Shopify products/collections get into (or get referenced by) Sanity?**
   Candidate: [Sanity Connect for Shopify](https://www.sanity.io/docs/apis-and-sdks/sanity-connect-for-shopify).
2. **How do we localize?** Client wants Shopify Markets, market-specific content, currency
   switching, and possibly languages + a language picker later. Site hosts on Vercel.

---

## 1. Product sync: reference-only now, Sanity Connect only if editorial pain appears

### What Sanity Connect is

Official Shopify app. Pushes products, variants, and collections into the dataset as
`shopify.*`-namespaced documents within seconds of a save in Shopify admin — no webhooks to build
or host. Supports a "custom sync" endpoint to reshape data, and can sync Sanity content back to
Shopify as metafields/metaobjects.

### Why it doesn't solve our core problem

Synced documents carry a **snapshot of base-currency prices**. With Shopify Markets, the correct
price/currency/availability for a visitor exists only via the Storefront API
`@inContext(country: XX)` directive at request time. The geo strategy already commits to fetching
live commerce data in the **client-fetched buy-box island**. So Connect can never be the pricing
source; its value is purely editorial.

### Trade-off table

|                     | Reference-only (current)             | Sanity Connect                                            |
| ------------------- | ------------------------------------ | --------------------------------------------------------- |
| Studio UX           | Editors paste GID/handle             | Editors see real titles/images, pick synced docs           |
| Listing pages       | Need a Storefront API fetch          | One GROQ query                                             |
| Price/inventory     | Live via `@inContext` (required)     | **Still** live via `@inContext` — synced prices moot       |
| Cost                | Nothing                              | Docs count toward Sanity quota; variants are separate docs unless custom sync; synced fields machine-owned |

### Decision

- **Stay reference-only** (`product` docs hold `shopifyGid` + `shopifyHandle` + supplemental
  content). Right-sized for a curated drop catalog of dozens of SKUs.
- The **Storefront API `@inContext` fetch layer is on the critical path either way** — build it
  first.
- Revisit Connect if the catalog grows or editors feel real pain pasting GIDs. Reversal is cheap
  (install app, reference `shopify.product`, migrate). **Do not** hand-roll a `products/update`
  webhook sync — that re-implements Connect, worse.

---

## 2. Localization: three axes, never conflated

| Axis                | What it controls                                   | Owned by                                  |
| ------------------- | -------------------------------------------------- | ----------------------------------------- |
| **Market (country)**| Currency, price, availability, per-market content  | Shopify Markets + our content modeling     |
| **Language**        | Translations                                       | Sanity (editorial) + Shopify translated content (titles, checkout) |
| **IP geolocation**  | Where the visitor physically is                    | Edge middleware — a *hint* or a *gate*, never content selection |

### URL structure: `/{lang}-{country}` prefix

`/en-us`, `/en-gb`, `/zh-cn` — lowercase, ISO codes (note: UK is `gb`). This is the industry
convention, and for this project it is **load-bearing**:

- **Caching.** The drop-survival plan assumes one cached HTML shell per page served globally.
  Cookie- or IP-driven locale would fragment the edge cache per visitor. Locale-in-URL means each
  locale is one clean cache entry. The geo doc's rule "keep the HTML shell geo-agnostic" becomes:
  **keep the shell IP-agnostic — locale lives in the URL, live prices live in the buy-box island.**
- Only ship combos we actually support — never the cartesian product of languages × markets.
- **Launch with one language but keep the prefix** if Markets is live at launch (`/en-us`,
  `/en-gb`). Retrofitting URLs later is an SEO migration; starting with them is nearly free.
- Use `@nuxtjs/i18n` (prefix strategy) for routing, `hreflang`, and canonicals.

### Currency

**Currency is not its own picker.** Currency follows market: the "currency switcher" is a market
switcher (changes the URL prefix), and `@inContext(country: XX)` returns that market's currency
automatically. An independent currency toggle fights Markets and creates price/checkout mismatches.

### IP on Vercel

`x-vercel-ip-country` arrives free on every request. Exactly two uses:

1. **First-visit market suggestion** — edge middleware + banner/modal ("Looks like you're in
   Germany — switch to /en-de?"), remembered in a cookie. **Never a hard redirect**: Googlebot
   crawls from US IPs (auto-redirects hide other markets from indexing — `hreflang` handles that),
   and VPN users/travelers hate it.
2. **Drop-day country gating** per the geo doc — keyed on **real IP**, not URL. A UK visitor on
   `/en-us` during a US-only drop still gets gated by IP; the Markets catalog is what actually
   blocks the purchase.

---

## 3. Sanity content modeling: two mechanisms for two axes

### Language → field-level i18n, later

When a second language becomes real, use the **`internationalized-array`** plugin (field-level):
one document, `title[language == $lang][0].value` + `coalesce()` fallback to English. Right fit
for a brand site where pages share structure/images and translations publish together.
Document-level i18n (doc per language) buys independent publishing workflows at the cost of
document sprawl — only if some content type develops fully divergent per-language editorial.

**Do not add the plugin until a second language is scheduled.** `string` → internationalized array
is a mechanical migration later; unused i18n structure is permanent editorial friction now.

### Market-specific content → explicit audience fields, not localization plugins

Model it directly and **coarsely** (section/document level, not sentence level):

```js
// e.g. on a hero section, announcement, featured-products slot:
{
  name: 'markets',
  type: 'array',
  of: [{type: 'string'}],
  options: {list: ['us', 'gb', 'de' /* … */]},
  description: 'Markets this shows in. Leave empty to show everywhere.',
}
```

```groq
*[_type == "announcement" && (count(markets) == 0 || $market in markets)]
```

Fine-grained market forking of copy is an editorial tar pit — resist it.

---

## How it composes

The **URL prefix is the single source of truth** for what a page shows: it selects Sanity language
fields, filters market-targeted content, and sets `@inContext(country:)` for the buy-box island's
live price/availability fetch. IP is only a first-visit suggestion and the drop-day edge gate.
Shopify Markets remains the purchase boundary. Sanity Connect is skipped in favor of the existing
reference-only link because the live Storefront fetch layer must exist regardless, and Markets
makes synced prices moot.

## Build order

1. Storefront API client + buy-box island with `@inContext`
2. Markets configuration in Shopify
3. `@nuxtjs/i18n` URL prefixes (single language)
4. Market-audience fields in Sanity
5. Geo-suggestion banner (edge middleware + cookie)
6. *(later)* `internationalized-array` + language picker
