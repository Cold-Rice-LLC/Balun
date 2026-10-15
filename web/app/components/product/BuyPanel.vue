<template>
  <div class="buy-panel">
    <ClientOnly>
      <Transition name="panel-pop">
        <NotchPanel
          v-if="expanded"
          id="buy-panel"
          ref="panelEl"
          class="panel tab-top-max-md text-green"
        >
          <ProductOptionsPanel
            v-if="variants.length"
            v-model:variant-id="variantId"
            :product="live"
            open-cart-on-add
            @add-failed="$emit('addFailed')"
          >
            <ProductColorwaysRail :items="colorways" />
          </ProductOptionsPanel>

          <!-- The product went unavailable while the panel was open (a
               colorway switch to a masked sibling) — say so rather than
               rendering an empty size grid. -->
          <p
            v-else
            class="state-note text-base-plus uppercase p-base"
          >
            {{ $t('quickAdd.unavailable') }}
          </p>

          <template #tab>
            <button
              ref="closeButton"
              class="notch-close notch-close-tall text-grey-6"
              :aria-label="$t('quickAdd.close')"
              @click="expanded = false"
            >
              <IconsX />
              <span class="sr-only">{{ $t('quickAdd.close') }}</span>
            </button>
          </template>
        </NotchPanel>
      </Transition>

      <!-- Sold out stays clickable while the rail has siblings to offer
           ("see other options" — the panel is the only path to it); with no
           colorway group there's nothing to show, so it's a plain disabled
           "sold out". -->
      <Transition name="button-fade">
        <button
          v-if="!expanded"
          ref="purchaseButton"
          class="purchase text-base-plus font-primary"
          :disabled="!live || (!live.availableForSale && !hasAlternatives)"
          :aria-expanded="expanded"
          aria-controls="buy-panel"
          @click="expanded = true"
        >
          {{ label }}
        </button>
      </Transition>

      <template #fallback>
        <button
          class="purchase text-base-plus font-primary"
          disabled
        >
          {{ $t('buyBox.loading') }}
        </button>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
/**
 * The PDP's integrated buy flow: a "purchase" button that expands in place
 * into a quick-add-styled panel — sizes, the colorway rail, quantity, and
 * add to cart (the shared ProductOptionsPanel with the rail in its slot).
 * Sits in the page's sticky buy column keeping the button's height in flow;
 * the expanded panel overlays absolutely, hanging upward from the button's
 * spot (growing in flow would fill the sticky's grid area and cost it the
 * travel room that pins it in view). The options region caps and scrolls so
 * the panel never outgrows the viewport, with the add button pinned below
 * the scroll.
 *
 * No fetching here — unlike the quick-add drawer (whose cards carry lean
 * batch data), the PDP's live detail already includes full variants and is
 * passed down. Selection is bound out as v-model:variant-id so the page's
 * ?variant= URL sync keeps working. A colorway hop closes the panel (see the
 * route watcher); the options panel resets selection on the product swap.
 */
const props = defineProps({
  // Live Storefront product detail (variants/options/price), null until
  // loaded or when the product isn't sold in this market.
  live: { type: Object, default: null },
  livePending: { type: Boolean, default: false },
  // [{ doc, live, current }] for the colorway rail.
  colorways: { type: Array, default: () => [] },
})

// A failed add usually means the cached availability lied — the page
// refetches live so the pills tell the truth.
defineEmits(['addFailed'])

const { t } = useI18n()

const variantId = defineModel('variantId', { default: null })

const expanded = ref(false)

// Keyboard: Escape collapses; the purchase button unmounts as the panel
// opens (and vice versa), which would drop focus on <body> — so focus moves
// to the panel's close button on expand and back to the (remounted)
// purchase button on collapse. The cart opening over the panel keeps focus.
onKeyStroke('Escape', () => {
  if (expanded.value) expanded.value = false
})
const panelEl = ref(null)
const closeButton = ref(null)
const purchaseButton = ref(null)
useOverlayFocus(expanded, {
  root: () => panelEl.value?.$el,
  initial: () => closeButton.value,
  returnTo: () => purchaseButton.value,
})

const variants = computed(() => props.live?.variants.nodes ?? [])

// Another colorway the rail actually links (sold in this market, not the
// one being viewed) — the same condition the rail uses to render a link.
const hasAlternatives = computed(() => props.colorways.some((c) => !c.current && c.live))

const label = computed(() => {
  if (!props.live) return props.livePending ? t('buyBox.loading') : t('buyBox.unavailable')
  if (!props.live.availableForSale) return hasAlternatives.value ? t('buyBox.seeOptions') : t('buyBox.soldOut')
  return t('buyBox.purchase')
})

// Never stack panels: the cart drawer opening — including after this panel's
// own add — collapses the panel, mirroring the quick-add drawer.
const { isOpen: cartOpen } = useCart()
watch(cartOpen, (open) => {
  if (open) expanded.value = false
})

// A colorway hop navigates in place: close and let the new product's content
// animate in — the purchase button is the re-entry. route.path, NOT fullPath:
// size picks rewrite the ?variant query and must not collapse the panel.
const route = useRoute()
watch(
  () => route.path,
  () => {
    expanded.value = false
  },
)
</script>

<style scoped>
/* The flow footprint stays the button's box either way — the expanded panel
   overlays from it, so the sticky buy column never grows. */
.buy-panel {
  position: relative;
  height: var(--spacing-button-lg-height);
}

.purchase {
  height: var(--spacing-button-lg-height);
  width: 100%;
  border-radius: var(--radius-def);
  background-color: var(--color-grey-7);
  color: var(--color-white);
  transition:
    background-color 0.3s,
    color 0.3s;

  &:hover:enabled {
    background-color: var(--color-yellow);
    color: var(--color-green);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Filled control: ring inside the fill (see MainNav). */
  &:focus-visible {
    outline-offset: -0.2rem;
  }
}

.panel {
  position: absolute;
  bottom: 0;
  left: 0;
  /* Full width like the quick add: the mobile tab sits above the body
     (tab-top-max-md); from 768px it hangs into the column gap, like the
     quick-add drawer's does. */
  width: 100%;

  --notch-tab-radius: 3rem;
}

/* Rising in and dropping out like the quick-add drawer. The leaving panel
   overlays the returning button (both absolute-anchored to the same spot),
   so the swap never stacks in flow. */
.panel-pop-enter-active,
.panel-pop-leave-active {
  transition:
    transform 0.3s,
    opacity 0.3s;
}

.panel-pop-enter-from,
.panel-pop-leave-to {
  transform: translateY(3rem);
  opacity: 0;
}

/* The button's return holds briefly so it fades in as the panel's drop-out
   clears. No leave rules: expanding covers it with the panel instantly. */
.button-fade-enter-active {
  transition: opacity 0.25s 0.15s;
}

.button-fade-enter-from {
  opacity: 0;
}

/* Cap and scroll the options region (sizes/rail/quantity) so the panel never
   outgrows the viewport — the add button below it stays pinned. The cap is
   the viewport minus the sticky column's bottom-nav clearance, the add
   button, and a matching gap above. Top padding because the options panel
   expects a wrapper header above and this panel has none. Flat :deep — the
   compiler mangles it inside nesting. */
.panel :deep(.options) {
  padding-top: var(--spacing-base);
  overflow-y: auto;
  /* Mobile also clears the tab-top close button (5rem) hanging above. */
  max-height: calc(100svh - var(--spacing-button-lg-height) * 2 - var(--spacing-base) * 2 - 5rem);

  @media (min-width: 768px) {
    max-height: calc(100svh - var(--spacing-button-lg-height) * 2 - var(--spacing-base) * 2);
  }
}

.state-note {
  color: var(--color-grey-6);
}
</style>
