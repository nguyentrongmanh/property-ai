export const PROPERTY_STATUS_COLOR: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  under_renovation: 'warning'
}

export const WORK_ORDER_PRIORITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'neutral'
}

export const WORK_ORDER_STATUS_COLOR: Record<string, 'success' | 'neutral' | 'info' | 'error'> = {
  open: 'info',
  in_progress: 'neutral',
  completed: 'success',
  cancelled: 'error'
}