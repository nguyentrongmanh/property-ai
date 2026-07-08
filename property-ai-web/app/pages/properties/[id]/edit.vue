<script setup lang="ts">
import type { BuildingStatus, BuildingType } from '~/types/api'
import { useAlertStore } from '~/stores/alerts'
import {
  PROPERTY_FORM_TYPE_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  PROPERTY_TYPE_UNSPECIFIED
} from '~/utils/property-options'

const route = useRoute()
const propertiesService = usePropertiesService()
const alertStore = useAlertStore()
const id = route.params.id as string

const UNSPECIFIED = PROPERTY_TYPE_UNSPECIFIED

const name = ref('')
const type = ref<BuildingType | typeof UNSPECIFIED>(UNSPECIFIED)
const status = ref<BuildingStatus>('active')
const city = ref('')
const units = ref<number | undefined>(undefined)
const occupancyRate = ref<number | undefined>(undefined)
const amenities = ref('')

const loading = ref(false)
const loadFailed = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})

const typeOptions = PROPERTY_FORM_TYPE_OPTIONS
const statusOptions = PROPERTY_STATUS_OPTIONS

onMounted(async () => {
  try {
    const res = await propertiesService.get(id)
    const property = res.data
    name.value = property.name
    type.value = property.type ?? UNSPECIFIED
    status.value = property.status
    city.value = property.city ?? ''
    units.value = property.units ?? undefined
    occupancyRate.value = property.occupancy_rate ?? undefined
    amenities.value = property.amenities?.join(', ') ?? ''
  } catch (e) {
    loadFailed.value = true
    alertStore.error(apiErrorMessage(e, 'Could not load this property.'))
  }
})

async function handleSubmit() {
  loading.value = true
  fieldErrors.value = {}
  try {
    await propertiesService.update(id, {
      name: name.value,
      type: type.value === UNSPECIFIED ? undefined : type.value,
      status: status.value,
      city: city.value || undefined,
      units: units.value ?? undefined,
      occupancy_rate: occupancyRate.value ?? undefined,
      amenities: amenities.value
        ? amenities.value.split(',').map(a => a.trim()).filter(Boolean)
        : undefined
    })
    await navigateTo(`/properties/${id}`)
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not save the property.'))
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

    <UCard v-if="!loadFailed">
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
