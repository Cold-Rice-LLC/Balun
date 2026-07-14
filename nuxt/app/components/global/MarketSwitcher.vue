<template>
  <LocaleDropdown
    label="Market"
    :items="markets"
  />
</template>

<script setup>
/**
 * Market switcher: swaps the country half of the /{lang}-{country} URL prefix,
 * one entry per market (keeps the current language where that combo exists).
 * Currency follows market automatically (@inContext), so this IS the currency
 * switcher — never build a separate one (see
 * docs/shopify-and-localization-strategy.md). Language is a separate switcher.
 */
const { markets } = useLocaleNav()
</script>
