<script setup lang="ts">
import type { PaginationMeta, WorkOrder } from '~/types/api'
import { useAlertStore } from '~/stores/alerts'
import { WORK_ORDER_PRIORITY_COLOR } from '~/utils/badge-color'
import { formatEnumLabel } from '~/utils/enum-label'
import {
  WORK_ORDER_FILTER_CATEGORY_OPTIONS,
  WORK_ORDER_FILTER_PRIORITY_OPTIONS,
  WORK_ORDER_FILTER_STATUS_OPTIONS
} from '~/utils/work-order-options'

const propertiesService = usePropertiesService()
const workOrdersService = useWorkOrdersService()
const alertStore = useAlertStore()

const ALL = 'all'

const propertyId = ref(ALL)
const status = ref(ALL)
const priority = ref(ALL)
const category = ref(ALL)
const page = ref(1)
const perPage = 15

const properties = ref([{ label: 'All properties', value: ALL }])

const statusOptions = WORK_ORDER_FILTER_STATUS_OPTIONS
const priorityOptions = WORK_ORDER_FILTER_PRIORITY_OPTIONS
const categoryOptions = WORK_ORDER_FILTER_CATEGORY_OPTIONS

const workOrders = ref<WorkOrder[]>([])
const meta = ref<PaginationMeta | null>(null)
const emptyMessage = ref('')
const loading = ref(false)

async function loadProperties() {
  try {
    const res = await propertiesService.list({ per_page: 100 })
    if ('meta' in res) {
      properties.value = [
        { label: 'All properties', value: ALL },
        ...res.data.map(p => ({ label: `${p.name} (${p.id})`, value: p.id }))
      ]
    }
  } catch {
    // Non-critical: the property filter just stays limited to "All properties".
  }
}

async function load() {
  loading.value = true
  emptyMessage.value = ''
  try {
    const res = await workOrdersService.list({
      page: page.value,
      per_page: perPage,
      property_id: propertyId.value === ALL ? undefined : propertyId.value,
      status: status.value === ALL ? undefined : status.value,
      priority: priority.value === ALL ? undefined : priority.value,
      category: category.value === ALL ? undefined : category.value
    })
    if ('meta' in res) {
      workOrders.value = res.data
      meta.value = res.meta
    } else {
      workOrders.value = []
      meta.value = null
      emptyMessage.value = res.message
    }
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not load work orders.'))
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
onMounted(async () => {
  await loadProperties()
  await load()
})
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">
        Work Orders
      </h1>
      <UButton
        to="/work-orders/new"
        icon="i-lucide-plus"
      >
        New work order
      </UButton>
    </div>

    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <UFormField label="Property">
          <USelect
            v-model="propertyId"
            :items="properties"
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
        <UFormField label="Priority">
          <USelect
            v-model="priority"
            :items="priorityOptions"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Category">
          <USelect
            v-model="category"
            :items="categoryOptions"
            class="w-full"
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

    <UCard v-else>
      <ul class="divide-y divide-default">
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
                {{ wo.property_id }} &middot; {{ wo.category }} &middot; {{ wo.created_at }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge
                :color="WORK_ORDER_PRIORITY_COLOR[wo.priority] ?? 'neutral'"
                variant="subtle"
              >
                {{ wo.priority }}
              </UBadge>
              <UBadge variant="outline">
                {{ formatEnumLabel(wo.status) }}
              </UBadge>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </UCard>

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
