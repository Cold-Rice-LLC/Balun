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

## Invalidation

- **Sanity webhook → revalidate/purge** affected pages on publish. This is what makes long TTLs safe
  ("static until changed").
- **Shopify webhooks** (product/inventory) → purge the product page, or just let the short Tier-2 TTL
  catch up (TTL is usually simpler than per-change purge for inventory). Pairs with the planned
  product-creation webhook.

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

## Net

Cache essentially the entire browsing experience at the edge, treat inventory as near-live-with-SWR
rather than truly live, and let Shopify hosted checkout own the one path that must be real-time.
