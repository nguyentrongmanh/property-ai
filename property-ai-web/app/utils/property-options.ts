export const PROPERTY_TYPE_UNSPECIFIED = 'unspecified'
export const PROPERTY_FILTER_ALL = 'all'

export const PROPERTY_TYPE_OPTIONS = [
  { label: 'Office', value: 'office' },
  { label: 'Residential', value: 'residential' },
  { label: 'Retail', value: 'retail' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Mixed use', value: 'mixed_use' }
]

export const PROPERTY_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Under renovation', value: 'under_renovation' }
]

export const PROPERTY_FORM_TYPE_OPTIONS = [
  { label: 'Not specified', value: PROPERTY_TYPE_UNSPECIFIED },
  ...PROPERTY_TYPE_OPTIONS
]

export const PROPERTY_FILTER_TYPE_OPTIONS = [
  { label: 'Any type', value: PROPERTY_FILTER_ALL },
  ...PROPERTY_TYPE_OPTIONS
]

export const PROPERTY_FILTER_STATUS_OPTIONS = [
  { label: 'Any status', value: PROPERTY_FILTER_ALL },
  ...PROPERTY_STATUS_OPTIONS
]