export const WORK_ORDER_CATEGORY_OPTIONS = [
  { label: 'Elevator', value: 'elevator' },
  { label: 'Plumbing', value: 'plumbing' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'HVAC', value: 'hvac' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Security', value: 'security' },
  { label: 'Structural', value: 'structural' },
  { label: 'General', value: 'general' }
]

export const WORK_ORDER_PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

export const WORK_ORDER_STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

export const WORK_ORDER_FILTER_STATUS_OPTIONS = [
  { label: 'Any status', value: 'all' },
  ...WORK_ORDER_STATUS_OPTIONS
]

export const WORK_ORDER_FILTER_PRIORITY_OPTIONS = [
  { label: 'Any priority', value: 'all' },
  ...WORK_ORDER_PRIORITY_OPTIONS
]

export const WORK_ORDER_FILTER_CATEGORY_OPTIONS = [
  { label: 'Any category', value: 'all' },
  ...WORK_ORDER_CATEGORY_OPTIONS
]