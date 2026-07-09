<template>
  <header class="fixed top-0 left-0 w-full grid grid-cols-3 p-base">
    <div></div>

    <div class="flex justify-center items-center">
      <nuxt-link
        to="/"
        class="home-link text-grey-3"
      >
        <span class="sr-only">Balun</span>

        <IconsLogo />
      </nuxt-link>
    </div>

    <nav class="flex justify-end items-center">
      <ul class="uppercase text-xs flex gap-x-xs">
        <li>
          <nuxt-link
            to="/feed"
            class="bg-yellow"
            >Feed</nuxt-link
          >
        </li>

        <li>
          <nuxt-link
            to="/info"
            class="bg-purple text-white"
            >Info</nuxt-link
          >
        </li>
      </ul>
    </nav>

    <nuxt-link
      to="/live"
      class="live-link"
    >
      <IconsRing />
      <span>12M Viewing</span>
      <span>Live in Beijing</span>
    </nuxt-link>
  </header>
</template>

<style scoped>
header {
  z-index: 5000;
}

.home-link {
  svg {
    width: 5.5rem;
  }
}

nav {
  a {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: calc(infinity * 1px);
  }
}

.live-link {
  position: absolute;
  right: 0px;
  top: 7.7rem;
  background-color: var(--color-grey-1);
  padding: var(--spacing-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  writing-mode: sideways-lr;
  height: max-content;
  color: var(--color-red);
  border-top-left-radius: var(--radius-def);
  border-bottom-left-radius: var(--radius-def);
  line-height: 1;
  font-size: var(--text-sm);

  & > * {
    flex: none;
  }
}

.live-link :deep(.icon-ring) {
  width: 1.1rem;
}
</style>
