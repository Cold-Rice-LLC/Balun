<template>
  <section class="product-grid-module">
    <h2
      v-if="module.heading"
      class="uppercase text-xs section-heading"
    >
      {{ module.heading }}
    </h2>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-base">
      <!-- Animation on this stable wrapper (not ProductCard): the card root
           swaps div → NuxtLink once live data hydrates, which would remount and
           restart the animation. -->
      <div
        v-for="(product, index) in products"
        :key="product._id"
        class="enter-in-fade-up"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <ProductCard
          :doc="product"
          :live="liveByGid[product.gid] ?? null"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * Home module: product grid. `module.products` are Sanity editorial docs;
 * `liveByGid` maps Shopify gid → live market-priced product (hydrated client-
 * side by the page), passed to each card for price/availability.
 */
const props = defineProps({
  module: { type: Object, required: true },
  liveByGid: { type: Object, default: () => ({}) },
})

const products = computed(() => props.module.products ?? [])
</script>

<style scoped>
.product-grid-module + .product-grid-module,
.product-grid-module {
  margin-bottom: var(--spacing-base);
}

.section-heading {
  color: var(--color-grey-4);
  margin-bottom: var(--spacing-base);
}
</style>
