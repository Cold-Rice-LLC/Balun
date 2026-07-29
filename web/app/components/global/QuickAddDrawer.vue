<template>
  <button
    class="quick-add-backdrop"
    :class="{ active: isOpen }"
    @click="close"
  >
    <span class="sr-only">{{ $t('quickAdd.close') }}</span>
  </button>

  <aside
    id="quick-add-drawer"
    class="quick-add-drawer"
    :class="{ active: isOpen }"
    aria-label="Quick add"
  >
    <NotchPanel class="quick-add-body text-green">
      <div class="p-base space-y-base">
        <header class="flex items-start justify-between gap-base font-secondary">
          <p class="title text-base uppercase">{{ title }}</p>

          <div class="flex items-center gap-base">
            <p
              v-if="price"
              class="text-base"
            >
              {{ price }}
            </p>
          </div>
        </header>

        <!-- Bare loading only when there's nothing to show — a same-product
           reopen keeps the sizes visible through the background refresh. -->
        <p
          v-if="pending && !variants.length"
          class="font-secondary uppercase state-note"
        >
          {{ $t('quickAdd.loadingSizes') }}
        </p>
      </div>

      <ProductOptionsPanel
        v-if="variants.length"
        v-model:variant-id="selectedId"
        :product="detail"
        open-cart-on-add
        @add-failed="execute"
      />

      <!-- Only after a completed fetch — before the first open there's no
         data at all, and "not available" would be wrong. -->
      <p
        v-else-if="data"
        class="text-base-plus uppercase state-note"
      >
        {{ $t('quickAdd.unavailable') }}
      </p>

      <template #tab>
        <button
          class="close"
          :aria-label="$t('quickAdd.close')"
          @click="close"
        >
          <IconsX />
          <span class="sr-only">{{ $t('quickAdd.close') }}</span>
        </button>
      </template>
    </NotchPanel>

    <div class="learn-more-container w-1/2">
      <NuxtLink
        v-if="pdpPath"
        :to="pdpPath"
        class="learn-more text-base-plus"
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
 * the catalog report, and the drawer chrome (NotchPanel + learn more).
 */
const { active, isOpen, close } = useQuickAdd()
const localePath = useLocalePath()
const market = useMarket()

useScrollLock(isOpen)

// Keep the last product while closing so the panel doesn't blank out
// mid slide-down transition.
const handle = ref('')

// immediate/watch false: handle is '' until the first open (an immediate
// fetch would 400), and we drive refreshes ourselves below — with
// immediate:false Nuxt doesn't start the query watcher until a manual
// execute, so relying on it silently never fetches.
const { data, pending, execute } = useShopifyProduct(handle, {
  immediate: false,
  watch: false,
})

// Gid of the product being shown; outlives `active` (close nulls it) so a
// late response still maps to the right catalog entry.
const activeGid = ref('')

watch(active, (payload) => {
  if (!payload?.live?.handle) return
  activeGid.value = payload.live.id ?? ''
  // Stale if it's a different product OR the kept response was fetched for
  // another market (its prices are in the wrong currency) — show the loading
  // state instead of flashing the old data.
  if (payload.live.handle !== handle.value || data.value?.country !== market.value.country) {
    handle.value = payload.live.handle
    data.value = null
  }
  // Refresh on every open; cheap thanks to the 60s SWR cache server-side.
  execute()
})

// Report what the detail fetch learned to the shared catalog so the cards
// behind this drawer stay consistent with it. Loaded-but-null = masked from
// this market — real info, mapped via the gid the card handed us.
const { report } = useLiveCatalog()
watch(data, (val) => {
  if (!val) return
  if (val.product?.id) report(val.product.id, val.product, val.country)
  else if (activeGid.value) report(activeGid.value, null, val.country)
})

const detail = computed(() => data.value?.product ?? null)
const variants = computed(() => detail.value?.variants.nodes ?? [])

// Titles follow "Base · Color" (colorway convention) — header shows the base.
const title = computed(() => {
  const full = active.value?.live?.title ?? detail.value?.title ?? ''
  return full.includes('·') ? full.split('·')[0].trim() : full
})

// The panel owns selection (and resets it per product); bound here so the
// header price tracks the selected size through the same fallback chain.
const selectedId = ref(null)
const selectedVariant = computed(() => pickVariant(variants.value, selectedId.value))

const price = computed(() =>
  formatMoney(selectedVariant.value?.price ?? active.value?.live?.priceRange?.minVariantPrice),
)

const pdpPath = computed(() => (handle.value ? localePath(`/products/${handle.value}`) : null))

const { isOpen: cartOpen } = useCart()
// The reverse of useQuickAdd.open() closing the cart: cart opening closes us.
watch(cartOpen, (open) => {
  if (open) close()
})
</script>

<style scoped>
.quick-add-backdrop {
  position: fixed;
  inset: 0;
  z-index: 4800;
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(6px);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.quick-add-drawer {
  position: fixed;
  z-index: 4900;
  bottom: var(--spacing-button-lg-height);
  left: var(--spacing-base);
  width: calc(50vw - (var(--spacing-base) * 1.5));
  max-height: calc(100svh - var(--spacing-button-lg-height) - var(--spacing-base) * 4);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  color: var(--color-green);
  gap: var(--spacing-base);
  pointer-events: none;
  padding-bottom: var(--spacing-base);

  .quick-add-body {
    --notch-tab-radius: 3rem;

    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 50%;
    transform: translateY(3rem);
    transition:
      transform 0.3s,
      opacity 0.3s;
    opacity: 0;
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
}

/* Tab shape/background/fillet come from NotchPanel — this is just the
   button's own size and content layout. */
.close {
  width: 5rem;
  height: 6.2rem;
  color: var(--color-grey-6);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Top-level, not nested inside .close: the scoped-CSS compiler mangles
   :deep() inside native CSS nesting (emits `& [data-v] .icon-x`, which
   requires an intermediate scoped element and never matches here). */
.close :deep(.icon-x) {
  width: 3rem;
  transform: translateX(-0.5rem);
}

.state-note {
  color: var(--color-grey-6);
}

.learn-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--spacing-button-lg-height);
  border-radius: var(--radius-def);
  background-color: var(--color-grey-2);
  color: var(--color-grey-6);
  transition:
    background-color 0.3s,
    color 0.3s;
}

@media (max-width: 768px) {
  .quick-add-drawer {
    right: var(--spacing-base);
    width: auto;
  }
}
</style>
