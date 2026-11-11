<template>
  <div class="mt-sm font-secondary text-grey-7">
    <p v-if="status === 'success'">{{ $t('backInStock.success') }}</p>

    <button
      v-else-if="!formOpen"
      type="button"
      class="hover:underline"
      @click="openForm"
    >
      {{ $t('backInStock.notify') }}
    </button>

    <form
      v-else
      class="back-in-stock-form mx-auto -mb-px flex w-[35rem] max-w-full items-center gap-x-sm border-b border-grey-4"
      novalidate
      :aria-busy="status === 'sending'"
      @submit.prevent="submit"
    >
      <label
        :for="inputId"
        class="sr-only"
        >{{ $t('backInStock.notify') }}</label
      >
      <input
        :id="inputId"
        ref="inputEl"
        v-model="email"
        type="email"
        name="email"
        autocomplete="email"
        required
        :placeholder="$t('backInStock.placeholder')"
        :disabled="status === 'sending'"
        class="min-w-0 flex-1 bg-transparent"
      />
      <!-- Honeypot: off-screen and hidden from assistive tech, so only a bot
           filling every field puts anything in it. -->
      <input
        v-model="website"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="sr-only"
      />
      <button
        type="submit"
        :disabled="status === 'sending'"
        class="flex-none hover:underline"
      >
        {{ $t('backInStock.submit') }}
      </button>
    </form>

    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ status === 'success' ? $t('backInStock.success') : '' }}
    </p>
  </div>
</template>

<script setup>
/**
 * The PDP's "notify me when back in stock", under the price while the product
 * is sold out: a text button in the price's style that opens an email field
 * in place, then a thank-you. Posts to /api/back-in-stock, which subscribes
 * the address in Klaviyo to every variant passed in — Klaviyo emails them
 * when one is restocked (docs/back-in-stock.md). Errors go to a native alert,
 * as the footer signup's do.
 */
const props = defineProps({
  // Shopify variant GIDs to be notified about.
  variantIds: { type: Array, required: true },
})

const { t } = useI18n()
const inputId = useId()

const formOpen = ref(false)
const email = ref('')
const website = ref('')
const status = ref('idle') // idle | sending | success
const inputEl = ref(null)

// Fill time counts from when the field appears (the spam guard's speed check).
let openedAt = 0
const openForm = async () => {
  formOpen.value = true
  openedAt = Date.now()
  await nextTick()
  inputEl.value?.focus()
}

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
        variantIds: props.variantIds,
        website: website.value,
        elapsed: Date.now() - openedAt,
      },
    })
    status.value = 'success'
  } catch {
    status.value = 'idle'
    window.alert(t('backInStock.error'))
  }
}
</script>

<style scoped>
/* Text fields match :focus-visible on click as well as Tab, so a ring would
   box every click — the form's underline darkens instead (the footer
   signup's treatment). */
.back-in-stock-form {
  &:focus-within {
    border-color: var(--color-grey-7);
  }

  & input {
    &::placeholder {
      color: var(--color-grey-4);
    }

    &:focus-visible {
      outline: none;
    }
  }
}

/* High contrast: both greys turn the text color, so focus gets the ring. */
html.high-contrast .back-in-stock-form input:focus-visible {
  outline: 0.2rem solid currentColor;
}
</style>
