# High-contrast mode

A visitor-facing switch that turns the site's greys into a dark grey (`#333333`) and
white.

## For editors

- **Site Settings → "Accessibility — High-Contrast Toggle"** turns the feature on.
  Off: no button, and nobody sees high contrast, including visitors who chose
  it earlier (their choice is kept for when it comes back).
- On: a contrast icon (a half-filled circle, no background) sits in the
  top-left corner of every page. Its screen-reader name is "High contrast" / "Alto contraste",
  announced as on or off.
- The site remembers each visitor's choice in their browser. A visitor who has
  never pressed it starts in high contrast if their device asks for more
  contrast (iOS/macOS "Increase contrast", Windows' contrast settings).
- The published pages are cached, so turning the switch on or off shows up once
  Site Settings is published (the publish webhook re-renders the pages).

## What changes

| Where | Normal | High contrast |
| --- | --- | --- |
| Light pages (home, shop, legal, 404) | grey text | dark grey text |
| | grey buttons and panels | dark grey, white text |
| Product page | grey page | dark grey page, white text |
| Info, feed, live | black page, grey text | black page (as designed), white text |
| Dark pages' grey buttons and panels | grey | white, dark grey text |
| The PDP's details column | white panel, grey text | white panel, dark grey text |
| Inside a dark panel (cart, quick add, buy panel) | grey pills, steppers | white, dark grey text |

Kept as they are: photos and video, the intro animation, the brand colors
(yellow feed pill and checkout state, purple info pill, the live tab's red
light), and a feed post's own accent color set in Studio. Text on yellow is
always dark grey and text on a black pill always white.

Where two states differed only by shade of grey, they get a shape cue instead:

- Carousel dots: the current one filled, the others hollow rings.
- Size pills: available filled, selected inverted with a heavy ring, sold out
  outlined and struck through (at full strength rather than faded).
- PDP colorways: the current one gets a ring outside its thumbnail.
- Footer email field: the focus ring comes back (the underline brightening
  can't show).
- Faded secondary text (cart variant and taxes note, unavailable product
  cards' text) comes up to full strength.

The footer wordmark follows the mode like the footer text. Around 800px wide the
lower footer links run over its letters (in both modes — the same color as the
wordmark there); at laptop widths and up they sit in the white space.

## How it works

- **The class:** `html.high-contrast`. Pages are cached and shared, so the server
  never renders it; `components/global/ContrastToggle.vue` adds a pre-paint
  head script (only while the switch is on) that applies it from
  `localStorage['balun-contrast']` (`high` / `standard`) or
  `prefers-contrast: more` — no flash of the normal colors.
  `composables/useHighContrast.ts` holds the state; the button saves the choice.
- **The colors** (`assets/css/global.css`, "High contrast"): the seven grey
  tokens are remapped, so every `text-grey-*` utility and `var(--color-grey-*)`
  in a component follows without edits.
  - `--hc-ink` (`#333333`, 12.6:1 on white) is the one dark the mode uses —
    change it there to retune the whole mode.
  - Light surfaces: greys → `--hc-ink`. Dark templates (`body.template-pdp/info/feed/live`)
    and `.hc-dark`: greys → white; the PDP's page goes `--hc-ink`, the others
    keep their black. `.hc-light` restores the light
    set on a light panel inside a dark page.
  - `--hc-fill` / `--hc-on-fill`: what a filled control becomes in the current
    context (dark grey/white on light, white/dark grey on dark).
  - **`.hc-fill`** on a grey button or panel paints it in `--hc-fill` with its
    text, and every grey inside it, in `--hc-on-fill`. Inside, the context flips,
    so a fill nested in a fill comes out the other way. Background and text are
    `!important` (components' own rules are often more specific and their greys
    now resolve to the text color); a state that must keep its color re-asserts
    it with `!important` too (the cart's checkout yellow, add-to-cart's
    added/failed).
  - `NotchPanel` with `.hc-fill` routes the fill through its own paint (body, tab,
    fillet) instead of the root box.

## Adding something new

- **Grey text:** nothing to do — it follows the token remap.
- **A grey button or panel:** add `hc-fill` to it.
- **A light panel on a dark page:** add `hc-light` (or `hc-dark` for the reverse).
- **States told apart only by shade:** add a shape cue under
  `html.high-contrast …` in the component.
- In scoped styles, write `html.high-contrast .thing { … }`, **not**
  `:global(html.high-contrast) .thing` — Vue drops everything after a
  `:global()` and the rule lands on `<html>` itself.

## Checked

2026-11-11, dev server, desktop and 375px: home (featured product, product grid,
quick add, cart, locale modal, footer), shop, PDP (buy panel, cart), info, feed
(filters, blog/products/events cards, a post's detail), live (featured product),
the accessibility page and the 404. A script measuring every visible text
element against its solid background found no WCAG AA contrast failures in high
contrast (14 on the 404 alone with it off). Text over photos isn't measured.
Not checked: Windows "forced colors" mode (a separate system feature this
doesn't replace), and a real device with "Increase contrast" turned on.
