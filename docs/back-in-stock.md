# Back in stock (Klaviyo)

A sold-out product page shows **Notify me when back in stock** under the
price and the "sold out" label, in the price's style
(`app/components/product/BackInStock.vue`). It opens an email field in place;
submitting posts to `/api/back-in-stock` (`server/api/back-in-stock.post.ts`),
which creates a Klaviyo back-in-stock subscription for every size (variant) of
the product with Klaviyo's server-side API
([Create Back In Stock Subscription](https://developers.klaviyo.com/en/reference/create_back_in_stock_subscription)).
The private key stays server-side, shared with the newsletter
(`server/utils/klaviyo.ts`).

Klaviyo does the rest: it watches inventory through its Shopify integration,
and when a subscribed variant comes back it triggers the account's Back in
Stock flow, which sends the email. Nothing on the site runs at restock time.

## When it shows

Only when the whole product is sold out (Shopify's product-level
`availableForSale` is false), so it sits under the "sold out" label. A
product with some sizes left shows no button, and sold-out sizes in the size
picker stay disabled.

Signing up subscribes every size: the button has no size picker. Someone
waiting for one size will hear about the first size that's restocked. Klaviyo
sends one email per restocked variant, so leave Smart Sending on in the flow
(below) to stop several sizes coming back at once from sending several emails.

## Klaviyo setup

1. **Shopify integration** (Integrations → Shopify): connected to the store,
   with product/catalog syncing on. Klaviyo can only watch variants it has
   synced, and its variant IDs are Shopify's (`$shopify:::$default:::<id>`).
2. **Nothing to turn on.** Back in stock has no on/off switch; it works once
   the Shopify integration is connected. Its settings (the **inventory
   threshold**, how many units must come back before subscribers are emailed)
   are at account name → Settings → Other → **Back in stock settings**, but
   that tab only appears after the first *Subscribed to Back in Stock* event,
   i.e. after the first signup. They're also reachable from the flow's Back in
   stock delay step. In Shopify, products must **not** be set to *Continue
   selling when out of stock*, or they never read as sold out. Klaviyo's
   back-in-stock *form* isn't needed: this site has its own button.
3. **Create the flow**: Flows → Create flow → browse templates → **Back in
   Stock** (trigger: the *Subscribed to Back in Stock* metric). Edit the email,
   keep **Smart Sending** on, and set the flow **Live**. Until it's live,
   signups are recorded but nothing is sent.
4. **API key**: the key in `NUXT_KLAVIYO_PRIVATE_API_KEY` needs
   `catalogs:write` and `profiles:write` on top of the newsletter's scopes.
   Create a new private key (Settings → API keys) with `lists:write`,
   `profiles:write`, `subscriptions:write` and `catalogs:write`, and replace
   the key locally and in Vercel (then redeploy). Without `catalogs:write`
   Klaviyo answers 403 and the page shows the error message.

## Testing end to end

1. On a sold-out product page, sign up with a real address you can check.
2. In Klaviyo, the profile should show a *Subscribed to Back in Stock* event
   per size, and the Back in stock settings tab now appears (set the
   threshold there if the default doesn't suit).
3. Restock one size in Shopify above the threshold. Klaviyo checks inventory
   periodically, so the email can take a while to arrive.

## Spam guards

The newsletter's guards: a hidden honeypot field, a minimum fill time (from
when the field opens), a per-IP rate limit (five per ten minutes, per warm
instance) and a strict email check. A tripped guard gets the same success
response as a real signup.

## Not covered yet

- **Language**: the subscription can't carry the visitor's locale, so the
  flow's email is the same for every market.
- **Partly sold out products** and individual sold-out sizes (see *When it
  shows*).
