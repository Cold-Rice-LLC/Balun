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

      <ProductQuickAddTrigger
        class="quick-add"
        :doc="doc"
        :live="live"
      />
    </div>

    <div class="card-meta uppercase">
      <p class="title">{{ live?.title || doc.title }}</p>

      <p
        v-if="doc.tagline"
        class="tagline"
      >
        {{ doc.tagline }}
      </p>

      <p
        v-if="live"
        class="price"
      >
        {{ formatMoney(live.priceRange.minVariantPrice) }}
        <span
          v-if="!live.availableForSale"
          class="sold-out"
          >{{ $t('product.soldOut') }}</span
        >
      </p>

      <p
        v-else
        class="tagline"
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

defineProps({
  doc: {
    type: Object,
    required: true,
  },
  live: {
    type: Object,
    default: null,
  },
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
  position: relative;
  aspect-ratio: 3 / 4;
  background-color: var(--color-grey-2);
  border-radius: var(--radius-def);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* Look comes from ProductQuickAddTrigger's default; only position it here. */
.quick-add {
  position: absolute;
  bottom: var(--spacing-xs);
  right: var(--spacing-xs);
}

.card-meta {
  padding: var(--spacing-sm) var(--spacing-xs);

  .tagline {
    color: var(--color-grey-4);
  }

  .sold-out {
    color: var(--color-orange);
    margin-left: var(--spacing-xs);
  }
}
</style>
