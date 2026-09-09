# Newsletter signup (Klaviyo)

The footer's email form (`app/components/global/EmailSignup.vue`) posts to
`/api/newsletter` (`server/api/newsletter.post.ts`), which subscribes the
address to a Klaviyo list with Klaviyo's server-side bulk subscribe job. The
private key lives in server-only runtime config and never reaches the browser.

## Setup

1. Create the Klaviyo account (the free plan covers 250 active profiles and
   500 sends a month; the API is available on it).
2. Make the list (e.g. "Newsletter"). Keep **double opt-in** on (List →
   Settings → Opt-in process): Klaviyo emails a confirmation and only lists the
   address once it's clicked. The form's success copy assumes this.
3. Copy the **List ID** (List → Settings) into `NUXT_KLAVIYO_LIST_ID`.
4. Create a **private API key** (Settings → API keys) with the `lists:write`,
   `profiles:write` and `subscriptions:write` scopes, into
   `NUXT_KLAVIYO_PRIVATE_API_KEY`. Set both in Vercel's environment as well.

With either variable empty the route answers 503 and the form shows its error
message, so nothing half-works.

## Spam guards

A tripped guard returns the same `{ok: true}` as a real signup, so a bot
can't tell what caught it.

- **Honeypot** — a `website` field that's off-screen and hidden from assistive
  tech. Anything in it came from a bot filling every field.
- **Fill time** — the form sends how long it's been on screen; under two
  seconds is a script. Client-measured, so a soft signal on its own.
- **Per-IP rate limit** — five signups per ten minutes
  (`server/utils/rateLimit.ts`). In memory, so per warm Vercel instance rather
  than global: blunts bursts, isn't a hard cap.
- **Email validation** — a bad address is the one case that returns an error
  (400), so a person with a typo is told.

Double opt-in is the backstop: an address that never confirms never joins the
list or counts as an active profile.

## Locale

The subscribe job takes no profile properties, so the visitor's locale
(`en-us`, `es-us`…) goes into the consent record's `custom_source`
("Website footer (es-us)"). Segment on it in Klaviyo if Spanish-language
sends are ever wanted. Klaviyo's confirmation email itself is one template per
list, so it's English unless the list is split per language.
