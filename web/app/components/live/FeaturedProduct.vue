<template>
  <div class="featured">
    <button
      v-if="!open"
      class="pill-button featured-button text-base-plus"
      :class="{ 'is-pending': pending }"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="show"
    >
      {{ $t('live.featuredProduct') }}
    </button>

    <template v-else>
      <NotchPanel class="image-panel tab-top-max-md">
        <div class="image-wrap">
          <img
            v-if="image"
            :src="image.src"
            :alt="image.alt"
            class="image"
          />
        </div>

        <template #tab>
          <button
            class="close"
            :aria-label="$t('live.closeFeatured')"
            @click="open = false"
          >
            <IconsX />
            <span class="sr-only">{{ $t('live.closeFeatured') }}</span>
          </button>
        </template>
      </NotchPanel>

      <div
        class="options-wrap"
        role="dialog"
        :aria-label="title"
      >
        <header class="flex items-start justify-between gap-base p-base font-secondary text-base leading-[1.2]">
          <p class="uppercase">{{ title }}</p>
          <p v-if="price">{{ price }}</p>
        </header>

        <ProductOptionsPanel
          v-if="variants.length"
          v-model:variant-id="selectedId"
          v-model:quantity="quantity"
          :product="detail"
          open-cart-on-add
          @add-failed="execute"
        />

        <p
          v-else-if="!pending"
          class="state-note font-secondary text-base uppercase px-base pb-base"
        >
          {{ $t('quickAdd.unavailable') }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * The live page's featured product: a "featured product" pill that opens,
 * in place, the product's image in a NotchPanel (close in the tab) over the
 * shared variant picker (ProductOptionsPanel) — the quick-add drawer's
 * content in the page's dark palette. Like the drawer, this owns the live
 * fetch (full variants via the cached /api/product route, on first open,
 * refreshed per open), the title/price header, and the chrome; the panel
 * owns sizes/quantity/add. Adding opens the cart drawer.
 */
const props = defineProps({
  // The Sanity product (productProjection): title, slug, featuredImage…
  product: { type: Object, required: true },
})

const open = defineModel('open', { type: Boolean, default: false })
const quantity = ref(1)
const selectedId = ref(null)

const { data, pending, execute } = useShopifyProduct(() => props.product.slug, { immediate: false, watch: false })

const show = async () => {
  if (pending.value) return
  quantity.value = 1
  // Refresh on every open (cheap via the server's SWR cache); a cold open
  // waits for data so the panels never appear empty.
  await execute()
  open.value = true
}

onKeyStroke('Escape', () => {
  open.value = false
})

const detail = computed(() => data.value?.product ?? null)
const variants = computed(() => detail.value?.variants.nodes ?? [])

// Titles follow "Base · Color" (colorway convention) — header shows the base.
const title = computed(() => {
  const full = detail.value?.title ?? props.product.title ?? ''
  return full.includes('·') ? full.split('·')[0].trim() : full
})

const selectedVariant = computed(() => pickVariant(variants.value, selectedId.value))
const price = computed(() => formatMoney(selectedVariant.value?.price ?? detail.value?.priceRange?.minVariantPrice))

// Editorial featured image first, Shopify's as the fallback.
const productImage = useProductImage()
const image = computed(() => productImage(props.product, detail.value, { w: 900 }))
</script>

<style scoped>
/* A flex column that may shrink (min-height: 0 down the chain), so when the
   open panels outgrow the corner's cap the size grid scrolls and the add
   button stays pinned — the quick-add drawer's treatment. Under 768px the
   image panel's tab sits above it (tab-top-max-md), so the column carries
   headroom for it. */
.featured {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  min-height: 0;
  padding-top: 5.2rem;

  @media (min-width: 768px) {
    padding-top: 0;
  }
}

/* Holding for the variants fetch on a cold open. Custom over
   cursor-progress: global.css's unlayered `button { cursor: pointer }`
   outranks layered utilities. */
.featured-button.is-pending {
  cursor: progress;
}

/* Both panels in the site's dark blue on the black page, grey-1 text. */
.image-panel {
  --notch-bg: var(--color-blue);
  --notch-tab-radius: 3rem;

  flex: none;
  color: var(--color-grey-1);
}

.image-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-base);
  aspect-ratio: 16 / 6;
}

.image {
  max-width: 60%;
  max-height: 100%;
  object-fit: contain;
}

/* Tab shape/background/fillet come from NotchPanel — just the button's
   own size and content layout. */
.close {
  width: 5rem;
  height: 5.2rem;
  color: var(--color-grey-1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.close :deep(.icon-x) {
  width: 3rem;
}

.options-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background-color: var(--color-blue);
  color: var(--color-grey-1);
  border-radius: var(--radius-def);
  overflow: hidden;
}

.options-wrap :deep(.options-panel) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.options-wrap :deep(.options) {
  overflow-y: auto;
}

/* Re-theme the shared (light) picker for the dark panel: dim labels, dark
   pills that invert when selected, a light add button. */
.options-wrap :deep(.label) {
  color: var(--color-grey-3);
}

.options-wrap :deep(.size-pill) {
  background-color: var(--color-grey-6);
  color: var(--color-grey-1);

  &.is-selected {
    background-color: var(--color-grey-1);
    color: var(--color-blue);
  }
}

.options-wrap :deep(.add-to-cart) {
  background-color: var(--color-grey-2);
  color: var(--color-blue);
}

/* The stepper's −/+ inherit the panel's light text, invisible on their
   light circles. */
.options-wrap :deep(.stepper button) {
  color: var(--color-blue);
}

.state-note {
  color: var(--color-grey-3);
}
</style>
