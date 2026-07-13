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

### Decision (revised July 2026: Connect adopted)

Originally deferred; **adopted once the client-editor workflow became the priority** — editors
pick real synced products in the Studio instead of pasting GIDs. The runtime architecture did not
change: commerce data still comes live from the Storefront API via `@inContext`; Connect is
editorial-only.

How it's set up:

- Connect (Direct Sync, automatic) writes `product` / `productVariant` / `collection` documents
  (ids `shopifyProduct-<id>` etc.). The machine-owned **`store` object** on each doc is defined
  read-only in `schemaTypes/objects/shopify*.js`; editorial fields (`tagline`, `body`, `gallery`)
  are siblings Connect never touches.
- GROQ flattens identity out of `store` (`"gid": store.gid`, `"title": store.title`) and filters
  listings with `[@->store.status == "active" && @->store.isDeleted != true]->` (filter before
  deref, or removed items leave null holes).
- **Never** display `store.priceRange` / variant `price` — base-currency snapshots, wrong under
  Markets. Prices render only from the live `/api/products` fetch.
- The **Storefront API `@inContext` fetch layer was built first** — it's on the critical path
  regardless of sync strategy. **Do not** hand-roll a `products/update` webhook sync.

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

The localization plugins key on **language** — to them `/en-us` and `/en-gb` are the same `en`
locale and get identical content. "US shows 10 featured products, UK shows 5" is a
**market/audience** decision, so it's modeled with plain fields + GROQ, driven by `$market` from
the URL. Two patterns:

**Pattern A — tag each item with its markets** (default; best when one market's list is a subset
of another's):

```js
// homePage.featuredProducts becomes an array of:
{
  type: 'object',
  fields: [
    {name: 'product', type: 'reference', to: [{type: 'product'}]},
    {
      name: 'markets',
      type: 'array',
      of: [{type: 'string'}],
      options: {list: ['us', 'gb', 'de' /* … */]},
      description: 'Markets this shows in. Leave empty to show everywhere.',
    },
  ],
}
```

```groq
featuredProducts[count(markets) == 0 || $market in markets]{ product->{...} }
```

Editors manage one list; items shown everywhere just leave `markets` empty.

**Pattern B — per-market override lists** (for genuinely different lists, ordering, or wholesale
swaps like a different hero per market):

```js
{name: 'featuredProducts', type: 'array' /* … */},        // default list
{name: 'marketOverrides', type: 'array', of: [{
  type: 'object',
  fields: [
    {name: 'market', type: 'string', options: {list: [/* … */]}},
    {name: 'featuredProducts', type: 'array' /* … */},    // full replacement list
  ],
}]}
```

```groq
"featured": coalesce(
  marketOverrides[market == $market][0].featuredProducts,
  featuredProducts
)[]->{ ... }
```

The `coalesce()` fallback-to-default is the key move in both patterns: editors only do extra work
for markets that actually differ, and a new market gets default content on day one. Default to
**A** for lists; reserve **B** for big swaps. Keep granularity **coarse** (section/document level)
— fine-grained market forking of copy is an editorial tar pit.

### Catalog vs. editorial visibility — the coordination rule

Sanity and Shopify each hold an opinion about market visibility, and they must not be confused:

- **Shopify Markets catalog** = *can it be priced and bought here.* Source of truth for purchase.
- **Sanity market tags** = *editorial emphasis only* — what we choose to show/feature.

If an editor features a product in a market whose catalog doesn't publish it, the Storefront API
returns `null` for it and the merge layer drops it or renders "unavailable" — the failure mode is
graceful. Guardrails:

1. **Convention:** when scoping a drop, editors adjust *both* the Markets catalog and the Sanity
   market tags.
2. **Later nicety:** a Studio validation / dashboard widget cross-checking featured products
   against per-market catalog availability (cheap once the Storefront client exists).

**Cache note:** `$market` in GROQ means each market prefix gets its own cached HTML shell — a
handful of markets × pages, exactly what the URL-prefix design budgeted for. No per-visitor
fragmentation.

---

## 4. Colorway grouping (split products)

Some colorways are separate Shopify products ("Speedy 01 · Grey" / "· Blue" — own PDP, inventory,
drop timing); others keep color as a variant option inside one product. For split products, the
PDP shows a colorways rail linking siblings.

**Mechanism: Shopify tag convention** — tag every member `group:<slug>` (e.g. `group:speedy-01`)
in Shopify. Connect syncs tags to `store.tags` (comma-separated string). PDP sibling query:

```groq
"colorways": *[
  _type == "product"
  && $groupTag in string::split(store.tags, ", ")
  && _id != ^._id
  && store.status == "active" && store.isDeleted != true
]{ "title": store.title, "slug": store.slug.current, "gid": store.gid, gallery }
```

- Consistent with the lifecycle rule: grouping happens in Shopify at product-creation time; a new
  colorway joins every sibling's rail with zero Sanity edits. No tag → no rail (non-split products
  need nothing).
- Color label = title suffix after `·`; swatch = the sibling's image.
- Known limitation: tag membership is unordered. If curated ordering/custom swatches are ever
  needed, add a `productGroup` document as an override with coalesce-to-default onto tag siblings
  (same pattern as market overrides) — don't start there.
- Markets composes for free: colorways are products, so per-market catalog availability applies
  per colorway; the buy-box null handling hides "not sold here" siblings.

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

> Operational how-to for step 2–4 (adding a country): [adding-a-market.md](./adding-a-market.md).
