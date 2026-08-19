<template>
  <!-- prevent: no signup backend yet — the submit arrow must not reload
       the page in the meantime. -->
  <form
    class="email-signup flex items-center gap-x-sm"
    @submit.prevent
  >
    <p class="text-base md:text-lg uppercase leading-none flex-none hidden lg:block">{{ $t('newsletter.heading') }}</p>
    <input
      type="text"
      :placeholder="$t('newsletter.placeholder')"
      class="min-w-0 flex-1"
    />
    <button
      type="submit"
      class="text-base md:text-lg uppercase leading-none flex-none"
      :aria-label="$t('newsletter.submit')"
    >
      <span class="block lg:hidden">Subscribe</span>
      <span class="hidden lg:block">→</span>
    </button>
  </form>
</template>

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
