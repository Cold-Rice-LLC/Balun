<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator color="#ff1b18" />

  <NuxtLayout>
    <NuxtPage :page-key="(route) => route.path" />
  </NuxtLayout>
</template>
