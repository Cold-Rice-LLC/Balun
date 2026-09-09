<template>
  <!-- Once subscribed the whole row (heading included) gives way to the
       thank-you; errors go to a native alert so the row never reflows. -->
  <p
    v-if="status === 'success'"
    role="status"
    class="text-base md:text-lg uppercase leading-none"
  >
    {{ $t('newsletter.success') }}
  </p>
  <form
    v-else
    class="email-signup flex items-center gap-x-sm"
    novalidate
    @submit.prevent="submit"
  >
    <p class="text-base md:text-lg uppercase leading-none flex-none hidden lg:block">{{ $t('newsletter.heading') }}</p>
    <input
      v-model="email"
      type="email"
      name="email"
      autocomplete="email"
      required
      :placeholder="$t('newsletter.placeholder')"
      :disabled="status === 'sending'"
      class="min-w-0 flex-1"
    />
    <!-- Honeypot: off-screen and hidden from assistive tech, so only a bot
         filling every field puts anything in it. The server treats a
         non-empty value as spam. -->
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
      class="text-base md:text-lg uppercase leading-none flex-none"
      :aria-label="$t('newsletter.submit')"
    >
      <span class="block lg:hidden">{{ $t('newsletter.subscribe') }}</span>
      <span class="hidden lg:block">→</span>
    </button>
  </form>
</template>

<script setup>
const { t, locale } = useI18n()

const email = ref('')
const website = ref('')
const status = ref('idle') // idle | sending | success

// Set on the client: server-rendered time would count the whole page load
// as fill time and let a bot through the speed check.
let renderedAt = 0
onMounted(() => {
  renderedAt = Date.now()
})

const submit = async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
    window.alert(t('newsletter.invalid'))
    return
  }
  status.value = 'sending'
  try {
    await $fetch('/api/newsletter', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        website: website.value,
        elapsed: Date.now() - renderedAt,
        locale: locale.value,
      },
    })
    status.value = 'success'
  } catch {
    status.value = 'idle'
    window.alert(t('newsletter.error'))
  }
}
</script>

<style scoped>
.email-signup {
  input {
    border-bottom: 2px solid var(--color-grey-4);
    color: var(--color-grey-4);
    text-transform: uppercase;

    &::placeholder {
      color: var(--color-grey-4);
    }
  }
}
</style>
