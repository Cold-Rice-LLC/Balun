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
      <!-- One height for both stages: the first stage (copy + buttons) sizes
           the panel and stays in place, invisible, while choosing. The list
           lays over the rows it leaves and adds nothing to their height
           (h-0, then min-h-full fills the grid area), so it scrolls instead
           of growing the panel. Every item is placed explicitly: auto-placed
           ones would dodge the list into extra columns. -->
      <div
        ref="modalEl"
        class="w-full max-w-[40rem] grid grid-cols-2 rounded-def overflow-hidden bg-grey-1 text-grey-6 hc-fill cursor-auto"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('locale.market')"
      >
        <p class="col-span-2 px-base pt-base pb-sm text-sm uppercase text-grey-5">{{ $t('locale.market') }}</p>

        <div
          class="col-span-2 col-start-1 row-start-2 flex flex-col gap-sm px-base pb-base"
          :class="{ invisible: choosing }"
        >
          <p class="font-secondary text-base leading-snug">
            {{ $t('marketPrompt.title') }}
            <template v-if="detectedName">{{ $t('marketPrompt.detected', { country: detectedName }) }}</template>
            {{ $t('marketPrompt.question') }}
          </p>

          <p class="flex items-center gap-xs text-lg leading-none uppercase text-grey-7 [&_svg]:w-[1.1em]">
            <IconsGlobe />
            {{ currentName }}
          </p>
        </div>

        <button
          type="button"
          class="col-start-1 row-start-3 h-[5.4rem] px-sm bg-grey-6 text-white text-base-plus leading-none lowercase hc-fill focus-visible:outline-offset-[-0.2rem]"
          :class="{ invisible: choosing }"
          @click="confirm"
        >
          {{ $t('marketPrompt.confirm') }}
        </button>

        <button
          type="button"
          class="col-start-2 row-start-3 h-[5.4rem] px-sm bg-yellow text-grey-6 text-base-plus leading-none lowercase focus-visible:outline-offset-[-0.2rem]"
          :class="{ invisible: choosing }"
          @click="choose"
        >
          {{ $t('marketPrompt.change') }}
        </button>

        <ul
          v-if="choosing"
          class="col-span-2 col-start-1 row-start-2 row-span-2 flex flex-col gap-xs px-base pb-base h-0 min-h-full overflow-y-auto overscroll-contain text-lg leading-none uppercase"
        >
          <li
            v-for="item in markets"
            :key="item.code"
          >
            <NuxtLink
              :to="switchLocalePath(item.code)"
              class="block transition-colors duration-200 hover:text-grey-7"
              :class="{ 'text-grey-7 underline underline-offset-[0.2em]': item.active }"
              :aria-current="item.active ? 'true' : undefined"
              external
              @click="onSelect"
            >
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { markets } = useLocaleNav()
const { detected, promptOpen, confirm } = useMarketPrompt()

const currentName = computed(() => markets.value.find((m) => m.active)?.name ?? '')

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

// Focus starts on "yes, continue" and stays inside the panel. The buttons
// unmount on "change market", so focus moves to the current market's link
// instead of dropping to the body.
const modalEl = ref(null)
useOverlayFocus(promptOpen, {
  root: () => modalEl.value,
  initial: () => modalEl.value?.querySelector('button'),
  trap: true,
})

const choosing = ref(false)
const choose = async () => {
  choosing.value = true
  await nextTick()
  focusByInput(modalEl.value?.querySelector('a[aria-current]') ?? modalEl.value?.querySelector('a'))
}

const onSelect = () => {
  confirm()
  skipNextIntro()
}
</script>
