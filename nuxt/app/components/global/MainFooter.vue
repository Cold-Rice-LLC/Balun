<template>
  <footer class="relative">
    <nuxt-link
      to="/"
      class="wordmark-link"
    >
      <IconsWordmark />
    </nuxt-link>

    <div class="links-container absolute inset-0 grid grid-cols-2 px-base">
      <div class="newsletter">
        <p class="text-lg uppercase leading-none">Sign up for emails</p>
      </div>

      <div class="footer-links flex justify-between items-start">
        <nav class="text-lg text-left uppercase leading-none">
          <ul>
            <li
              v-for="(link, i) in primaryLinks"
              :key="i"
            >
              <AppLink :link="link" />
            </li>
          </ul>
        </nav>

        <nav class="text-right uppercase leading-none">
          <ul>
            <li
              v-for="(link, i) in secondaryLinks"
              :key="i"
            >
              <AppLink :link="link" />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup>
const { data: settings } = await useSiteSettings()

const primaryLinks = computed(() => settings.value?.footerPrimaryLinks ?? [])
const secondaryLinks = computed(() => settings.value?.footerSecondaryLinks ?? [])
</script>

<style scoped>
footer {
  padding-bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  color: var(--color-grey-4);
  overflow: hidden;
}

:deep(.icon-wordmark) {
  width: calc(100vw + 1px);
  height: auto;
}

.newsletter {
  padding: 0 0 0 8.1vw;

  p {
    pointer-events: auto;
  }
}

.footer-links {
  padding: 0 0 0 11.4vw;

  a {
    pointer-events: auto;
  }
}

.links-container {
  pointer-events: none;
}
</style>
