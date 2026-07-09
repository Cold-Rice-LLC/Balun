<template>
  <nav class="fixed bottom-0 left-0 w-full px-base">
    <ul class="grid grid-cols-2 gap-base text-lg">
      <li>
        <NuxtLink to="/">shop</NuxtLink>
      </li>

      <li>
        <button>cart (0)</button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
nav {
  z-index: 5000;

  li {
    a,
    button {
      background-color: var(--color-grey-1);
      width: 100%;
      height: var(--spacing-button-lg-height);
      display: block;
      text-align: center;
      padding: var(--spacing-sm);
      color: var(--color-grey-5);
      border-top-left-radius: var(--radius-def);
      border-top-right-radius: var(--radius-def);
    }
  }
}
</style>
