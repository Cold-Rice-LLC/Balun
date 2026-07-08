<template>
  <footer class="relative">
    <IconsWordmark />

    <div class="absolute inset-0 grid grid-cols-2 px-base">
      <div class="newsletter">
        <p class="text-lg uppercase leading-none">Sign up for emails</p>
      </div>

      <div class="footer-links flex justify-between items-start">
        <nav class="text-lg text-left uppercase leading-none">
          <ul>
            <li>
              <a href="/">Instagram</a>
            </li>

            <li>
              <a href="/">TikTok</a>
            </li>

            <li>
              <a href="/">Little Red Note</a>
            </li>

            <li>
              <a href="/">Facebook</a>
            </li>

            <li>
              <a href="/">YouTube</a>
            </li>
          </ul>
        </nav>

        <nav class="text-right uppercase leading-none">
          <ul>
            <li>
              <a href="/">Privacy Policy</a>
            </li>

            <li>
              <a href="/">Terms & Conditions</a>
            </li>

            <li>
              <a href="/">Returns</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
</template>

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
}

.footer-links {
  padding: 0 0 0 11.4vw;
}
</style>
