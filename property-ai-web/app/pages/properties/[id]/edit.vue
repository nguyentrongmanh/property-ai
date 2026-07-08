<script setup lang="ts">
import type { Property } from '~/types/api'

const route = useRoute()
const { apiFetch } = useApi()
const id = route.params.id as string

const UNSPECIFIED = 'unspecified'

const name = ref('')
const type = ref(UNSPECIFIED)
const status = ref('active')
const city = ref('')
const units = ref<number | undefined>(undefined)
const occupancyRate = ref<number | undefined>(undefined)
const amenities = ref('')

const loading = ref(false)
const loadError = ref('')
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const typeOptions = [
  { label: 'Not specified', value: UNSPECIFIED },
  { label: 'Office', value: 'office' },
  { label: 'Residential', value: 'residential' },
  { label: 'Retail', value: 'retail' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Mixed use', value: 'mixed_use' }
]
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Under renovation', value: 'under_renovation' }
]

onMounted(async () => {
  try {
    const res = await apiFetch<{ data: Property }>(`/properties/${id}`)
    const property = res.data
    name.value = property.name
    type.value = property.type ?? UNSPECIFIED
    status.value = property.status
    city.value = property.city ?? ''
    units.value = property.units ?? undefined
    occupancyRate.value = property.occupancy_rate ?? undefined
    amenities.value = property.amenities?.join(', ') ?? ''
  } catch (e) {
    loadError.value = apiErrorMessage(e, 'Could not load this property.')
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  fieldErrors.value = {}
  try {
    await apiFetch(`/properties/${id}`, {
      method: 'PATCH',
      body: {
        name: name.value,
        type: type.value === UNSPECIFIED ? undefined : type.value,
        status: status.value,
        city: city.value || undefined,
        units: units.value ?? undefined,
        occupancy_rate: occupancyRate.value ?? undefined,
        amenities: amenities.value
          ? amenities.value.split(',').map(a => a.trim()).filter(Boolean)
          : undefined
      }
    })
    await navigateTo(`/properties/${id}`)
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not save the property.')
    fieldErrors.value = apiFieldErrors(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <UButton
      :to="`/properties/${id}`"
      variant="ghost"
      icon="i-lucide-arrow-left"
      size="sm"
    >
      Back to property
    </UButton>

    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      :title="loadError"
    />

    <UCard v-else>
      <template #header>
        <h1 class="text-xl font-semibold">
          Edit property
        </h1>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Name"
          :error="fieldErrors.name?.[0]"
        >
          <UInput
            v-model="name"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Type"
            :error="fieldErrors.type?.[0]"
          >
            <USelect
              v-model="type"
              :items="typeOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Status"
            :error="fieldErrors.status?.[0]"
          >
            <USelect
              v-model="status"
              :items="statusOptions"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="City"
          :error="fieldErrors.city?.[0]"
        >
          <UInput
            v-model="city"
            placeholder="e.g. Amsterdam"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Units"
            :error="fieldErrors.units?.[0]"
          >
            <UInput
              v-model.number="units"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Occupancy rate"
            hint="0 to 1, e.g. 0.86"
            :error="fieldErrors.occupancy_rate?.[0]"
          >
            <UInput
              v-model.number="occupancyRate"
              type="number"
              min="0"
              max="1"
              step="0.01"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Amenities"
          hint="Comma-separated, e.g. elevator, parking"
          :error="fieldErrors.amenities?.[0]"
        >
          <UInput
            v-model="amenities"
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
          :disabled="!name"
        >
          Save changes
        </UButton>
      </form>
    </UCard>
  </UContainer>
</template>
