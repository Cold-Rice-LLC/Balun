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
   `profiles:write` and `subscriptions:write` scopes — plus `catalogs:write`
   for back-in-stock signups (docs/back-in-stock.md) — into
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

## SMS step

In a market with SMS set up, a successful email signup doesn't go straight
to the thank-you: the row turns into a phone field ("Get texts too"), with
the SMS consent disclosure under it and a "No thanks" that skips to the
thank-you. A number goes to `/api/newsletter-sms`
(`server/api/newsletter-sms.post.ts`), which adds it to the same profile with
SMS marketing consent, on the same list.

- **Which markets** — `NUXT_KLAVIYO_SMS_COUNTRIES`, a comma list of market
  ids (`us`, `gb`). Empty (the default) = no SMS step anywhere, so the step
  stays off until Klaviyo can actually send.
- **Abuse guard** — the email route returns a signed token (HMAC of the email
  and an expiry, 30 minutes, keyed by the private API key) and the SMS route
  requires it, so nobody can attach a number to someone else's email by
  posting it. A tripped spam guard gets no token, so bots never see the step.
  See `server/utils/smsSignup.ts`.
- **Number format** — read in the visitor's market ("(212) 555-0123" in
  /en-us, "07700 900123" in /en-gb) or with a leading +, and sent as E.164.
  Only US numbers and UK mobiles are recognised, and only for markets in the
  setting; anything else is a 400 and the form asks again. A new market needs
  an entry in `NUMBERING` there.
- **Consent** — the disclosure is `newsletter.smsTerms` (en/es) and sits next
  to the field as its description. Klaviyo records the consent with
  `custom_source` "Website footer SMS ({locale})". The wording is a standard
  TCPA-style template, not legal advice: have it checked, and add Terms/Privacy
  links if counsel wants them next to the field.
- **Failure** — anything but a bad number (expired token, Klaviyo down) tells
  the visitor their number wasn't added but the email was, and moves on.

### Klaviyo setup for SMS

1. Settings → SMS: turn SMS on and get a sending number for each market (US:
   a toll-free number, which needs carrier verification and can take days to
   weeks; UK: an alphanumeric sender or a number). Fill in the compliance
   details (company name, terms and privacy URLs).
2. Double opt-in: the list's opt-in setting governs the subscribe job for SMS
   too, so with it on Klaviyo texts a "reply Y to confirm" first. Check it
   behaves as wanted on a real phone before launch.
3. If the account uses SMS age gating, the API needs a date of birth with every
   SMS consent and returns 400 without one; this form doesn't collect it, so
   leave age gating off.
4. The existing private key's scopes (`profiles:write`,
   `subscriptions:write`, `lists:write`) cover SMS.
5. Set `NUXT_KLAVIYO_SMS_COUNTRIES` (e.g. `us`) in Vercel and redeploy.

## /newsletter page

`/{locale}/newsletter` (`web/app/pages/newsletter.vue`) is a landing for
bios, QR codes and printed links: an empty yellow page one screen tall, with
the footer and its signup at the bottom, above the shop and cart buttons.
Bare `/newsletter` redirects to `/en-us/newsletter` (`routeRules` in
nuxt.config.ts). The footer's text, wordmark and signup turn dark grey there
(`template-newsletter` rules in global.css, MainFooter and EmailSignup).
