<script setup lang="ts">
import type { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from '~/types/api'
import { useAlertStore } from '~/stores/alerts'
import {
  WORK_ORDER_CATEGORY_OPTIONS,
  WORK_ORDER_PRIORITY_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS
} from '~/utils/work-order-options'

const route = useRoute()
const workOrdersService = useWorkOrdersService()
const alertStore = useAlertStore()
const id = route.params.id as string

const title = ref('')
const category = ref<WorkOrderCategory>('general')
const priority = ref<WorkOrderPriority>('medium')
const summary = ref('')
const status = ref<WorkOrderStatus>('open')

const loading = ref(false)
const loadFailed = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})

const categoryOptions = WORK_ORDER_CATEGORY_OPTIONS
const priorityOptions = WORK_ORDER_PRIORITY_OPTIONS
const statusOptions = WORK_ORDER_STATUS_OPTIONS

onMounted(async () => {
  try {
    const res = await workOrdersService.get(id)
    const workOrder = res.data
    title.value = workOrder.title
    category.value = workOrder.category
    priority.value = workOrder.priority
    summary.value = workOrder.summary
    status.value = workOrder.status
  } catch (e) {
    loadFailed.value = true
    alertStore.error(apiErrorMessage(e, 'Could not load this work order.'))
  }
})

async function handleSubmit() {
  loading.value = true
  fieldErrors.value = {}
  try {
    await workOrdersService.update(id, {
      title: title.value,
      category: category.value,
      priority: priority.value,
      summary: summary.value,
      status: status.value
    })
    await navigateTo(`/work-orders/${id}`)
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not save the work order.'))
    fieldErrors.value = apiFieldErrors(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <UButton
      :to="`/work-orders/${id}`"
      variant="ghost"
      icon="i-lucide-arrow-left"
      size="sm"
    >
      Back to work order
    </UButton>

    <UCard v-if="!loadFailed">
      <template #header>
        <h1 class="text-xl font-semibold">
          Edit work order
        </h1>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Title"
          :error="fieldErrors.title?.[0]"
        >
          <UInput
            v-model="title"
            maxlength="120"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Category"
            :error="fieldErrors.category?.[0]"
          >
            <USelect
              v-model="category"
              :items="categoryOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Priority"
            :error="fieldErrors.priority?.[0]"
          >
            <USelect
              v-model="priority"
              :items="priorityOptions"
              class="w-full"
            />
          </UFormField>
        </div>

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

        <UFormField
          label="Summary"
          :error="fieldErrors.summary?.[0]"
        >
          <UTextarea
            v-model="summary"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="!title || !summary"
        >
          Save changes
        </UButton>
      </form>
    </UCard>
  </UContainer>
</template>
