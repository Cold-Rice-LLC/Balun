# Geo, Pricing & Access-Control Strategy (headless Shopify + Nuxt on Vercel)

> Status: **recommendations, not yet built.** Companion to [performance-caching.md](./performance-caching.md);
> the cache-fragmentation section below is the main interaction between the two.

## Context

The site fronts a YouTuber with a ~50–75M-sub audience and runs **drops**. The ask: how dynamically
can we "mask" the site by geography —

1. Different product or price in different countries?
2. Turn certain countries on/off during a drop?
3. See traffic by country in real time and flip access on/off live?

All three are possible. The important framing: they split across **two different systems**, and
conflating them leads to the wrong design.

| Capability                                   | Owned by                                    |
| -------------------------------------------- | ------------------------------------------- |
| Different price / product per geo            | **Shopify Markets** (native)                |
| Turn countries on/off, live toggle, traffic  | **Our edge layer** (Vercel/Cloudflare)      |

Rule of thumb: **Shopify Markets = the purchase boundary. The edge = the UX boundary + traffic
shaping.** You want both; neither alone is sufficient.

## 1. Different product / price per geo — Shopify Markets (native)

This is exactly what Markets is for and it works cleanly headless:

- **Pricing** — per-market price lists/catalogs: fixed local prices, or rule-based conversion +
  rounding per country/region. Query the Storefront API with the `@inContext(country: XX)` directive
  and Shopify returns that market's price and currency. No custom logic.
- **Product availability** — Markets catalogs publish a given product to only certain markets. A
  product can effectively not exist in a country's catalog. This is the mechanism for "US-only drop."
- **Plan requirement** — per-market catalogs and advanced Markets features assume **Shopify Plus**.
  A creator at this scale will be on Plus anyway.

**Cache consequence:** `@inContext` makes Storefront responses **vary by country**, so anything
derived from it must be cache-keyed by country. See cache fragmentation below.

## 2. Turn countries on/off during a drop — two layers, use both

Two enforcement points, each doing a different job:

- **Soft / merchandising gate — Shopify Markets.** Publish/unpublish the product per market.
  Determines whether it can be *priced and bought*. Source of truth, but propagation is not
  instant and it is **not** designed for second-by-second flipping.
- **Hard / UX gate — our edge middleware.** Nuxt/Nitro middleware on Vercel (or a Cloudflare Worker)
  reads the request geo header (`x-vercel-ip-country` / `CF-IPCountry`) plus an **allowlist** and
  decides: serve the drop, show "not available in your region," or send to a waiting room. This is
  the switch we flip in real time.

**Where the live allowlist lives — critical:** a low-latency, globally-replicated config store the
edge reads on **every** request — **Vercel Edge Config** or **Cloudflare KV** (single-digit-ms).

- **Do NOT** put the live toggle in Sanity or Shopify — too slow and too heavily cached to act as a
  real-time kill-switch.
- Sanity (or a small internal admin) can be the editor UI that **writes** the allowlist; the edge
  **reads** Edge Config / KV. Editor convenience and edge read-path stay separate.

## 3. Real-time traffic + live toggle — the CDN's job, not Shopify's

- **Seeing traffic live** — Shopify/Sanity analytics aren't real-time enough for a drop. The **CDN**
  gives live geo traffic (Cloudflare Web/Workers Analytics, Vercel Analytics); for a real drop-day
  "war room," pipe edge logs to a real-time sink. We watch **our edge**, because at drop scale almost
  all traffic hits the edge cache, not Shopify.
- **Flipping access live** — change the country flag in Edge Config / KV → propagates to the edge in
  seconds → the next request from that country is allowed/blocked. Pairs with the **waiting room**
  already in the drop-day plan.

## Caveats to set expectations with the client

1. **Geo-IP is not airtight.** Country accuracy ~95–99%, and **VPNs trivially bypass it.** Great for
   merchandising and soft gating; **not** a legal/hard block. If a country must be blocked for
   compliance, geo-IP alone is insufficient — say so up front.
2. **Enforce at two layers or it leaks.** The edge gates the *UI*; a determined user can still call
   the Storefront API directly. **Markets catalog availability is what actually stops the purchase.**
   Edge = UX + traffic shaping; Markets = the real purchase boundary.
3. **Geo-varying content fragments the cache — the real architectural cost.** The caching plan
   assumes one HTML copy per page served globally. Per-geo price/availability makes the edge cache
   key include country → N variants per page and more cold misses (a global drop multiplies cache
   entries). Mitigations:
   - Keep the **country allowlist check in cheap edge middleware**, not in the cached render.
   - Keep price/availability in the **client-fetched buy-box island** (already in the caching plan)
     so the heavy HTML **shell stays geo-agnostic** and only a tiny JSON call varies by country.
   - This preserves the "edge absorbs the spike" property from the caching strategy.

## Net

- **Price/product per geo** → Shopify Markets + `@inContext`. Native.
- **Countries on/off + live toggle + live traffic** → edge middleware + Edge Config/KV + CDN
  analytics + waiting room. Our infra, not Shopify.
- Treat geo as **merchandising and soft-gating, not hard security.** Purchase boundary in Markets,
  UX boundary at the edge, assume VPN leakage.
- Keep the **HTML shell geo-agnostic** and push per-geo bits into the buy-box island so geo support
  doesn't undo the edge-caching that makes drops survivable.
