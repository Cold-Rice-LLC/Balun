# Runbook: Launch Checklist

Work that is **written and verified but deliberately switched off**, because it
needs a production domain to be correct. Nothing here is a "someday" idea — each
item is a known-good change waiting on one input.

> **Trigger:** the moment a production domain exists (e.g. `https://balun.com`).
> Do these together — they share the same input and the same verification pass.

---

## 1. `hreflang`, canonicals, and `og:locale`

**Status:** wired but disabled. `app.vue` already applies `useLocaleHead()` for
`<html lang>` / `dir`; only the SEO tag output is held back.

**Why it's deferred:** `hreflang` and canonical links must be **absolute URLs**.
Without an `i18n.baseUrl`, the module would emit them against whatever origin
served the page — `localhost` in dev, a preview URL on staging. Wrong absolute
URLs are worse than none: they tell Google the canonical version of a page lives
somewhere it doesn't.

**Why it matters here:** the site deliberately does **not** IP-redirect crawlers
(see [shopify-and-localization-strategy.md](./shopify-and-localization-strategy.md) §2,
"IP on Vercel"). Googlebot crawls from US IPs and sees `/en-us`. `hreflang` is
the *only* signal telling it `/en-gb` and `/es-us` exist. Until this is on, the
non-US locales are effectively invisible to search.

### The change: two edits

**a. `web/nuxt.config.ts`** — add `baseUrl` to the `i18n` block:

```ts
i18n: {
  locales: LOCALES,
  defaultLocale: 'en-us',
  strategy: 'prefix',
  rootRedirect: 'en-us',
  detectBrowserLanguage: false,
  baseUrl: 'https://balun.com',   // ← add
},
```

Prefer the env var **`NUXT_PUBLIC_I18N_BASE_URL`** over a hardcoded string if
there will ever be a staging domain — module options are exposed under
`runtimeConfig.public.i18n`, so the deploy environment can set it per
environment. Staging emitting production `hreflang` (or vice versa) is a classic
way to leak the wrong canonical into the index.

**b. `web/app/app.vue`** — drop the `seo: false` opt-out and render the tags it
produces:

```js
const localeHead = useLocaleHead()
useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: localeHead.value.link,
  meta: localeHead.value.meta,
}))
```

`seo: true` is the default, so `useLocaleHead()` bare is enough. The `link` and
`meta` arrays are where the new tags actually live — `htmlAttrs` alone (today's
version) carries only `lang`/`dir`, which is why adding them is part of the
change and not automatic. Delete the comment block explaining the deferral.

### Verify

```bash
curl -s https://balun.com/en-gb | grep -o '<link rel="alternate"[^>]*>'
```

Expect one `alternate` per locale (`en-US`, `en-GB`, `es-US` — the `language`
tags from `locales.mjs`) plus an `x-default` pointing at the default locale,
every `href` **absolute** and matching that locale's path. Spot-check a nested
route too, where the whole path — not just the prefix — has to survive:

```bash
curl -s https://balun.com/es-us/products/speedy-01-white | grep -o '<link rel="alternate"[^>]*>'
```

---

## 2. `robots.txt` → sitemap pointer

**Status:** not started, and blocked on the same input plus one decision.

`web/public/robots.txt` currently allows everything and names no sitemap. A
`Sitemap:` line needs an absolute URL, so it waits on the domain — but there is
also **no sitemap generator installed** (`@nuxtjs/sitemap` is not a dependency).

Decide at that point whether the catalog is small enough that `hreflang` plus
internal linking is sufficient, or whether to add the module. If you add it, the
per-locale routes must all appear — a sitemap listing only `/en-us` undoes the
point of item 1.

---

## Not on this list

Things that look launch-shaped but are **not** blocked on the domain, so don't
bundle them here:

- **Market suggestion banner** (IP → "switch to /en-gb?") — a product decision,
  not a config flip. Strategy doc §2.
- **Live-stream integration** — `livePage.streamUrl` is a placeholder for a
  provider that hasn't been chosen.
