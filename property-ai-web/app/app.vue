<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

useHead({
  htmlAttrs: { lang: 'en' }
})
useSeoMeta({
  title: 'Property AI',
  description: 'Property portfolio and AI-assisted maintenance work orders.'
})

const auth = useAuthStore()
const route = useRoute()

const navLinks = [
  { label: 'Properties', to: '/properties' },
  { label: 'Work Orders', to: '/work-orders' },
  { label: 'Stats', to: '/stats' }
]

const showChrome = computed(() => !['/login', '/register'].includes(route.path))

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <AppAlerts />

    <header
      v-if="showChrome"
      class="border-b border-default"
    >
      <div class="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-6">
          <NuxtLink
            to="/properties"
            class="font-semibold text-highlighted"
          >
            Property AI
          </NuxtLink>
          <nav class="flex items-center gap-4">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-sm text-muted hover:text-highlighted"
              active-class="text-highlighted font-medium"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <UColorModeButton />
          <span
            v-if="auth.user"
            class="text-sm text-muted hidden sm:inline"
          >{{ auth.user.email }}</span>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            @click="handleLogout"
          >
            Log out
          </UButton>
        </div>
      </div>
    </header>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
