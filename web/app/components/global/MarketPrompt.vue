<template>
  <!-- The footer MarketSwitcher's modal, opened for the visitor: a grey
       panel labelled "Market" over the same blurred backdrop (values match
       global .overlay-backdrop, which can't be used here because its
       unlayered opacity would beat the transition's utilities). The root is
       the backdrop, so a click outside the panel (@click.self) or Escape
       keeps the current market, the same as "yes, continue". CookieNotice
       waits while this is open. -->
  <Transition
    enter-active-class="transition-opacity duration-300 motion-reduce:transition-none"
    leave-active-class="transition-opacity duration-300 motion-reduce:transition-none"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="promptOpen"
      class="fixed inset-0 z-(--z-modal-backdrop) grid place-items-center p-gutter bg-black/15 backdrop-blur-[0.6rem] cursor-pointer"
      @click.self="confirm"
    >
      <!-- One step: the copy, the markets to pick from (the same
           hard-navigation links as the footer's MarketSwitcher, the current
           one marked with the globe), and "yes, continue" to stay. -->
      <div
        ref="modalEl"
        class="w-full max-w-[40rem] flex flex-col rounded-def overflow-hidden bg-grey-1 text-grey-6 hc-fill cursor-auto"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('locale.market')"
      >
        <p class="px-base pt-base pb-sm text-sm uppercase text-grey-5">{{ $t('locale.market') }}</p>

        <p class="px-base font-secondary text-base leading-snug">
          {{ $t('marketPrompt.title') }}
          <template v-if="detectedName">{{ $t('marketPrompt.detected', { country: detectedName }) }}</template>
          {{ $t('marketPrompt.question') }}
        </p>

        <!-- Scrolls rather than pushing the button off a short screen. -->
        <ul class="flex flex-col gap-xs px-base pt-sm pb-base max-h-[50svh] overflow-y-auto overscroll-contain text-lg leading-none uppercase">
          <li
            v-for="item in markets"
            :key="item.code"
          >
            <NuxtLink
              :to="switchLocalePath(item.code)"
              class="flex items-center gap-xs transition-colors duration-200 hover:text-grey-7 [&_svg]:w-[1.1em]"
              :class="{ 'text-grey-7': item.active }"
              :aria-current="item.active ? 'true' : undefined"
              external
              @click="onSelect"
            >
              <IconsGlobe v-if="item.active" />
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>

        <button
          type="button"
          class="h-[5.4rem] px-sm bg-grey-6 text-white text-base-plus leading-none lowercase hc-fill focus-visible:outline-offset-[-0.2rem]"
          @click="confirm"
        >
          {{ $t('marketPrompt.confirm') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { markets } = useLocaleNav()
const { detected, promptOpen, confirm } = useMarketPrompt()

// The visitor's country in the page's language ("Germany", "Alemania"); the
// line is left out if the runtime can't name it.
const detectedName = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'region' }).of(detected.value) ?? null
  } catch {
    return null
  }
})

onKeyStroke('Escape', () => {
  if (promptOpen.value) confirm()
})

useScrollLock(promptOpen)

// Focus starts on "yes, continue" and stays inside the panel.
const modalEl = ref(null)
useOverlayFocus(promptOpen, {
  root: () => modalEl.value,
  initial: () => modalEl.value?.querySelector('button'),
  trap: true,
})

const onSelect = () => {
  confirm()
  skipNextIntro()
}
</script>
