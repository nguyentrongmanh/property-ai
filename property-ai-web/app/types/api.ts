export type BuildingType = 'office' | 'residential' | 'retail' | 'industrial' | 'mixed_use'
export type BuildingStatus = 'active' | 'inactive' | 'under_renovation'
export type WorkOrderCategory = 'elevator' | 'plumbing' | 'electrical' | 'hvac' | 'cleaning' | 'security' | 'structural' | 'general'
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent'
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface Property {
  id: string
  name: string
  type: BuildingType | null
  status: BuildingStatus
  city: string | null
  units: number | null
  occupancy_rate: number | null
  amenities: string[] | null
  open_work_orders?: number
}

export interface WorkOrder {
  id: string
  property_id: string
  source_text: string
  requester_email: string
  title: string
  category: WorkOrderCategory
  priority: WorkOrderPriority
  summary: string
  status: WorkOrderStatus
  created_at: string
}

export interface CityStats {
  city: string
  total_properties: number
  average_occupancy_rate: number | null
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface PaginatedList<T> {
  data: T[]
  meta: PaginationMeta
}

export interface EmptyList {
  data: []
  message: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
}
