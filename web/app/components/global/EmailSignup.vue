<template>
  <form class="email-signup flex items-center gap-x-sm">
    <p class="text-lg uppercase leading-none flex-none">Sign up for emails &rarr;</p>
    <input
      type="text"
      placeholder="Email Address"
      class="flex-1"
    />
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
