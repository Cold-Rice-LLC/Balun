<template>
  <!-- Animation on this stable <section>; the inner link swaps div → NuxtLink
       when live data hydrates without restarting the animation. -->
  <section class="featured-product enter-in-fade-up">
    <component
      :is="live ? NuxtLink : 'div'"
      :to="live ? localePath(`/products/${product.slug}`) : undefined"
      class="featured-link block"
      :class="{ 'is-unavailable': !live }"
    >
      <div class="image-frame">
        <img
          v-if="live?.featuredImage"
          :src="live.featuredImage.url"
          :alt="live.featuredImage.altText || live.title"
        />
      </div>

      <div class="featured-meta uppercase">
        <p
          v-if="module.heading"
          class="eyebrow text-2xs"
        >
          {{ module.heading }}
        </p>

        <p class="title text-sm">{{ live?.title || product.title }}</p>

        <p
          v-if="product.tagline"
          class="tagline text-2xs"
        >
          {{ product.tagline }}
        </p>

        <p
          v-if="live"
          class="price text-sm"
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
  </section>
</template>

<script setup>
/**
 * Home module: a single product given prominence. `module.product` is the
 * Sanity editorial doc; live market price/availability comes from `liveByGid`
 * (hydrated client-side by the page), null when the market's catalog omits it.
 */
// String names don't resolve components in dynamic :is at runtime — resolve
// NuxtLink explicitly (mirrors ProductCard).
const NuxtLink = resolveComponent('NuxtLink')
const localePath = useLocalePath()

const props = defineProps({
  module: { type: Object, required: true },
  liveByGid: { type: Object, default: () => ({}) },
})

const product = computed(() => props.module.product)
const live = computed(() => props.liveByGid[product.value?.gid] ?? null)
</script>

<style scoped>
.featured-product {
  margin-bottom: var(--spacing-base);
}

.featured-link {
  color: var(--color-grey-1);

  &.is-unavailable {
    opacity: 0.45;
  }
}

.image-frame {
  aspect-ratio: 16 / 9;
  background-color: var(--color-grey-7);
  border-radius: var(--radius-def);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.featured-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-xs);

  .eyebrow {
    color: var(--color-grey-4);
  }

  .tagline {
    color: var(--color-grey-4);
  }

  .sold-out {
    color: var(--color-orange);
    margin-left: var(--spacing-xs);
  }
}
</style>
