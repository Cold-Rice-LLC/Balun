<template>
  <nav
    class="market-switcher text-2xs uppercase"
    aria-label="Market"
  >
    <ul class="flex gap-x-xs">
      <li
        v-for="loc in locales"
        :key="loc.code"
      >
        <nuxt-link
          :to="switchLocalePath(loc.code)"
          :class="{ 'is-active': loc.code === locale }"
        >
          {{ loc.name }}
        </nuxt-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * Market switcher: swaps the /{lang}-{country} URL prefix on the current
 * route. Currency follows market automatically (@inContext), so this IS the
 * currency switcher — never build a separate one (see
 * docs/shopify-and-localization-strategy.md).
 */
const { locales, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<style scoped>
.market-switcher {
  margin-top: var(--spacing-sm);

  a {
    pointer-events: auto;
    color: var(--color-grey-6);

    &.is-active {
      color: var(--color-grey-4);
      text-decoration: underline;
      text-underline-offset: 0.3em;
    }
  }
}
</style>
