<template>
  <component
    :is="live ? NuxtLink : 'div'"
    :to="live ? `/products/${live.handle}` : undefined"
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

    <div class="card-meta uppercase text-xs">
      <p class="title">{{ live?.title || doc.title }}</p>

      <p
        v-if="doc.tagline"
        class="tagline text-2xs"
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
          >Sold out</span
        >
      </p>

      <p
        v-else
        class="tagline text-2xs"
      >
        Unavailable
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
  color: var(--color-grey-1);

  &.is-unavailable {
    opacity: 0.45;
  }
}

.image-frame {
  aspect-ratio: 3 / 4;
  background-color: var(--color-grey-7);
  border-radius: var(--radius-def);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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
