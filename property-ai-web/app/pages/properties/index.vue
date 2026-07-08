<script setup lang="ts">
import type { PaginationMeta, Property } from '~/types/api'

const propertiesService = usePropertiesService()

const ALL = 'all'

const city = ref('')
const type = ref(ALL)
const status = ref(ALL)
const minOccupancy = ref<number | undefined>(undefined)
const page = ref(1)
const perPage = 12

const typeOptions = [
  { label: 'Any type', value: ALL },
  { label: 'Office', value: 'office' },
  { label: 'Residential', value: 'residential' },
  { label: 'Retail', value: 'retail' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Mixed use', value: 'mixed_use' }
]
const statusOptions = [
  { label: 'Any status', value: ALL },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Under renovation', value: 'under_renovation' }
]

const properties = ref<Property[]>([])
const meta = ref<PaginationMeta | null>(null)
const emptyMessage = ref('')
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  emptyMessage.value = ''
  try {
    const res = await propertiesService.list({
      page: page.value,
      per_page: perPage,
      city: city.value || undefined,
      type: type.value === ALL ? undefined : type.value,
      status: status.value === ALL ? undefined : status.value,
      min_occupancy: minOccupancy.value ?? undefined
    })
    if ('meta' in res) {
      properties.value = res.data
      meta.value = res.meta
    } else {
      properties.value = []
      meta.value = null
      emptyMessage.value = res.message
    }
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not load properties.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  load()
}

function prevPage() {
  page.value -= 1
}

function nextPage() {
  page.value += 1
}

watch(page, load)
onMounted(load)

function occupancyLabel(rate: number | null) {
  return rate === null ? 'Unknown' : `${Math.round(rate * 100)}%`
}

const statusColor: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  under_renovation: 'warning'
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">
        Properties
      </h1>
      <UButton
        to="/properties/new"
        icon="i-lucide-plus"
      >
        New property
      </UButton>
    </div>

    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <UFormField label="City">
          <UInput
            v-model="city"
            placeholder="e.g. Amsterdam"
            class="w-full"
            @keyup.enter="applyFilters"
          />
        </UFormField>
        <UFormField label="Type">
          <USelect
            v-model="type"
            :items="typeOptions"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Status">
          <USelect
            v-model="status"
            :items="statusOptions"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Min occupancy">
          <UInput
            v-model.number="minOccupancy"
            type="number"
            min="0"
            max="1"
            step="0.05"
            class="w-full"
            @keyup.enter="applyFilters"
          />
        </UFormField>
      </div>
      <div class="mt-4">
        <UButton
          :loading="loading"
          @click="applyFilters"
        >
          Apply filters
        </UButton>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
    />
    <UAlert
      v-else-if="emptyMessage"
      color="neutral"
      variant="soft"
      :title="emptyMessage"
    />

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="property in properties"
        :key="property.id"
        :to="`/properties/${property.id}`"
      >
        <UCard class="h-full hover:ring-2 hover:ring-primary transition">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium">
                {{ property.name }}
              </p>
              <p class="text-sm text-muted">
                {{ property.city ?? 'Unknown city' }}
              </p>
            </div>
            <UBadge
              :color="statusColor[property.status] ?? 'neutral'"
              variant="subtle"
            >
              {{ property.status }}
            </UBadge>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm text-muted">
            <span>{{ property.type ?? 'Unknown type' }}</span>
            <span>Occupancy {{ occupancyLabel(property.occupancy_rate) }}</span>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <div
      v-if="meta && meta.last_page > 1"
      class="flex items-center justify-center gap-3 pt-4"
    >
      <UButton
        :disabled="page <= 1"
        variant="soft"
        @click="prevPage"
      >
        Previous
      </UButton>
      <span class="text-sm text-muted">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
      <UButton
        :disabled="page >= meta.last_page"
        variant="soft"
        @click="nextPage"
      >
        Next
      </UButton>
    </div>
  </UContainer>
</template>
