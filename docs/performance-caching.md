# Performance & Caching Strategy (headless Shopify + Sanity + Nuxt)

> Status: **recommendations, not yet built.** Captured for an upcoming performance pass.

## Context

The site fronts a YouTuber with ~75M subscribers. Traffic is **spiky**: a video drop or merch
launch can send a six-figure concurrent crowd in minutes. The failure mode is the spike, not steady
load. Almost everything here is cacheable; the few things that can't be cached (checkout) are things
Shopify already scales for us.

## Mental model: three tiers of data

### Tier 1 — Static, long cache (changes rarely, editor-controlled)

- All Sanity content: home, info, feed posts, and the _supplemental_ product content
  (taglines, editorial body, galleries).
- Product "catalog" facts from Shopify: title, description, images, handle, options.
- Images (already CDN-backed by Sanity and Shopify).

Cache hard at the edge; invalidate on change via webhook. Origin should barely be touched.

### Tier 2 — Near-live, short TTL + stale-while-revalidate (tolerates seconds of staleness)

- Price.
- Inventory / "in stock" / "sold out".
- Product listing / collection pages.

**Key insight:** we do NOT need perfectly live inventory on the page. Shopify checkout is the source
of truth and rejects overselling at purchase time. So inventory that is ~10–30s stale is fine — let
short TTL + SWR handle it instead of hitting Shopify per render.

### Tier 3 — Always live, never cached, per-user

- Cart, checkout, customer account.
- Inherently uncacheable, but low-volume vs browsing, and **Shopify's hosted checkout absorbs this
  load for us.** Offloading the transaction to Shopify checkout is the biggest scalability decision.

## Product detail pages specifically

Split the page rather than rendering fresh per request:

- **Cached shell** (Tier 1+2): full HTML — images, copy, Sanity content, price — from edge cache via
  ISR/SWR.
- **Small "buy box" island** for the live bit (stock status), fetched client-side or from a
  short-TTL edge endpoint. Tiny JSON, not a full page render.

A spike on one product then hits the edge cache, not Shopify's Storefront API.

## Caching layers

1. **CDN / edge HTML cache** — the big win. Cloudflare/Fastly/Vercel/Netlify edge in front, caching
   rendered HTML with `s-maxage` + `stale-while-revalidate`. The edge serves the spike; origin sees a
   trickle.
2. **Nuxt/Nitro route rules** — per-route: `prerender` for truly static (info), `isr`/`swr` with a
   revalidation window for product/listing pages. Tier declared per route.
3. **Cached server/API routes** — wrap Shopify Storefront / Sanity calls in Nitro cached handlers so
   one origin fetch serves many requests (respects Shopify's cost-based rate limits, which we WILL
   hit at scale otherwise).
4. **Sanity & Shopify CDNs** — Sanity `apicdn` (already on) + Shopify image CDN.

### Client-side consistency layer (useLiveCatalog)

The cached API routes bound staleness per surface (~60s for listings via `/api/products`, ~15s for
the buy surface via `/api/product`), but Nuxt's payload cache would otherwise
pin a page's live data for the whole session (back-nav remounts reuse the first response — a product
could look available an hour after selling out). So on the client:

- Live fetches **bypass the payload cache and revalidate on remount** (one extra request per visit to
  our own cached route — Shopify load unchanged).
- Every live response — batch and detail — **reports into `useLiveCatalog`**, a session-wide gid →
  lean-product map. Listing surfaces render from the catalog, so the last known data keeps painting
  during refetches (no flicker), and fresher surfaces overwrite staler ones: a product the visitor
  just saw sold out on the PDP shows sold out on the home cards too.

Net: every surface is at most one server-cache window stale, and never contradicts what the visitor
just saw.

## Invalidation

- **Sanity webhook → revalidate/purge** affected pages on publish. This is what makes long TTLs safe
  ("static until changed").
- **Shopify webhooks** (product/inventory) → purge the product page, or just let the short Tier-2 TTL
  catch up (TTL is usually simpler than per-change purge for inventory). Pairs with the planned
  product-creation webhook.

## Turning caching off (demos)

For a presentation where Shopify and Studio changes must show up instantly, set these env vars on
the deployment and redeploy:

- `NUXT_DISABLE_CACHE=true` — the cached API routes (`/api/products`, `/api/product`,
  `/api/live-status`, `/api/live-page`) skip their cache and send `Cache-Control: no-store`, so every
  request hits Shopify/Sanity (`server/utils/switchableCache.ts`). It also turns off page caching
  (ISR), which is decided at **build** time — hence the redeploy, not just a restart.
- `NUXT_PUBLIC_SANITY_USE_CDN=false` — Sanity queries go to the live API instead of the API CDN.

Remove both (or set them back to `false` / `true`) afterwards: with them on, every visitor's request
reaches Shopify and Sanity directly, which is exactly what the caching exists to prevent under load.

## Drop-day specifics

- **Pre-warm the cache** before a known launch so the edge is hot at T+0 (avoid a cache-miss
  stampede).
- **Cache stampede protection** — SWR + request coalescing: on expiry, one request refreshes while
  everyone else gets the stale copy.
- **Waiting room** (Cloudflare Waiting Room or similar) for extreme flash drops, to protect the
  Shopify inventory/checkout path from a thundering herd.
- **Never call Storefront API per page view** — cache catalog data; only inventory rides a short TTL.

## Two decisions to make early (they shape the architecture)

1. **Hosting / deploy target** — the platform's edge network IS the scaling story. Vercel/Netlify/
   Cloudflare give edge ISR + global cache nearly for free; a single-region Node server behind a
   basic CDN is much more work to make spike-proof. **Planned target: Vercel** (see section below).
2. **How live must inventory feel?** If "sold out" can lag ~30s → simple short-TTL caching. If
   marketing wants real-time stock/countdowns → a deliberately uncached island (or websockets) and a
   bigger build. Strong recommendation: "checkout is the source of truth, page inventory can be
   near-live."

## Nuxt on Vercel (planned host)

### Key reframe: Nuxt doesn't absorb the spike — Vercel's Edge Network does

Nuxt SSR runs as Vercel **serverless functions**, which have concurrency limits and per-invocation
cost — they do NOT scale for free. Render every request dynamically and a drop spawns a function per
visitor → cost + concurrency wall. With caching, the function runs once and Vercel's global CDN
serves the cached HTML to everyone else (a 200k-concurrent spike on a cached page ≈ 1 invocation +
200k cheap CDN hits). Nuxt's real job here is to _declare what's cacheable_ so the edge does the
heavy lifting.

### How Nuxt route rules map to Vercel (via the Nitro Vercel preset, no extra config)

| Nuxt `routeRules`        | Vercel primitive                                 | Use for                   |
| ------------------------ | ------------------------------------------------ | ------------------------- |
| `prerender: true`        | Static HTML at deploy, served from CDN           | Truly static pages (info) |
| `isr: { expiration: N }` | Vercel ISR — render once, cache at edge, regen N | Product pages, feed, home |
| `isr: true`              | Cached until explicitly revalidated              | Pages purged via webhook  |
| `swr`                    | stale-while-revalidate caching                   | Listing pages             |

ISR mechanics fit drops: first request invokes the function, result is cached on the Edge Network
worldwide, later requests skip the function entirely; on expiry Vercel serves stale while
regenerating in the background (no cache-miss stampede).

### Per-route plan

- `/info`, marketing shells → `prerender` (pure CDN, zero functions).
- `/` (home), `/feed` → `isr` with a modest expiration, or `isr: true` + webhook revalidation (editor-driven).
  - `/feed` filters by `?filter=`. Vercel ISR keys its cache on the **path alone**, so the feed's
    rule must allow-list that param — `isr: { expiration: N, allowQuery: ['filter'] }` — or every
    filtered view would be served the cached unfiltered page. Load-more pages are client fetches
    straight to Sanity and never touch the page cache. The feed detail (`/feed/[slug]`) renders the
    feed underneath its modal and carries the same param, so it needs the same allow-list.
- Product detail pages → `isr` (cached shell carries images/copy/Sanity content/price).
- Buy box / live inventory → NOT in cached HTML; client fetch or a tiny **Vercel Edge Function**
  (`/api/inventory/[id]`) with a short micro-cache.
- Cart/checkout → Shopify hosted checkout, off our infra.

### On-demand revalidation

Vercel can purge specific paths on demand → pair with the Sanity/Shopify webhooks (publish →
revalidate just that page). Lets us run long/indefinite ISR expirations safely ("static until
changed") instead of short timers.

### Vercel gotchas at this scale

1. **Bandwidth cost** dominates at viral scale, and image bytes dominate bandwidth. Serve images
   straight from **Sanity's and Shopify's image CDNs** (their transform params) rather than Vercel
   Image Optimization. Cloudflare-in-front can cut bandwidth but complicates ISR — only if bills
   justify it.
2. **Function concurrency caps** exist per account. Aggressive caching keeps invocations low; for a
   known mega-drop, be on **Enterprise** and give Vercel a heads-up beforehand (they handle big drops
   routinely if warned).
3. **Pre-warm** key product URLs right before the video goes live so ISR caches are hot at T+0.
4. **Edge vs Node runtime** — keep page rendering on Node serverless + ISR (full API surface); use
   Edge Functions only for small live endpoints (inventory). Don't force everything to edge.

### Bottom line

Nuxt on Vercel handles this well _because_ route rules are a thin declaration layer over Vercel ISR +
CDN. Prerender what's static, ISR everything browseable with webhook revalidation, isolate live
inventory into a tiny cached edge endpoint, let Shopify own checkout. Remaining risks are commercial
(bandwidth/concurrency cost) more than technical — worth an Enterprise conversation with Vercel ahead
of the first big drop.

## As built (Oct 2026)

What's live in the code now (`web/nuxt.config.ts`, `$production.routeRules`):

| Route | Caching | Why |
| --- | --- | --- |
| Every page (`/**`) | Vercel ISR, `allowQuery: []`; **10 min** with the publish webhook set up, 60s without | One render per page per expiry; the edge serves everyone else. Query strings (`?fbclid=`, `?utm_…`, the PDP's `?variant=`, which is client-side) don't split the cache. |
| Every page's `/_payload.json` | Same ISR rule | Client-side navigation loads the cached page data from Vercel instead of each browser querying Sanity. |
| `/{locale}/feed`, `/{locale}/feed/**` | No ISR; `Cache-Control: s-maxage=60, stale-while-revalidate=600` | The feed renders by `?filter=`. Vercel's ISR hands the function the **bare path** (Nitro's Vercel runtime drops the query), so ISR would serve the unfiltered page for every filter. The CDN cache keys on the full URL instead. Spelled out per locale from `LOCALES`, because a `/*/feed` wildcard reaches Vercel's header routes as a literal `*`. |
| `/api/**` | No ISR | Each route sets its own `s-maxage` through `defineSwitchableCachedHandler`. |
| `/_nuxt/**` | Immutable, plus `Access-Control-Allow-Origin: *` | Hashed build files. CORS so they can be served from another host (below). |

**Publish webhook (on-demand revalidation).** `POST /api/revalidate` (`server/api/revalidate.post.ts`)
re-renders, in every locale, the pages that show the published document: a product → its page, the
shop, home and live; a singleton page → that page; a legal page → that page; variants, feed posts
→ nothing (not in cached pages); anything else (Site Settings, Mux assets) → every page. It sends
Vercel's ISR bypass token with a `HEAD` to each page and its `_payload.json`. So edits are live in
seconds, and the 10-minute expiry is only a safety net. Server renders read Sanity's **live API**
(`runtimeConfig.sanity.useCdn: false`), so a render triggered by a publish can't pick up the CDN's
older copy; browsers still use the CDN. Needs `NUXT_SANITY_WEBHOOK_SECRET` (runtime) and
`NUXT_ISR_BYPASS_TOKEN` (must be set at **build** time too, since it's baked into Vercel's ISR
config), plus the webhook in Sanity:

- URL: `https://<production domain>/api/revalidate`, POST, dataset `production`
- Trigger on create, update, delete; filter: none (all documents), drafts off
- Projection: `{_type, "slug": coalesce(slug.current, store.slug.current)}`
- Secret: the same value as `NUXT_SANITY_WEBHOOK_SECRET`

**Warming the cache before a launch.** The same route with no body re-renders every page:
`curl -X POST -H "Authorization: Bearer $NUXT_SANITY_WEBHOOK_SECRET" https://<domain>/api/revalidate`.
Run it after the launch deploy and before the video goes live. Every deploy empties Vercel's page
cache and changes the build's file names, so returning visitors download the code again. Don't
deploy during a drop.

**Fewer files per visit.** The browser build is one main script (app + libraries) with one stylesheet,
plus Mux's player and the intro's physics in their own files (`vite.$client` manualChunks).
`cssCodeSplit: false` is deliberately not used: Nuxt then links no stylesheet at all. Fonts and the
intro SVGs live in `app/assets/`, so they're hashed and long-cached like the code. A
`build:manifest` hook stops Nuxt preloading the SVGs on every page; the intro preloads them only when
it's about to play. Measured first visit: 11–13 requests (18 on home while the intro plays), down
from 54–75.

**Serving build files from another host (`NUXT_APP_CDN_URL`).** Set it to a hostname that proxies
the Vercel site through a CDN that doesn't bill per request (for example a Cloudflare-proxied
`assets.` subdomain). Nuxt then loads `/_nuxt/*` (code, CSS, fonts, SVGs) and each page's first
`_payload.json` from there. Cloudflare caches the immutable files and passes the JSON through to
Vercel. Both get CORS headers (`routeRules` for `/_nuxt/**`, `server/middleware/payloadCors.ts` for
payloads). Client-side navigation still fetches payloads from the site itself. Runtime only, no
rebuild needed.

**Polling.** No browser polls Sanity. The nav and the live page read `/api/live-status?locale=…`
(5s cache) and `/api/live-page?locale=…` (60s cache), both answered by Vercel's edge. The nav
re-checks after the page loads, on each page change and on returning to the tab, at most every 30s,
and not at all on the live page. The live page polls every 15s while waiting for the stream and every
60s once it's on, and its editorial corner every 60s (`usePoll`, which skips hidden tabs). Both
refresh once after hydration, since cached HTML can be up to 10 minutes old.

**Prefetch.** `NuxtLink` prefetches on hover/focus/touch, not on visibility
(`experimental.defaults.nuxtLink.prefetchOn`). Otherwise every product card in view would fetch its
`_payload.json`, each one a billed edge request.

**Off switches (build time).** Page caching is skipped when the build sees `NUXT_BASIC_AUTH_PASSWORD`
(a page served from the edge never reaches the password middleware, so it would leak past the gate)
or `NUXT_DISABLE_CACHE=true`. A password-gated staging site therefore renders every request. Vercel's
own Deployment Protection gates at the platform level and works with ISR, if staging needs caching.

## Net

Cache essentially the entire browsing experience at the edge, treat inventory as near-live-with-SWR
rather than truly live, and let Shopify hosted checkout own the one path that must be real-time.
