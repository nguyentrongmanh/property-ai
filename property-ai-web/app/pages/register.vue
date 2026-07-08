<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value })
    await navigateTo('/properties')
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not create your account.')
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
          Create an account
        </h1>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Name"
          name="name"
        >
          <UInput
            v-model="name"
            required
            autocomplete="name"
            class="w-full"
          />
        </UFormField>
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
          hint="At least 8 characters"
        >
          <UInput
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
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
          Register
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-muted">
          Already have an account?
          <NuxtLink
            to="/login"
            class="text-primary font-medium"
          >Log in</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
