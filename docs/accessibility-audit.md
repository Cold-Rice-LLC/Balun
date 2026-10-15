# Accessibility audit — 2026-10-14

Audit-only pass over `web/app` (a11y-pass checklist). Nothing fixed yet. Source
findings were confirmed against the running dev server on all seven templates
(home, shop, PDP, feed, feed detail, info, live). Paths are relative to
`web/app/` unless stated. Every proposed fix is invisible (sr-only text,
attributes, tag swaps) unless marked **design decision**.

## Critical

1. **Focus ring removed site-wide, never restored.** `assets/css/global.css:158`
   and `:164` set `outline: none` on `button` and `input`; no `:focus-visible`
   rule exists anywhere (confirmed: zero stylesheet rules match). Keyboard users
   have no focus indicator on any control.
   Fix: drop both resets; add one global rule
   `:focus-visible { outline: 0.2rem solid currentColor; outline-offset: 0.2rem }`.

2. **Closed overlays stay in the tab order.** Confirmed in the browser: 12
   invisible tab stops on the home page, 5 on the PDP, 2 on every other page.
   - `components/global/CartDrawer.vue:2–15` — closed by `translateY(100%)` only; close button, line links, stepper, remove, checkout all tabbable.
   - `components/global/QuickAddDrawer.vue:2–15` — closed by `opacity: 0`; close, learn-more links, whole options panel tabbable.
   - `components/global/LocaleModal.vue:44–50` — two `role="dialog" aria-modal` elements permanently in the tree (teleported to the end of the document), locale links tabbable.
   - `components/home/FeaturedProduct.vue:46–67` — teleported CTAs are `opacity: 0` off-screen but tabbable (they come first in tab order, before the logo).
   - `components/product/FeatureCarousel.vue:15–88` and `pages/products/[handle].vue:41–84` — Swiper loop clones and off-screen slides tabbable; dots tabbable while hidden.
   Fix: `:inert="!isOpen"` on each backdrop button and panel (transitions still run); Swiper `A11y` module or `inert` on non-active slides.

3. **No focus management on the drawers and the two unmounting triggers.**
   - Cart and quick-add drawers (`CartDrawer.vue`, `QuickAddDrawer.vue`, `composables/useCart.ts:24–30`, `useQuickAdd.ts:31–41`): no Escape, no focus move on open, no focus return on close (including the route-change and cart-opens-closes-quick-add paths).
   - `components/product/BuyPanel.vue:46–56` — trigger is `v-if="!expanded"` with hardcoded `aria-expanded="false"`; activating it unmounts it and drops focus on `<body>`. Close button (`:29–38`) unmounts the same way. No `aria-controls`.
   - `components/live/FeaturedProduct.vue:3–11, 38–42` — same unmount pattern; `role="dialog"` sits on the options wrap only, with the Close button outside it, no `aria-modal`, no focus move.
   - `components/feed/Detail.vue:133–162` — good dialog semantics, but focus is never returned to the card link on close; header, secondary nav and footer stay reachable behind the modal (only the landing is inert, `pages/feed.vue:3`).
   Fix: bind `aria-expanded`, `aria-controls` to the panel id; on open `nextTick` → focus close button; remember the opener and refocus it on close (fall back to the nav button); Escape via `onKeyStroke`.

4. **Five of seven templates have no h1.** Confirmed in the browser.
   - `pages/index.vue` — none; modules contribute orphan h2s.
   - `components/feed/Landing.vue:15–68` — none when posts exist (the empty stub at `:74` has one).
   - `pages/info/index.vue:3–23` — no heading of any level when modules exist.
   - `pages/live/index.vue` and `pages/products/index.vue` — no headings at all.
   Fix: `<h1 class="sr-only">` with the site/page name as the first child of each page root; on the feed hoist the stub's h1 above the branch with `sr-only` toggled by `posts.length || filter`; `aria-hidden="true"` on the decorative wordmarks (`components/home/BigImageLogo.vue:13`, `components/global/MainFooter.vue:43`).

5. **Rich-text image blocks render `<img>` with no alt attribute.**
   `components/global/RichText.vue` passes no `types.image` serializer, so the
   `@nuxtjs/sanity` default emits `h('img', { src })` for block-level images in
   PDP body, feed text and info text. The Studio `blockContent` image also has
   no alt field, and `i18nRichText` only resolves alt on inline images.
   Fix: add a `types.image` serializer mirroring `components/info/Prose.vue:29–40` (`alt: value.alt || ''`, lazy, dimensions). Studio follow-up: `altField()` on the blockContent image and a block-level alt projection in `utils/queries.ts:36–52`.

## Major

6. **No skip link; `<main>` has no id.** `layouts/default.vue:5`. Fix: `<main id="main" tabindex="-1">`, skip link as the first child of the header in `MainNav.vue:2`, parked with `-translate-y-full`, revealed with `focus:translate-y-0`.

7. **Four unlabeled `<nav>` landmarks.** `MainNav.vue:14`, `SecondaryNav.vue:2`, `MainFooter.vue:12` and `:29`. A page can carry six navs. Fix: `aria-label` via new i18n keys (Primary / Shop and cart / Site links / Legal).

8. **Drawer and modal semantics.**
   - Cart and quick-add triggers declare `aria-haspopup="dialog"` (`QuickAddTrigger.vue:7`) but the drawers are plain `<aside aria-label>` (`CartDrawer.vue:10`, `QuickAddDrawer.vue:10`). Fix: `role="dialog" aria-modal="true"` with `aria-labelledby` on an sr-only heading. Consider rendering them from the layout rather than inside the secondary `<nav>` (`SecondaryNav.vue:31–32`).
   - `LocaleModal.vue:53–63` — `role="listbox"`/`option` on `<li>`s whose interactive child is an `<a>`: invalid, and promises arrow-key selection that doesn't exist. Fix: drop the roles, `aria-current="true"` on the active link, focus the active link on open and the trigger on close. Also `:5` `aria-label="label"` masks the visible current value (announces "Language", not "Language, English").

9. **Product card: `<button>` nested inside the card `<NuxtLink>`.** `components/product/Card.vue:2–45` + `QuickAddTrigger.vue:2–13`. Invalid HTML; the link's name swallows "Quick add…". Fix: sibling link covering the card via `::after { inset: 0 }` (the feed card already does this), trigger outside with `z-index: 1`.

10. **Alt text repeats adjacent titles.** Confirmed: PDP shows 7 images all alt "Speedy 01 · White" beside the h1; shop cards read "Title Title".
    - `composables/useProductImage.ts:35` bakes the product title in as fallback → redundant on grid cards (`product/Card.vue:12` + `:18`), colorway thumbs (`ColorwaysRail.vue:23` + sr-only `:58`), live featured (`live/FeaturedProduct.vue:21` + `:44`). Fix: fallback `''` (editor alt and Shopify altText still win); update the Studio hints that promise the title fallback (`studio/schemaTypes/documents/product.js:49,60`, `objects/featureImage.js:20`).
    - `pages/products/[handle].vue:36, 60, 134` — gallery and carousel fallback to the title N times beside the h1. Fix: `image.alt || ''`; drop the `:alt` prop on the carousel.
    - `components/home/FeaturedProduct.vue:32–38` — image-only linked slides share one fallback ("Title" × N). Here a fallback is needed. Fix: number it in `FeatureCarousel.vue:46`: `Title — 1 / 3`.
    - `CartDrawer.vue:30–43` — image link + title link to the same PDP with the same name. Fix: `tabindex="-1" aria-hidden="true"` on the thumb link, drop its `aria-label`.
    - `components/home/ModuleMedia.vue:34` — a set `mobileImage` with empty alt beats the desktop image's editor alt. Fix: `mobileImage?.alt || media.image.alt || ''`.

11. **Media.** `components/home/Video.vue:23` and `components/live/YouTube.vue:8` have `title=""` on iframes (fix: i18n "Video player" / "Live stream"). `ModuleMedia.vue:2–11` autoplay muted background video is exposed to AT (fix: `aria-hidden="true"`). All ten `components/icons/*.vue` SVGs lack `aria-hidden="true"`; every usage is decorative beside text (one-line fix per icon). The cart line's `<s>` compare-at price (`[handle].vue:110–114`) is not announced.

12. **Forms and state announcements.**
    - `components/global/EmailSignup.vue:17–27, 40–48` — the only label is a `<p>` hidden below `lg`, so mobile has placeholder only (**design decision**: sr-only label is the invisible fix). Submit `aria-label` "Sign up" mismatches visible "Subscribe" (WCAG 2.5.3). Success `role="status"` mounts with its text so it may not announce; errors go to `window.alert`. Fix: persistent sr-only `aria-live="polite"` fed by status; drop the aria-label and give the arrow `aria-hidden` plus sr-only text.
    - `components/product/OptionsPanel.vue:12–23, 47–58` — size pills convey selection by class only (fix: `aria-pressed`); the label `<p>` isn't associated (fix: `role="group" aria-labelledby`); add-to-cart text swaps idle/adding/added/failed silently (fix: `aria-live="polite"`).
    - `components/global/QuantityStepper.vue:2–18` — no group name, value not announced, buttons lack `type="button"`.
    - `SecondaryNav.vue:20–24`, `useCart.ts:62–66` — no live region for cart count changes. Fix: one sr-only `aria-live="polite"` in SecondaryNav watching `lineCount`.
    - `components/feed/Landing.vue:36–66` — filter changes announce nothing. Fix: sr-only live region with the result count; `aria-busy` on load-more.

13. **Links.** `components/home/Marquee.vue:8–14` — the sr-only text sits before the `<AppLink>`, so when the band is a link its accessible name is empty (fix: move the span inside). External links in `AppLink.vue:2–9`, `feed/Card.vue:20–28`, `feed/Detail.vue:52–60`, and `RichText.vue` externalLink have no "(opens in new tab)" cue.

14. **Reduced motion.** `SecondaryNav.vue:52` smooth `scrollTo` ignores the preference. `.enter-in-fade-up` (`global.css:224–232`), the PDP colorway transitions, BuyPanel `panel-pop`, feed detail transitions and the status/poster fades never check it (only Marquee, the live blink and the Intro do). Fix: one global `prefers-reduced-motion` block collapsing animation and transition durations, plus a `matchMedia` check on the scroll.

15. **Portable-text headings.** `global.css:350–354` styles only `.body-copy h2`; h3 and blockquote look like paragraphs everywhere, and the PDP description (`[handle].vue:168`) lacks `.body-copy` so even its h2 is plain (**design decision**: styling them is visible). Editors can also produce h3 with no h2 (`studio/schemaTypes/objects/blockContent.js:14–19`); a Studio validation rule is the only fix.

## Minor

- `SecondaryNav.vue:13–19` — the cart button becomes "checkout" while still carrying `aria-expanded`/`aria-controls`.
- `pages/live/index.vue:66–73` — mute toggle uses `aria-pressed` and a swapping label (double signal, inverted).
- `ColorwaysRail.vue:12–18` — market-masked sibling renders a bare div with no sr-only reason.
- `QuickAddTrigger.vue:2–10` — has `aria-haspopup`/`aria-controls` but no `aria-expanded`.
- `feed/Card.vue:17,103` — every stream post's h2 is the identical string "live stream".
- `LocaleModal.vue:117–128` — each instance adds its own lifetime keydown listener.
- `feed/Landing.vue:18–34` — filter toggles are a `<nav>`; `role="group"` fits better.
- Buttons without `type="button"` across shared components.
- Studio: `feedPost.js:74–80` cover image has no alt field although it is content on the detail page.
- Content gaps, not code: no captions/transcripts on the mp4, YouTube and Mux videos.

## Already good

`<html lang>`/`dir` follow the locale; `NuxtRouteAnnouncer` mounted; single
main/header/footer; feed detail dialog (role, aria-modal, labelledby, Escape,
focus-in, inert landing); all backdrops are real buttons with sr-only names;
cart and quick-add `aria-controls` wired to real ids; feed filters and
colorway rail labeled with `aria-pressed`/`aria-current`; marquee sr-only
single run + aria-hidden track; intro overlay aria-hidden and skipped under
reduced motion; email form has `autocomplete`, honeypot hidden; no positive
tabindex, no click handlers on non-interactive elements; every app-authored
`<img>` has an alt attribute; editor alt is never suppressed; Shopify altText
fetched on every path; PDP mobile/desktop galleries are mutually display:none.

## Fix slices (one commit each, browser-verified)

Status 2026-10-15: all seven slices committed (1cb43be, c4e12c5, aaa52dd,
991578b, 1dd8253, 4682e4c, 8e2f08d). Not exercised in dev for lack of
content: the live featured product and mute toggle, a rich-text block image, a
background-video hero, a compare-at price, a market-masked colorway, and the
Studio heading-order warning (needs a Studio login). Still open: the items
under "Not covered by this pass" below.

1. Focus ring restore + global reduced-motion block (items 1, 14).
2. Skip link, `main#main`, nav labels, sr-only h1s, wordmark aria-hidden (4, 6, 7).
3. `inert` on closed overlays and carousel slides (2).
4. Focus management: drawers, BuyPanel, live featured, feed detail return, locale modal (3, 8).
5. Alt text, icons, iframes, background video, cart thumb link (5 front-end part, 10, 11).
6. Interaction details: dialog roles, aria-pressed, live regions, form labels, external-link cue, marquee name, card nesting (9, 12, 13, minors).
7. Studio/schema follow-ups: blockContent image alt, cover image alt, h3-without-h2 validation, hint copy (5, 15, minors).

## Not covered by this pass

Color contrast was not measured (dimmed `opacity-*` states, grey-on-grey pill
buttons and accent-on-black pairs are the likely failures). Nothing replaces a
real VoiceOver tab-through and a 400% zoom check.
