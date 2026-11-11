<template>
  <!-- Floats over the cart button's column (full width on phones), a gutter
       above the bottom nav. Below the drawer layer, so an open cart or
       quick add covers it. While home tucks the shop/cart buttons away, it
       drops into their slot and rises with them. Either button records the
       choice and closes it (useCookieConsent). -->
  <section
    v-if="noticeOpen"
    class="fixed z-(--z-floating) left-gutter right-gutter md:left-[calc(50%+var(--spacing-gutter)/2)] bottom-[calc(var(--spacing-button-md-height)+var(--spacing-gutter))] md:bottom-[calc(var(--spacing-button-lg-height)+var(--spacing-gutter))] grid grid-cols-2 rounded-t-def overflow-hidden bg-grey-1 text-grey-6 hc-fill transition-transform duration-300 ease-out motion-reduce:transition-none"
    :class="{ 'translate-y-(--spacing-button-md-height) md:translate-y-(--spacing-button-lg-height)': tucked }"
    :aria-label="$t('cookies.label')"
  >
    <div class="col-span-2 p-base space-y-[1.2em] font-secondary text-base leading-snug">
      <p>{{ $t('cookies.uses') }}</p>
      <p>{{ $t('cookies.choices') }}</p>
      <i18n-t
        keypath="cookies.more"
        tag="p"
        scope="global"
      >
        <template #policy>
          <NuxtLink
            :to="localePath('/cookie-policy')"
            class="underline"
            >{{ $t('cookies.policy') }}</NuxtLink
          >
        </template>
      </i18n-t>
    </div>

    <button
      type="button"
      class="h-[5.4rem] px-sm bg-grey-6 text-white text-base-plus leading-none lowercase hc-fill focus-visible:outline-offset-[-0.2rem]"
      @click="accept('technical')"
    >
      {{ $t('cookies.acceptTechnical') }}
    </button>

    <button
      type="button"
      class="h-[5.4rem] px-sm bg-yellow text-grey-6 text-base-plus leading-none lowercase focus-visible:outline-offset-[-0.2rem]"
      @click="accept('all')"
    >
      {{ $t('cookies.acceptAll') }}
    </button>
  </section>
</template>

<script setup>
const localePath = useLocalePath()
const { noticeOpen, accept } = useCookieConsent()
const { tucked } = useShopCartTucked()
</script>
