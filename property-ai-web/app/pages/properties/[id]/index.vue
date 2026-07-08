<script setup lang="ts">
import type { Property, WorkOrder } from '~/types/api'
import { useAlertStore } from '~/stores/alerts'
import { PROPERTY_STATUS_COLOR, WORK_ORDER_PRIORITY_COLOR } from '~/utils/badge-color'
import { formatEnumLabel } from '~/utils/enum-label'

const route = useRoute()
const propertiesService = usePropertiesService()
const workOrdersService = useWorkOrdersService()
const alertStore = useAlertStore()
const id = route.params.id as string

const property = ref<Property | null>(null)
const workOrders = ref<WorkOrder[]>([])

const summary = ref('')
const summaryLoading = ref(false)

async function load() {
  try {
    const propertyRes = await propertiesService.get(id)
    property.value = propertyRes.data

    const woRes = await workOrdersService.list({ property_id: id, per_page: 50 })
    workOrders.value = 'meta' in woRes ? woRes.data : []
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not load this property.'))
  }
}

async function generateSummary() {
  summaryLoading.value = true
  summary.value = ''
  try {
    const res = await propertiesService.summary(id)
    summary.value = res.data.summary
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not generate a summary right now.'))
  } finally {
    summaryLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex items-center justify-between">
      <UButton
        to="/properties"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      >
        Back to properties
      </UButton>
      <UButton
        v-if="property"
        :to="`/properties/${id}/edit`"
        variant="soft"
        icon="i-lucide-pencil"
        size="sm"
      >
        Edit
      </UButton>
    </div>

    <template v-if="property">
      <UCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-xl font-semibold">
              {{ property.name }}
            </h1>
            <p class="text-sm text-muted">
              {{ property.city ?? 'Unknown city' }}
              <template v-if="property.type">
                &middot; {{ formatEnumLabel(property.type) }}
              </template>
            </p>
          </div>
          <UBadge
            :color="PROPERTY_STATUS_COLOR[property.status] ?? 'neutral'"
            variant="subtle"
          >
            {{ formatEnumLabel(property.status) }}
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
              {{ property.occupancy_rate === null ? '----' : `${Math.round(property.occupancy_rate * 100)}%` }}
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
        <p
          v-if="summary"
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
          >
            <NuxtLink
              :to="`/work-orders/${wo.id}`"
              class="py-3 flex items-start justify-between gap-4 hover:bg-elevated -mx-2 px-2 rounded"
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
                  :color="WORK_ORDER_PRIORITY_COLOR[wo.priority] ?? 'neutral'"
                  variant="subtle"
                >
                  {{ formatEnumLabel(wo.priority) }}
                </UBadge>
                <UBadge variant="outline">
                  {{ formatEnumLabel(wo.status) }}
                </UBadge>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </UCard>
    </template>
  </UContainer>
</template>
