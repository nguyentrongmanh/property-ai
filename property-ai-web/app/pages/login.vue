<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    await navigateTo('/properties')
  } catch (e) {
    error.value = apiErrorMessage(e, 'Invalid email or password.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-lg font-semibold">
          Log in
        </h1>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Password"
          name="password"
        >
          <UInput
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
        />

        <UButton
          type="submit"
          block
          :loading="loading"
        >
          Log in
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-muted">
          No account?
          <NuxtLink
            to="/register"
            class="text-primary font-medium"
          >Register</NuxtLink>
        </p>
        <p class="text-xs text-muted mt-2">
          Demo login: demo@example.com / password123
        </p>
      </template>
    </UCard>
  </div>
</template>
