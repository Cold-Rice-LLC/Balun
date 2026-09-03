<template>
  <footer class="relative">
    <!-- Mobile stacks in DOM order: newsletter, the links row, wordmark at
         the very bottom. From 768px the links-container overlays the
         wordmark absolutely, so the order change is invisible there. -->
    <div class="links-container md:absolute md:inset-0 grid md:grid-cols-2 gap-y-base md:gap-y-0 px-base">
      <div class="newsletter">
        <EmailSignup />
      </div>

      <div class="footer-links flex justify-between items-start">
        <nav class="text-base md:text-lg text-left uppercase leading-none">
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

    <IconsWordmark />
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
  padding-bottom: calc(var(--spacing-button-md-height) + var(--spacing-base));
  color: var(--color-grey-4);
  overflow: hidden;

  @media (min-width: 768px) {
    padding-bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  }
}

body.template-home footer {
  margin-top: 10rem;

  @media (min-width: 768px) {
    margin-top: 20rem;
  }
}

body.template-pdp footer,
body.template-info footer,
body.template-live footer {
  margin-top: 10rem;
}

/* Mobile: gutters + clearance above the bottom-of-stack wordmark. Desktop's
   overlay layout keeps the deliberate full-bleed (the +1px kills a subpixel
   edge gap). */
:deep(.icon-wordmark) {
  width: calc(100vw - var(--spacing-base) * 2);
  height: auto;
  pointer-events: auto;
  margin-top: var(--spacing-base);
  margin-inline: var(--spacing-base);

  @media (min-width: 768px) {
    width: calc(100vw + 1px);
    margin-top: 0;
    margin-inline: 0;
  }
}

.newsletter {
  @media (min-width: 768px) {
    padding-left: 8.1vw;
  }
}

.newsletter :deep(p),
.newsletter :deep(input) {
  pointer-events: auto;
}

.footer-links {
  @media (min-width: 768px) {
    padding-left: 11.4vw;
  }
}

/* :deep so the re-enable reaches into child components (switcher triggers)
   — the links-container's pointer-events: none would swallow them. Kept
   top-level: the scoped-CSS compiler mangles :deep() inside nested blocks. */
.footer-links :deep(a),
.footer-links :deep(button) {
  pointer-events: auto;
}

.footer-links :deep(a) {
  transition: color 0.3s;
}

.footer-links :deep(a:hover) {
  color: var(--color-grey-7);
}

/* The switchers' trigger is text-lg inside LocaleModal (right for desktop
   everywhere it's used); the mobile footer runs a size down like its navs. */
.footer-links :deep(.trigger) {
  @media (max-width: 767px) {
    font-size: var(--text-base);
  }
}

.links-container {
  pointer-events: none;
}
</style>
