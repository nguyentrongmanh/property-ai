<script setup lang="ts">
import type { WorkOrder, WorkOrderCategory, WorkOrderPriority } from '~/types/api'
import { useAuthStore } from '~/stores/auth'
import { useAlertStore } from '~/stores/alerts'
import { WORK_ORDER_PRIORITY_COLOR } from '~/utils/badge-color'
import { formatEnumLabel } from '~/utils/enum-label'
import {
  WORK_ORDER_CATEGORY_OPTIONS,
  WORK_ORDER_PRIORITY_OPTIONS
} from '~/utils/work-order-options'

const propertiesService = usePropertiesService()
const workOrdersService = useWorkOrdersService()
const auth = useAuthStore()
const alertStore = useAlertStore()

type Mode = 'ai' | 'manual'

const mode = ref<Mode>('ai')

const modeTabs = [
  { label: 'Use AI', value: 'ai' },
  { label: 'Fill in manually', value: 'manual' }
]

const properties = ref<{ label: string, value: string }[]>([])
const propertyId = ref('')
const email = ref(auth.user?.email ?? '')
const description = ref('')

const title = ref('')
const category = ref<WorkOrderCategory>('general')
const priority = ref<WorkOrderPriority>('medium')
const summary = ref('')

const categoryOptions = WORK_ORDER_CATEGORY_OPTIONS
const priorityOptions = WORK_ORDER_PRIORITY_OPTIONS

const loading = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})
const created = ref<WorkOrder | null>(null)

async function loadProperties() {
  try {
    const res = await propertiesService.list({ per_page: 100 })
    if ('meta' in res) {
      properties.value = res.data.map(p => ({ label: `${p.name} (${p.id})`, value: p.id }))
    }
  } catch {
    // Handled implicitly: submit is disabled until a property is selected.
  }
}

onMounted(loadProperties)

const canSubmit = computed(() => {
  if (!propertyId.value || !email.value || description.value.length < 10) return false
  if (mode.value === 'manual') {
    return !!title.value && !!category.value && !!priority.value && !!summary.value
  }
  return true
})

async function handleSubmit() {
  loading.value = true
  fieldErrors.value = {}
  created.value = null
  try {
    const res = await workOrdersService.create({
      property_id: propertyId.value,
      email: email.value,
      description: description.value,
      mode: mode.value,
      ...(mode.value === 'manual'
        ? { title: title.value, category: category.value, priority: priority.value, summary: summary.value }
        : {})
    })
    created.value = res.data
    description.value = ''
    title.value = ''
    summary.value = ''
  } catch (e) {
    alertStore.error(apiErrorMessage(e, 'Could not create the work order.'))
    fieldErrors.value = apiFieldErrors(e)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <UButton
      to="/work-orders"
      variant="ghost"
      icon="i-lucide-arrow-left"
      size="sm"
    >
      Back to work orders
    </UButton>

    <UCard>
      <template #header>
        <h1 class="text-xl font-semibold">
          New work order
        </h1>
        <p class="text-sm text-muted">
          Use AI to turn a plain-language description into a structured work order, or fill in
          every field yourself.
        </p>
      </template>

      <UTabs
        v-model="mode"
        :items="modeTabs"
        :content="false"
        class="mb-4"
      />

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Property"
          :error="fieldErrors.property_id?.[0]"
        >
          <USelect
            v-model="propertyId"
            :items="properties"
            placeholder="Select a property"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Your email"
          :error="fieldErrors.email?.[0]"
        >
          <UInput
            v-model="email"
            type="email"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="mode === 'ai' ? 'Describe the problem' : 'Original report'"
          :error="fieldErrors.description?.[0]"
        >
          <UTextarea
            v-model="description"
            :rows="4"
            class="w-full"
            placeholder="e.g. the elevator in the lobby keeps stopping and makes a grinding noise"
          />
        </UFormField>

        <template v-if="mode === 'manual'">
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
            label="Summary"
            :error="fieldErrors.summary?.[0]"
          >
            <UTextarea
              v-model="summary"
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </template>

        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="!canSubmit"
        >
          Submit
        </UButton>
      </form>
    </UCard>

    <UCard v-if="created">
      <template #header>
        <h2 class="font-medium">
          Work order created
        </h2>
      </template>
      <div class="space-y-2 text-sm">
        <p class="font-medium">
          {{ created.title }}
        </p>
        <p class="text-muted">
          {{ created.summary }}
        </p>
        <div class="flex items-center gap-2">
          <UBadge
            :color="WORK_ORDER_PRIORITY_COLOR[created.priority] ?? 'neutral'"
            variant="subtle"
          >
            {{ formatEnumLabel(created.priority) }}
          </UBadge>
          <UBadge variant="outline">
            {{ created.category }}
          </UBadge>
          <UBadge variant="outline">
            {{ formatEnumLabel(created.status) }}
          </UBadge>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
