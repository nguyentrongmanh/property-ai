<script setup lang="ts">
import type { EmptyList, PaginatedList, Property, WorkOrder } from '~/types/api'

const route = useRoute()
const { apiFetch } = useApi()
const id = route.params.id as string

const property = ref<Property | null>(null)
const workOrders = ref<WorkOrder[]>([])
const error = ref('')

const summary = ref('')
const summaryLoading = ref(false)
const summaryError = ref('')

async function load() {
  error.value = ''
  try {
    const propertyRes = await apiFetch<{ data: Property }>(`/properties/${id}`)
    property.value = propertyRes.data

    const woRes = await apiFetch<PaginatedList<WorkOrder> | EmptyList>('/work-orders', {
      query: { property_id: id, per_page: 50 }
    })
    workOrders.value = 'meta' in woRes ? woRes.data : []
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not load this property.')
  }
}

async function generateSummary() {
  summaryLoading.value = true
  summaryError.value = ''
  summary.value = ''
  try {
    const res = await apiFetch<{ data: { property_id: string, summary: string } }>(`/properties/${id}/summary`)
    summary.value = res.data.summary
  } catch (e) {
    summaryError.value = apiErrorMessage(e, 'Could not generate a summary right now.')
  } finally {
    summaryLoading.value = false
  }
}

onMounted(load)

const priorityColor: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'neutral'
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <UButton
      to="/properties"
      variant="ghost"
      icon="i-lucide-arrow-left"
      size="sm"
    >
      Back to properties
    </UButton>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <template v-else-if="property">
      <UCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-xl font-semibold">
              {{ property.name }}
            </h1>
            <p class="text-sm text-muted">
              {{ property.city ?? 'Unknown city' }} &middot; {{ property.type ?? 'Unknown type' }}
            </p>
          </div>
          <UBadge variant="subtle">
            {{ property.status }}
          </UBadge>
        </div>

        <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-muted">
              Units
            </p>
            <p class="font-medium">
              {{ property.units ?? 'Unknown' }}
            </p>
          </div>
          <div>
            <p class="text-muted">
              Occupancy
            </p>
            <p class="font-medium">
              {{ property.occupancy_rate === null ? 'Unknown' : `${Math.round(property.occupancy_rate * 100)}%` }}
            </p>
          </div>
          <div>
            <p class="text-muted">
              Open work orders
            </p>
            <p class="font-medium">
              {{ property.open_work_orders ?? 0 }}
            </p>
          </div>
          <div>
            <p class="text-muted">
              Amenities
            </p>
            <p class="font-medium">
              {{ property.amenities?.length ? property.amenities.join(', ') : 'None recorded' }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium">
              AI summary
            </h2>
            <UButton
              size="sm"
              :loading="summaryLoading"
              @click="generateSummary"
            >
              Generate summary
            </UButton>
          </div>
        </template>
        <UAlert
          v-if="summaryError"
          color="error"
          variant="soft"
          :title="summaryError"
        />
        <p
          v-else-if="summary"
          class="text-sm"
        >
          {{ summary }}
        </p>
        <p
          v-else
          class="text-sm text-muted"
        >
          No summary generated yet.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-medium">
            Work orders
          </h2>
        </template>
        <p
          v-if="!workOrders.length"
          class="text-sm text-muted"
        >
          No work orders for this property yet.
        </p>
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="wo in workOrders"
            :key="wo.id"
            class="py-3 flex items-start justify-between gap-4"
          >
            <div>
              <p class="font-medium text-sm">
                {{ wo.title }}
              </p>
              <p class="text-xs text-muted">
                {{ wo.category }} &middot; {{ wo.created_at }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge
                :color="priorityColor[wo.priority] ?? 'neutral'"
                variant="subtle"
              >
                {{ wo.priority }}
              </UBadge>
              <UBadge variant="outline">
                {{ wo.status }}
              </UBadge>
            </div>
          </li>
        </ul>
      </UCard>
    </template>
  </UContainer>
</template>
