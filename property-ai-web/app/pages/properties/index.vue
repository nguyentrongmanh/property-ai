<script setup lang="ts">
import type { PaginationMeta, Property } from '~/types/api'
import { useAlertStore } from '~/stores/alerts'
import { PROPERTY_STATUS_COLOR } from '~/utils/badge-color'
import { formatEnumLabel } from '~/utils/enum-label'
import {
  PROPERTY_FILTER_ALL,
  PROPERTY_FILTER_STATUS_OPTIONS,
  PROPERTY_FILTER_TYPE_OPTIONS
} from '~/utils/property-options'

const propertiesService = usePropertiesService()
const alertStore = useAlertStore()

const ALL = PROPERTY_FILTER_ALL

const city = ref('')
const type = ref(ALL)
const status = ref(ALL)
const minOccupancy = ref<number | undefined>(undefined)
const perPage = 12

const typeOptions = PROPERTY_FILTER_TYPE_OPTIONS
const statusOptions = PROPERTY_FILTER_STATUS_OPTIONS

const properties = ref<Property[]>([])
const meta = ref<PaginationMeta | null>(null)
const emptyMessage = ref('')
const loading = ref(false)

const {
  page,
  canPrevPage,
  canNextPage,
  resetPage,
  prevPage,
  nextPage
} = usePagination(meta)

async function load() {
  loading.value = true
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
    alertStore.error(apiErrorMessage(e, 'Could not load properties.'))
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  resetPage()
  load()
}

watch(page, load)
onMounted(load)

function occupancyLabel(rate: number | null) {
  return rate === null ? 'Unknown' : `${Math.round(rate * 100)}%`
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
      v-if="emptyMessage"
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
              :color="PROPERTY_STATUS_COLOR[property.status] ?? 'neutral'"
              variant="subtle"
            >
              {{ formatEnumLabel(property.status) }}
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
        :disabled="!canPrevPage"
        variant="soft"
        @click="prevPage"
      >
        Previous
      </UButton>
      <span class="text-sm text-muted">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
      <UButton
        :disabled="!canNextPage"
        variant="soft"
        @click="nextPage"
      >
        Next
      </UButton>
    </div>
  </UContainer>
</template>
