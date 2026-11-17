<template>
  <!-- Floats over the cart button's column (full width on phones), a gutter
       above the bottom nav, and over everything else on the page until
       answered (--z-consent). While home tucks the shop/cart buttons away, it
       drops into their slot and rises with them. Either button records the
       choice and closes it (useCookieConsent). Waits while MarketPrompt holds
       the same slot. -->
  <section
    v-if="noticeOpen && !promptOpen"
    class="fixed z-(--z-consent) left-gutter right-gutter md:left-[calc(50%+var(--spacing-gutter)/2)] bottom-[calc(var(--spacing-button-md-height)+var(--spacing-gutter))] md:bottom-[calc(var(--spacing-button-lg-height)+var(--spacing-gutter))] grid grid-cols-2 rounded-def overflow-hidden bg-grey-1 text-grey-6 hc-fill transition-transform duration-300 ease-out motion-reduce:transition-none"
    :class="{ 'translate-y-(--spacing-button-md-height) md:translate-y-(--spacing-button-lg-height)': tucked }"
    :aria-label="$t('cookies.label')"
  >
    <!-- Capped and scrolling (focusable, so the keyboard can scroll it in
         Safari too): uncapped it covered 70% of a phone screen. Phones get
         smaller text and a quarter-screen cap; the buttons below stay in
         view. -->
    <div
      class="col-span-2 max-h-[25svh] md:max-h-[40svh] overflow-y-auto p-sm md:p-base space-y-[1.2em] font-secondary text-sm md:text-base leading-snug"
      tabindex="0"
    >
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
      class="h-(--spacing-button-md-height) md:h-(--spacing-button-lg-height) px-sm bg-grey-6 text-white text-base-plus leading-none lowercase hc-fill focus-visible:outline-offset-[-0.2rem]"
      @click="accept('technical')"
    >
      {{ $t('cookies.acceptTechnical') }}
    </button>

    <button
      type="button"
      class="h-(--spacing-button-md-height) md:h-(--spacing-button-lg-height) px-sm bg-yellow text-grey-6 text-base-plus leading-none lowercase focus-visible:outline-offset-[-0.2rem]"
      @click="accept('all')"
    >
      {{ $t('cookies.acceptAll') }}
    </button>
  </section>
</template>

<script setup>
const localePath = useLocalePath()
const { noticeOpen, accept, renew } = useCookieConsent()
// Lives in the layout, so it sees every page view.
const router = useRouter()
let stopRenewing
onMounted(() => {
  renew()
  stopRenewing = router.afterEach(renew)
})
onBeforeUnmount(() => stopRenewing?.())
const { promptOpen } = useMarketPrompt()
const { tucked } = useShopCartTucked()
</script>
