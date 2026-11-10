# Draft preview

Editors see unpublished changes on the real site before publishing.

## How it works

- **Studio:** every document with a page (home, info, live, shop, feed, legal
  pages, feed posts, products) has **Open preview** in its action menu. It opens
  the page with `?preview=true` in a new tab: the market override's own market
  (`/en-gb/…` for a GB home page), otherwise `/en-us`. Collection documents need
  a slug first.
- **Site:** `web/app/plugins/preview.server.ts` sees `?preview=true` and switches
  that server render to Sanity's drafts perspective using
  `NUXT_SANITY_PREVIEW_TOKEN`. A "Previewing unpublished changes" banner shows,
  and the response is `noindex` / `no-store`. Exit preview is a full reload.
- Only the page you land on is a preview. Moving to another page inside the site
  shows published content again (the browser fetches published data); open
  preview from that document instead.
- Shopify data (prices, stock) is always live, and the live page's stream
  status comes from its own API route — neither has drafts.

## Where it works

Vercel's page cache keys on the path alone, so on the cached production site
`?preview=true` never reaches the server: visitors get the published page.
Preview therefore runs on a **cache-off** deploy. The password-gated staging
deploy already is one (`NUXT_BASIC_AUTH_PASSWORD` turns page caching off), and
keeps unreleased drops behind the password.

## Setup

1. **Token:** manage.sanity.io → project → API → Tokens → add a **Viewer** token.
2. **Staging (Vercel):** set `NUXT_SANITY_PREVIEW_TOKEN` to it. Never set it on
   production.
3. **Studio:** build/deploy with `SANITY_STUDIO_PREVIEW_URL` = the staging origin
   (no trailing slash), e.g. in `studio/.env`. Without it, Open preview points at
   `http://localhost:3000`.
4. **Local dev:** put the token in `web/.env`; previews work against the dev
   server.

Without the token, preview links render published content (and log a warning).

## Gotcha

`useSanity().fetch` calls a client held in a closure, so reassigning
`useSanity().client` (what mit-luma does with `useSanityQuery`) has no effect
here. The plugin sets the perspective on the helper's config, then calls
`setToken()`, which rebuilds the client from that config.

The route map in `studio/actions/openPreview.js` mirrors
`web/app/utils/internalLinkPath.ts` — change them together.
