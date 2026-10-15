<template>
  <!-- inert until revealed: closed, the drawer is only faded out, so without
       it the options panel, learn-more links and close button would stay in
       the tab order and the accessibility tree. -->
  <button
    class="overlay-backdrop z-(--z-backdrop)"
    :class="{ active: isOpen && revealed }"
    :inert="!(isOpen && revealed)"
    @click="close"
  >
    <span class="sr-only">{{ $t('quickAdd.close') }}</span>
  </button>

  <!-- A dialog, not a modal one: the nav stays usable while it's open. -->
  <aside
    id="quick-add-drawer"
    ref="drawerEl"
    class="quick-add-drawer"
    :class="{ active: isOpen && revealed }"
    role="dialog"
    :aria-label="$t('quickAdd.label')"
    :inert="!(isOpen && revealed)"
  >
    <NotchPanel class="quick-add-body tab-top-max-md text-green">
      <div class="p-base space-y-base">
        <!-- Mobile: title over price on the left, an underlined learn-more
             link top-right. Desktop: the original title-left / price-right
             row — learn more lives in the pill beside the panel instead. -->
        <header class="flex items-start justify-between gap-base font-secondary">
          <div class="md:flex md:flex-1 md:items-start md:justify-between md:gap-base">
            <p class="title text-base uppercase leading-snug">{{ title }}</p>

            <p
              v-if="price"
              class="text-base leading-snug"
            >
              {{ price }}
            </p>
          </div>

          <NuxtLink
            v-if="pdpPath"
            :to="pdpPath"
            class="learn-more text-base uppercase leading-snug md:hidden"
            @click="close"
          >
            {{ $t('quickAdd.learnMore') }}
          </NuxtLink>
        </header>
      </div>

      <ProductOptionsPanel
        v-if="variants.length"
        v-model:variant-id="selectedId"
        v-model:quantity="quantity"
        :product="detail"
        open-cart-on-add
        @add-failed="execute"
      />

      <!-- Only once an open's fetch has settled (revealed covers errors too,
         where `data` stays null) — before the first open there's no data at
         all, and "not available" would be wrong. -->
      <p
        v-else-if="revealed && !pending"
        class="text-base-plus uppercase state-note"
      >
        {{ $t('quickAdd.unavailable') }}
      </p>

      <template #tab>
        <button
          ref="closeButton"
          class="notch-close notch-close-tall text-grey-6"
          :aria-label="$t('quickAdd.close')"
          @click="close"
        >
          <IconsX />
          <span class="sr-only">{{ $t('quickAdd.close') }}</span>
        </button>
      </template>
    </NotchPanel>

    <!-- Desktop only: learn more as its own pill beside the panel (mobile
         carries it as the header link instead). -->
    <div class="learn-more-container hidden w-1/2 md:block">
      <NuxtLink
        v-if="pdpPath"
        :to="pdpPath"
        class="pill-button text-base-plus"
        @click="close"
      >
        {{ $t('quickAdd.learnMore') }}
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup>
/**
 * Quick-add overlay panel: the cart drawer's bottom-left mirror, anchored
 * above the "shop" button in SecondaryNav. Opened from a card's quick-add
 * trigger (useQuickAdd), it fetches the product's full variants via the
 * cached /api/product route — the home page's batch read stays lean.
 *
 * The variant UI (sizes/quantity/add with its state machine) is the shared
 * ProductOptionsPanel; this wrapper owns fetching, the title/price header,
 * and the drawer chrome (NotchPanel + learn more).
 */
const { active, isOpen, pendingOpen, close } = useQuickAdd()
const localePath = useLocalePath()
const market = useMarket()
const route = useRoute()
const formatPrice = useMoney()

useScrollLock(isOpen)

// Keyboard: Escape closes; focus moves to the close button once the drawer
// is revealed (a cold open holds it through the fetch) and returns to the
// card's trigger on close. No fallback: the only close path that loses the
// trigger is a navigation, where the new page takes over.
onKeyStroke('Escape', () => {
  if (isOpen.value) close()
})
const drawerEl = ref(null)
const closeButton = ref(null)
useOverlayFocus(
  computed(() => isOpen.value && revealed.value),
  { root: () => drawerEl.value, initial: () => closeButton.value },
)

// The backdrop blocks clicks but not navigation itself (back button,
// programmatic) — close instead of lingering over the new page with the old
// product's sizes.
watch(
  () => route.fullPath,
  () => close(),
)

// Keep the last product while closing so the panel doesn't blank out
// mid slide-down transition.
const handle = ref('')

// immediate/watch false: handle is '' until the first open (an immediate
// fetch would 400), and we drive refreshes ourselves below — with
// immediate:false Nuxt doesn't start the query watcher until a manual
// execute, so relying on it silently never fetches.
// The catalog report's null fallback is the gid the card handed us.
const { data, pending, execute } = useShopifyProduct(handle, {
  gid: () => activeGid.value,
  immediate: false,
  watch: false,
})

// Gid of the product being shown; outlives `active` (close nulls it) so a
// late response still maps to the right catalog entry.
const activeGid = ref('')

// Reset per open, not per product: the panel keeps quantity across a
// same-product reopen, and picking up where a previous add left off ("3")
// is never what someone reopening quick add means.
const quantity = ref(1)

// The drawer doesn't slide up on open until it has something to show: a cold
// open holds `revealed` off through the fetch (triggers show a progress
// cursor via `pendingOpen` meanwhile), so the panel never appears empty and
// pops to height. A fresh same-product reopen was revealed before and stays
// so — the background refresh remains invisible.
const revealed = ref(false)

// Guards the awaits below against a second open racing the first (click A,
// then B while A's fetch is in flight): only the latest open may reveal.
let openToken = 0

watch(active, async (payload) => {
  if (!payload?.live?.handle) return
  quantity.value = 1
  activeGid.value = payload.live.id ?? ''
  // Stale if it's a different product OR the kept response was fetched for
  // another market (its prices are in the wrong currency) — hold the reveal
  // instead of flashing the old data.
  if (payload.live.handle !== handle.value || data.value?.country !== market.value.country) {
    handle.value = payload.live.handle
    data.value = null
    revealed.value = false
    pendingOpen.value = true
  }
  const token = ++openToken
  // Refresh on every open; cheap thanks to the 15s SWR cache server-side.
  try {
    await execute()
  } finally {
    if (token === openToken) {
      pendingOpen.value = false
      // A close during the fetch (route change, cart opening) wins — don't
      // reveal over whatever the user moved on to. An error still reveals:
      // the panel shows "unavailable" rather than swallowing the click.
      if (isOpen.value) revealed.value = true
    }
  }
})

const detail = computed(() => data.value?.product ?? null)
const variants = computed(() => detail.value?.variants.nodes ?? [])

// Titles follow "Base · Color" (colorway convention) — header shows the base.
const title = computed(() => baseName(active.value?.live?.title ?? detail.value?.title ?? ''))

// The panel owns selection (and resets it per product); bound here so the
// header price tracks the selected size through the same fallback chain.
const selectedId = ref(null)
const selectedVariant = computed(() => pickVariant(variants.value, selectedId.value))

const price = computed(() =>
  formatPrice(selectedVariant.value?.price ?? active.value?.live?.priceRange?.minVariantPrice),
)

const pdpPath = computed(() => (handle.value ? localePath(`/products/${handle.value}`) : null))

const { isOpen: cartOpen } = useCart()
// The reverse of useQuickAdd.open() closing the cart: cart opening closes us.
watch(cartOpen, (open) => {
  if (open) close()
})
</script>

<style scoped>
.quick-add-drawer {
  position: fixed;
  z-index: var(--z-drawer);
  bottom: var(--spacing-button-md-height);
  /* Full width on mobile regardless of anchor — half a phone screen fits
     nothing (the cart drawer goes full width the same way). Column-sized
     from 768px up. */
  left: var(--spacing-base);
  right: var(--spacing-base);
  /* A definite height, not max-height: the body's max-height: 100% below
     needs a resolvable parent height (percentages ignore an auto-height
     parent's max-height), or tall content grows the bottom-anchored body up
     over the tab headroom. The drawer is transparent, so the unused region
     above short content shows nothing. */
  height: calc(100svh - var(--spacing-button-lg-height) - var(--spacing-base) * 4);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  color: var(--color-green);
  gap: var(--spacing-base);
  pointer-events: none;
  padding-bottom: var(--spacing-base);
  /* Headroom for the mobile tab-top close button — it hangs above the body,
     and the drawer's overflow: hidden would clip it flush with the panel.
     The desktop tab is back on the side and needs none. */
  padding-top: 5rem;

  @media (min-width: 768px) {
    bottom: var(--spacing-button-lg-height);
    padding-top: 0;
  }

  .quick-add-body {
    --notch-tab-radius: 3rem;

    display: flex;
    flex-direction: column;
    min-height: 0;
    /* Cap to the drawer's content box: taller content would otherwise grow
       the bottom-anchored body up into the tab's headroom (the padding-top
       above) and clip the close button. */
    max-height: 100%;
    width: 100%;
    transform: translateY(3rem);
    transition:
      transform 0.3s,
      opacity 0.3s;
    opacity: 0;

    @media (min-width: 768px) {
      width: 50%;
    }
  }

  .learn-more-container {
    transform: translateY(3rem);
    transition:
      transform 0.3s,
      opacity 0.3s;
    transition-delay: 0.05s;
    opacity: 0;
  }

  &.active {
    pointer-events: auto;

    .quick-add-body,
    .learn-more-container {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    right: auto;
    width: calc(50vw - (var(--spacing-base) * 1.5));
  }
}

/* When the capped body is shorter than its content, the options region
   scrolls and the add button stays pinned below it (the BuyPanel treatment)
   — min-height: 0 down the chain so the flex columns may actually shrink. */
.quick-add-body :deep(.panel-body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.quick-add-body :deep(.options-panel) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.quick-add-body :deep(.options) {
  overflow-y: auto;
}

.state-note {
  color: var(--color-grey-6);
}

/* Mobile: underlined text link in the header's top-right. */
.learn-more {
  color: var(--color-grey-6);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  transition: color 0.3s;

  &:hover {
    color: var(--color-grey-7);
  }
}
</style>
