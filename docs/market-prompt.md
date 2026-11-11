# Market confirmation prompt

When a visitor's detected country differs from the market in the URL (for example someone in
Germany on `/en-us/...`), a small panel asks them to confirm their market. It shows the current
market and lets them switch. **We own the UI. The edge/Oxygen team owns the geo detection.** This
doc is the contract between the two.

## What the edge needs to do

Set one cookie on HTML responses:

| Cookie              | Value                                           | Flags                                      |
| ------------------- | ----------------------------------------------- | ------------------------------------------ |
| `balun-geo-country` | ISO 3166-1 alpha-2 country from geo-IP (`DE`)  | `Path=/`, `SameSite=Lax`, **not HttpOnly** |

- **Not HttpOnly:** only the browser reads it. The prompt is decided after mount, so the cached
  HTML shell never varies by country and the edge cache doesn't fragment
  (see [geo-and-access-strategy.md](geo-and-access-strategy.md) §3).
- Case doesn't matter. Anything that isn't two letters is ignored, so a missing or unknown geo
  (`XX`, `T1`) shows no prompt.
- A session cookie is fine. Refreshing it on every response is also fine.
- **No redirects.** The visitor stays on the market they asked for, and the prompt only offers the
  switch.

If the edge would rather send a response header than a cookie, only
`web/app/composables/useMarketPrompt.ts` has to change.

## How the UI behaves

- Opens when `balun-geo-country` is set, differs from the URL's country, and the visitor hasn't
  answered yet. It looks like the footer's market switcher: a "Market" panel centered over a
  blurred backdrop. It fades in, locks page scroll, and keeps focus inside the panel.
- **yes, continue** closes it, and so do a click on the backdrop and Escape. **change market**
  swaps in the market list (the same hard-navigation links as the footer's MarketSwitcher).
- Every answer sets `balun-market-confirmed` for 30 days, so it doesn't come back after a switch
  (someone in Germany who picks UK) or on return visits.
- The cookie notice waits until the prompt is answered, so it never shows under the backdrop.
- If the visitor's country has no market (Germany today), it still opens. It names their country
  ("It looks like you're in Germany") and lists the markets we do have.

## Testing

- Add `?geo=de` to any URL in place of the cookie. This works in dev, and on a deploy whose
  Vercel environment sets `NUXT_PUBLIC_GEO_OVERRIDE=true` (beta). Redeploy after setting it.
  Never set it in production.
- Anywhere: run `document.cookie = 'balun-geo-country=DE; path=/'` and reload. Clear
  `balun-market-confirmed` to see it again.

Files: `web/app/components/global/MarketPrompt.vue`, `web/app/composables/useMarketPrompt.ts`.
