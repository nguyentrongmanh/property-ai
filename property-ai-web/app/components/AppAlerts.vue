<script setup lang="ts">
import { useAlertStore } from '~/stores/alerts'

const alertStore = useAlertStore()
</script>

<template>
  <div class="fixed top-20 right-4 z-50 w-full max-w-sm space-y-2">
    <TransitionGroup name="app-alert">
      <UAlert
        v-for="item in alertStore.items"
        :key="item.id"
        :color="item.color"
        variant="soft"
        :title="item.title"
        :description="item.description"
        close
        @update:open="alertStore.dismiss(item.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.app-alert-enter-active,
.app-alert-leave-active {
  transition: all 0.2s ease;
}
.app-alert-enter-from,
.app-alert-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
