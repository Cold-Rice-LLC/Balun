<template>
  <footer class="relative">
    <IconsWordmark />

    <div class="links-container absolute inset-0 grid grid-cols-2 px-base">
      <div class="newsletter">
        <EmailSignup />
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

        <div class="flex items-end flex-col gap-y-sm">
          <div class="flex items-end flex-col">
            <MarketSwitcher />
            <LanguageSwitcher />
          </div>

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
    </div>
  </footer>
</template>

<script setup>
const localePath = useLocalePath()
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
  pointer-events: auto;
}

.newsletter {
  padding: 0 0 0 8.1vw;

  p {
    pointer-events: auto;
  }
}

.footer-links {
  padding: 0 0 0 11.4vw;

  a,
  button {
    pointer-events: auto;
  }

  a {
    transition: color 0.3s;

    &:hover {
      color: var(--color-grey-7);
    }
  }
}

.links-container {
  pointer-events: none;
}
</style>
