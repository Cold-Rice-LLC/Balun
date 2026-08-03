<template>
  <component
    :is="live ? NuxtLink : 'div'"
    :to="live ? localePath(`/products/${live.handle}`) : undefined"
    class="product-card block"
    :class="{ 'is-unavailable': !live }"
  >
    <div class="image-frame">
      <img
        v-if="live?.featuredImage"
        :src="live.featuredImage.url"
        :alt="live.featuredImage.altText || live.title"
        loading="lazy"
      />
    </div>

    <div class="card-meta uppercase flex items-center justify-between gap-base">
      <p class="title">{{ title }}</p>

      <!-- Renders only when live and purchasable (the trigger's own v-if);
           otherwise the row shows why there's no "+". No prices here — the
           grid is editorial, price lives on the PDP/quick add. -->
      <ProductQuickAddTrigger
        class="quick-add"
        :doc="doc"
        :live="live"
      />

      <p
        v-if="live && !live.availableForSale"
        class="stock-note"
      >
        {{ $t('product.outOfStock') }}
      </p>

      <p
        v-else-if="!live"
        class="stock-note"
      >
        {{ $t('product.unavailable') }}
      </p>
    </div>
  </component>
</template>

<script setup>
/**
 * Featured/listing product card. `doc` is the Sanity product (editorial),
 * `live` the matching Storefront API product — null when Shopify doesn't
 * return it (unpublished, or masked from the visitor's market).
 */
// String names don't resolve components in dynamic :is at runtime —
// resolve NuxtLink explicitly.
const NuxtLink = resolveComponent('NuxtLink')
const localePath = useLocalePath()

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
  live: {
    type: Object,
    default: null,
  },
})

// Titles follow "Base · Color" (colorway convention) — the grid shows the
// base model name; the colorway reads from the image.
const title = computed(() => {
  const full = props.live?.title || props.doc.title || ''
  return full.includes('·') ? full.split('·')[0].trim() : full
})
</script>

<style scoped>
.product-card {
  color: var(--color-grey-5);

  &.is-unavailable {
    opacity: 0.45;
  }
}

.image-frame {
  aspect-ratio: 3 / 2;
  background-color: var(--color-grey-2);
  border-radius: var(--radius-def);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-meta {
  padding: var(--spacing-sm) 0;

  .stock-note {
    color: var(--color-grey-4);
  }
}

/* Bare "+" in the meta row — strip the trigger's default white pill. */
.card-meta .quick-add {
  width: auto;
  height: auto;
  background: none;
  color: var(--color-grey-5);
  font-size: var(--text-base-plus);

  &:hover {
    background: none;
    color: var(--color-grey-7);
  }
}
</style>
