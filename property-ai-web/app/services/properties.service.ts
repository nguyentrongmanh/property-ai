import type { BuildingStatus, BuildingType, CityStats, EmptyList, PaginatedList, Property } from '~/types/api'

export interface PropertyFilters {
  city?: string
  type?: string
  status?: string
  min_occupancy?: number
  page?: number
  per_page?: number
}

export interface PropertyPayload {
  name?: string
  type?: BuildingType
  status?: BuildingStatus
  city?: string
  units?: number
  occupancy_rate?: number
  amenities?: string[]
}

/**
 * Typed access to the /properties endpoints. Pages call this instead of
 * apiFetch directly, so the request/response shapes live in one place.
 */
export function usePropertiesService() {
  const { apiFetch } = useApi()

  return {
    list: (query: PropertyFilters = {}) =>
      apiFetch<PaginatedList<Property> | EmptyList>('/properties', { query }),

    get: (id: string) => apiFetch<{ data: Property }>(`/properties/${id}`),

    create: (payload: PropertyPayload) =>
      apiFetch<{ data: Property }>('/properties', { method: 'POST', body: payload }),

    update: (id: string, payload: PropertyPayload) =>
      apiFetch<{ data: Property }>(`/properties/${id}`, { method: 'PATCH', body: payload }),

    stats: () => apiFetch<{ data: CityStats[] }>('/properties/stats'),

    summary: (id: string) =>
      apiFetch<{ data: { property_id: string, summary: string } }>(`/properties/${id}/summary`)
  }
}
