<script setup lang="ts">
import type { CityStats } from '~/types/api'

const { apiFetch } = useApi()
const stats = ref<CityStats[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await apiFetch<{ data: CityStats[] }>('/properties/stats')
    stats.value = res.data
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not load stats.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <h1 class="text-xl font-semibold">
      Stats by city
    </h1>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted border-b border-default">
              <th class="py-2 pr-4">
                City
              </th>
              <th class="py-2 pr-4">
                Properties
              </th>
              <th class="py-2 pr-4">
                Average occupancy
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in stats"
              :key="row.city"
              class="border-b border-default last:border-0"
            >
              <td class="py-2 pr-4">
                {{ row.city }}
              </td>
              <td class="py-2 pr-4">
                {{ row.total_properties }}
              </td>
              <td class="py-2 pr-4">
                {{ row.average_occupancy_rate === null ? 'Unknown' : `${Math.round(row.average_occupancy_rate * 100)}%` }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="!loading && !stats.length"
        class="text-sm text-muted py-4 text-center"
      >
        No data yet.
      </p>
    </UCard>
  </UContainer>
</template>
