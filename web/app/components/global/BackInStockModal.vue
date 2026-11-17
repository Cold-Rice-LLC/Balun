<template>
  <!-- The market prompt's panel and blurred backdrop, holding the footer's
       signup row (its focused underline set dark for the light panel). The
       root is the backdrop, so a click outside the panel
       (@click.self) or Escape closes it. Focus starts in the email field,
       stays in the panel, and goes back to the button that opened it. -->
  <Transition
    enter-active-class="transition-opacity duration-300 motion-reduce:transition-none"
    leave-active-class="transition-opacity duration-300 motion-reduce:transition-none"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-(--z-modal-backdrop) grid place-items-center p-gutter bg-black/15 backdrop-blur-[0.6rem] cursor-pointer"
      @click.self="close"
    >
      <div
        ref="modalEl"
        class="w-full max-w-[48rem] flex flex-col gap-y-base p-base rounded-def bg-grey-1 text-grey-7 hc-fill cursor-auto [--signup-focus:var(--color-black)]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="headingId"
      >
        <div class="flex items-start justify-between gap-x-base">
          <p
            :id="headingId"
            class="font-secondary text-base leading-snug"
          >
            {{ $t('backInStock.heading', { title: shownTitle }) }}
          </p>
          <button
            type="button"
            class="flex-none text-sm uppercase text-grey-5 hover:text-grey-7"
            @click="close"
          >
            {{ $t('backInStock.close') }}
          </button>
        </div>

        <p
          v-if="status === 'success'"
          ref="successEl"
          tabindex="-1"
          class="text-base md:text-lg uppercase leading-none outline-none"
        >
          {{ $t('backInStock.success') }}
        </p>
        <SignupRow
          v-else
          v-model="email"
          v-model:honeypot="website"
          hide-label
          :label="$t('backInStock.placeholder')"
          :placeholder="$t('backInStock.placeholder')"
          :submit-label="$t('backInStock.submit')"
          :sending="status === 'sending'"
          class="text-base md:text-lg"
          @submit="submit"
        />

        <p
          class="sr-only"
          aria-live="polite"
        >
          {{ status === 'success' ? $t('backInStock.success') : '' }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * The back-in-stock popup (state in useBackInStock): an email field that
 * posts the product's handle to /api/back-in-stock, which subscribes the
 * address in Klaviyo to every size of it; Klaviyo emails when one is
 * restocked (docs/back-in-stock.md). Errors go to a native alert, as the
 * footer signup's do.
 */
const { t } = useI18n()
const market = useMarket()
const route = useRoute()
const { product, isOpen, close } = useBackInStock()

const headingId = useId()
const email = ref('')
const website = ref('')
const status = ref('idle') // idle | sending | success
const modalEl = ref(null)
const successEl = ref(null)

// The title stays put through the leave transition, after product clears.
const shownTitle = ref('')

// Fill time counts from opening (the spam guard's speed check). Each open
// starts a fresh form; the email typed last time is kept.
let openedAt = 0
watch(product, (next) => {
  if (!next) return
  shownTitle.value = next.title
  status.value = 'idle'
  openedAt = Date.now()
})

watch(() => route.fullPath, close)

onKeyStroke('Escape', () => {
  if (isOpen.value) close()
})

useScrollLock(isOpen)

useOverlayFocus(isOpen, {
  root: () => modalEl.value,
  initial: () => modalEl.value?.querySelector('input[name="email"]'),
  trap: true,
})

const submit = async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
    window.alert(t('backInStock.invalid'))
    return
  }
  status.value = 'sending'
  try {
    await $fetch('/api/back-in-stock', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        handle: product.value?.handle,
        country: market.value.country,
        website: website.value,
        elapsed: Date.now() - openedAt,
      },
    })
    status.value = 'success'
    await nextTick()
    successEl.value?.focus()
  } catch {
    status.value = 'idle'
    window.alert(t('backInStock.error'))
  }
}
</script>
