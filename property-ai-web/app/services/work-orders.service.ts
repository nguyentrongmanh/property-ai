import type { EmptyList, PaginatedList, WorkOrder, WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from '~/types/api'

export interface WorkOrderFilters {
  property_id?: string
  status?: string
  priority?: string
  category?: string
  page?: number
  per_page?: number
}

export interface CreateWorkOrderPayload {
  property_id: string
  email: string
  description: string
  mode?: 'ai' | 'manual'
  title?: string
  category?: WorkOrderCategory
  priority?: WorkOrderPriority
  summary?: string
}

export interface UpdateWorkOrderPayload {
  title?: string
  category?: WorkOrderCategory
  priority?: WorkOrderPriority
  summary?: string
  status?: WorkOrderStatus
}

/**
 * Typed access to the /work-orders endpoints. Pages call this instead of
 * apiFetch directly, so the request/response shapes live in one place.
 */
export function useWorkOrdersService() {
  const { apiFetch } = useApi()

  return {
    list: (query: WorkOrderFilters = {}) =>
      apiFetch<PaginatedList<WorkOrder> | EmptyList>('/work-orders', { query }),

    get: (id: string) => apiFetch<{ data: WorkOrder }>(`/work-orders/${id}`),

    create: (payload: CreateWorkOrderPayload) =>
      apiFetch<{ data: WorkOrder }>('/work-orders', { method: 'POST', body: payload }),

    update: (id: string, payload: UpdateWorkOrderPayload) =>
      apiFetch<{ data: WorkOrder }>(`/work-orders/${id}`, { method: 'PATCH', body: payload })
  }
}
