<script setup lang="ts">
import type { WorkOrder } from '~/types/api'
import { useAlertStore } from '~/stores/alerts'
import { WORK_ORDER_PRIORITY_COLOR, WORK_ORDER_STATUS_COLOR } from '~/utils/badge-color'
import { formatEnumLabel } from '~/utils/enum-label'

const route = useRoute()
const workOrdersService = useWorkOrdersService()
const alertStore = useAlertStore()
const id = route.params.id as string

const workOrder = ref<WorkOrder | null>(null)

onMounted(async () => {
  try {
    const res = await workOrdersService.get(id)
    workOrder.value = res.data
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not load this work order.'))
  }
})
</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <div class="flex items-center justify-between">
      <UButton
        to="/work-orders"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      >
        Back to work orders
      </UButton>
      <UButton
        v-if="workOrder"
        :to="`/work-orders/${id}/edit`"
        variant="soft"
        icon="i-lucide-pencil"
        size="sm"
      >
        Edit
      </UButton>
    </div>

    <UCard v-if="workOrder">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            {{ workOrder.title }}
          </h1>
          <p class="text-sm text-muted">
            <NuxtLink
              :to="`/properties/${workOrder.property_id}`"
              class="text-primary"
            >
              {{ workOrder.property_id }}
            </NuxtLink>
            &middot; {{ workOrder.requester_email }} &middot; {{ workOrder.created_at }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UBadge
            :color="WORK_ORDER_PRIORITY_COLOR[workOrder.priority] ?? 'neutral'"
            variant="subtle"
          >
            {{ formatEnumLabel(workOrder.priority) }}
          </UBadge>
          <UBadge
            :color="WORK_ORDER_STATUS_COLOR[workOrder.status] ?? 'neutral'"
            variant="outline"
          >
            {{ formatEnumLabel(workOrder.status) }}
          </UBadge>
        </div>
      </div>

      <div class="mt-4 space-y-4 text-sm">
        <div>
          <p class="text-muted">
            Category
          </p>
          <p class="font-medium">
            {{ workOrder.category }}
          </p>
        </div>
        <div>
          <p class="text-muted">
            Summary
          </p>
          <p class="font-medium">
            {{ workOrder.summary }}
          </p>
        </div>
        <div>
          <p class="text-muted">
            Original report
          </p>
          <p class="font-medium">
            {{ workOrder.source_text }}
          </p>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
